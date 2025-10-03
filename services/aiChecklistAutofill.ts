import { Project, ChecklistQuestion, DeviceData, CameraData, AccessDoorData } from '../types';
import { GoogleGenAI } from '@google/genai';

export interface AutofillResult {
    questionId: string;
    answer: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
}

export class ChecklistAutofillService {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI(apiKey);
    }

    async generateProjectContext(project: Project): Promise<string> {
        const context = {
            projectName: project.name,
            clientName: project.clientName,
            address: project.address,
            projectType: project.projectType,
            floorplans: project.floorplans.map(fp => ({
                name: fp.name,
                inventory: fp.inventory.map(item => ({
                    type: item.type,
                    deviceType: item.deviceType,
                    name: item.name,
                    data: item.data
                }))
            })),
            projectLevelInventory: project.projectLevelInventory.map(item => ({
                type: item.type,
                deviceType: item.deviceType,
                name: item.name,
                data: item.data
            })),
            existingAnswers: project.checklistAnswers
        };

        return JSON.stringify(context, null, 2);
    }

    async autofillQuestions(project: Project, questions: ChecklistQuestion[]): Promise<AutofillResult[]> {
        const projectContext = await this.generateProjectContext(project);
        
        // Group questions by category for more focused AI analysis
        const questionsByCategory = questions.reduce((acc, q) => {
            if (!acc[q.categoryKey]) acc[q.categoryKey] = [];
            acc[q.categoryKey].push(q);
            return acc;
        }, {} as Record<string, ChecklistQuestion[]>);

        const results: AutofillResult[] = [];

        for (const [category, categoryQuestions] of Object.entries(questionsByCategory)) {
            try {
                const categoryResults = await this.autofillCategoryQuestions(
                    project, 
                    category, 
                    categoryQuestions, 
                    projectContext
                );
                results.push(...categoryResults);
            } catch (error) {
                console.error(`Error autofilling category ${category}:`, error);
            }
        }

        return results;
    }

    private async autofillCategoryQuestions(
        project: Project, 
        category: string, 
        questions: ChecklistQuestion[], 
        projectContext: string
    ): Promise<AutofillResult[]> {
        const unansweredQuestions = questions.filter(q => 
            !project.checklistAnswers[q.id] && 
            !q.derivation?.(project)
        );

        if (unansweredQuestions.length === 0) {
            return [];
        }

        const prompt = this.buildCategoryPrompt(category, unansweredQuestions, projectContext);
        
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            const resultText = response.text;
            return this.parseAutofillResponse(resultText, unansweredQuestions);
        } catch (error) {
            console.error(`Error in AI autofill for category ${category}:`, error);
            return [];
        }
    }

    private buildCategoryPrompt(category: string, questions: ChecklistQuestion[], projectContext: string): string {
        const questionList = questions.map(q => 
            `- ${q.id}: ${q.text} (Options: ${q.options ? q.options.join(', ') : 'Free text'})`
        ).join('\n');

        return `You are an expert security systems consultant analyzing a Kastle Systems project. Based on the project data provided, intelligently answer the following ${category} questions.

PROJECT DATA:
${projectContext}

QUESTIONS TO ANSWER:
${questionList}

INSTRUCTIONS:
1. Analyze the project data carefully to determine the most likely answers
2. For each question, provide your answer in this exact JSON format:
   {"questionId": "question_id", "answer": "your_answer", "confidence": "high|medium|low", "reasoning": "brief explanation"}

3. CONFIDENCE LEVELS:
   - "high": Clear evidence in project data (e.g., specific device counts, types, configurations)
   - "medium": Strong inference from project context (e.g., building type suggests certain requirements)
   - "low": Best guess based on industry standards or common practices

4. ANSWER GUIDELINES:
   - Use exact option values when available (e.g., "Yes", "No", "New", "Takeover")
   - For free-text questions, be concise but informative
   - If truly cannot determine, use "Unknown" or "TBD"
   - Consider industry best practices and common project patterns

5. RESPOND WITH ONLY A VALID JSON ARRAY, NO OTHER TEXT:
[
  {"questionId": "gen1", "answer": "New", "confidence": "high", "reasoning": "No existing client data in project"},
  {"questionId": "gen2", "answer": "CRE", "confidence": "medium", "reasoning": "Office building context suggests CRE"}
]`;
    }

    private parseAutofillResponse(response: string, questions: ChecklistQuestion[]): AutofillResult[] {
        try {
            // Clean up the response to extract JSON
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error('No JSON array found in AI response');
                return [];
            }

            const results = JSON.parse(jsonMatch[0]) as AutofillResult[];
            
            // Validate and filter results
            return results.filter(result => {
                const question = questions.find(q => q.id === result.questionId);
                if (!question) return false;

                // Validate answer against options if available
                if (question.options && !question.options.includes(result.answer)) {
                    console.warn(`Invalid answer "${result.answer}" for question ${result.questionId}`);
                    return false;
                }

                return true;
            });
        } catch (error) {
            console.error('Error parsing AI autofill response:', error);
            return [];
        }
    }

    // Enhanced derivation functions for better auto-answering
    static getEnhancedDerivations(): Record<string, (project: Project) => any> {
        return {
            // General questions
            'gen7': (project: Project) => {
                const systems = new Set<string>();
                const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
                
                allInventory.forEach(item => {
                    if (item.type === 'device') {
                        switch (item.deviceType) {
                            case 'access-door': systems.add('Access Control'); break;
                            case 'camera': systems.add('Video Surveillance'); break;
                            case 'elevator': systems.add('Elevator Integration'); break;
                            case 'intercom': systems.add('Intercom'); break;
                            case 'turnstile': systems.add('Turnstile'); break;
                        }
                    }
                });
                
                return systems.size > 0 ? Array.from(systems).join(', ') : undefined;
            },

            'gen9': (project: Project) => {
                // Try to extract timeline from project data or use common defaults
                if (project.projectType?.toLowerCase().includes('urgent')) return 'ASAP';
                if (project.projectType?.toLowerCase().includes('rush')) return '2-4 weeks';
                return '4-8 weeks'; // Default reasonable timeline
            },

            // Scope questions
            'scope1': (project: Project) => {
                const hardware = new Set<string>();
                const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
                
                allInventory.forEach(item => {
                    if (item.type === 'device') {
                        const data = item.data as DeviceData;
                        if (data.model) hardware.add(data.model);
                        if (data.manufacturer) hardware.add(data.manufacturer);
                    }
                });
                
                return hardware.size > 0 ? Array.from(hardware).join(', ') : 'Various Kastle hardware';
            },

            'scope3': (project: Project) => {
                const readers = new Set<string>();
                const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
                
                allInventory.forEach(item => {
                    if (item.type === 'device' && item.deviceType === 'access-door') {
                        const data = item.data as AccessDoorData;
                        if (data.reader_model) readers.add(data.reader_model);
                    }
                });
                
                return readers.size > 0 ? Array.from(readers).join(', ') : 'Standard Kastle readers';
            },

            'scope4': (project: Project) => {
                const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
                const hasBLE = allInventory.some(item => 
                    item.type === 'device' && 
                    item.deviceType === 'access-door' && 
                    (item.data as AccessDoorData).ble_enabled === true
                );
                
                return hasBLE ? 'BLE/NFC' : 'Fobs';
            },

            'scope5': (project: Project) => {
                // Estimate based on number of access points
                const accessPoints = project.floorplans.flatMap(fp => fp.inventory)
                    .filter(item => item.type === 'device' && item.deviceType === 'access-door').length;
                
                if (accessPoints === 0) return undefined;
                
                // Rough estimate: 2-3 credentials per access point for typical office
                const estimatedCredentials = accessPoints * 2.5;
                return Math.round(estimatedCredentials).toString();
            },

            'scope10': (project: Project) => {
                // Most modern projects assume customer provides network
                return 'Yes';
            },

            'scope11': (project: Project) => {
                // Check if we have head-end markers, assume power is available
                const hasHeadEnds = project.floorplans.flatMap(fp => fp.inventory)
                    .some(item => item.type === 'marker' && item.markerType === 'ac-headend');
                
                return hasHeadEnds ? 'Yes' : 'Unknown';
            },

            'scope13': (project: Project) => {
                // Check for fire-related devices or assume based on building type
                const hasFireDevices = project.floorplans.flatMap(fp => fp.inventory)
                    .some(item => item.type === 'device' && 
                        (item.name?.toLowerCase().includes('fire') || 
                         item.deviceType === 'access-door' && 
                         (item.data as AccessDoorData).fire_relay === true));
                
                return hasFireDevices ? 'Yes' : 'Unknown';
            },

            // Video questions
            'vid1': (project: Project) => {
                const takeoverCameras = project.floorplans.flatMap(fp => fp.inventory)
                    .filter(item => item.type === 'device' && 
                        item.deviceType === 'camera' && 
                        (item.data as CameraData).install_type === 'Takeover');
                
                return takeoverCameras.length > 0 ? 'Some Confirmed' : 'N/A';
            },

            'vid2': (project: Project) => {
                const hasPTZ = project.floorplans.flatMap(fp => fp.inventory)
                    .some(item => item.type === 'device' && 
                        item.deviceType === 'camera' && 
                        (item.data as CameraData).ptz === true);
                
                return hasPTZ ? 'Yes' : 'No';
            },

            // Labor questions
            'labor1': (project: Project) => {
                // Determine if local or remote based on address
                if (project.address) {
                    const address = project.address.toLowerCase();
                    if (address.includes('remote') || address.includes('out of state')) {
                        return 'Remote';
                    }
                }
                return 'Local';
            },

            'labor3': (project: Project) => {
                // Estimate labor hours based on device count and complexity
                const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
                const deviceCount = allInventory.filter(item => item.type === 'device').length;
                
                if (deviceCount === 0) return undefined;
                
                // Rough estimate: 2-4 hours per device depending on type
                const estimatedHours = deviceCount * 3;
                return `${estimatedHours} hours`;
            },

            // Network questions
            'network2': (project: Project) => {
                // Most modern installations assume same VLAN
                return 'Yes';
            },

            'network3': (project: Project) => {
                // Same as scope11
                const hasHeadEnds = project.floorplans.flatMap(fp => fp.inventory)
                    .some(item => item.type === 'marker' && item.markerType === 'ac-headend');
                
                return hasHeadEnds ? 'Yes' : 'Unknown';
            },

            // Site questions
            'site2': (project: Project) => {
                // Default to good condition unless specified otherwise
                return 'Good - Standard commercial building';
            },

            'site3': (project: Project) => {
                // Check for conduit-related devices
                const needsConduit = project.floorplans.flatMap(fp => fp.inventory)
                    .some(item => item.type === 'device' && 
                        (item.name?.toLowerCase().includes('conduit') || 
                         item.deviceType === 'camera')); // Cameras often need new wiring
                
                return needsConduit ? 'Yes' : 'No';
            },

            'site4': (project: Project) => {
                // Same as scope14
                const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
                const hasCrashBar = allInventory.some(e => 
                    e.type === 'device' && 
                    e.deviceType === 'access-door' && 
                    (e.data as AccessDoorData).crash_bar === true
                );
                return hasCrashBar ? 'Yes' : 'No';
            }
        };
    }
}
