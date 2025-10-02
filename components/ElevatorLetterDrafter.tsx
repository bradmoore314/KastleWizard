import React, { useState, useEffect, useCallback } from 'react';
import { Project, ElevatorLetterFormData, DeviceEdit, ElevatorData } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAppDispatch } from '../state/AppContext';
import { FileDownIcon, AiSuggestIcon, Building, SettingsIcon, Waypoints, CloseIcon } from './Icons';
import { toast } from 'react-hot-toast';
import { GoogleGenAI } from '@google/genai';
import { generateElevatorLetterDocx } from '../services/export';
import saveAs from 'file-saver';
import { sanitizeFilename } from '../utils';
import MarkdownRenderer from './MarkdownRenderer';
import ProjectInfo from './elevator/ProjectInfo';
import SystemSpecs from './elevator/SystemSpecs';
import Operations from './elevator/Operations';

interface ElevatorLetterDrafterProps {
    project: Project | null | undefined;
    onFinish: () => void;
}

const DEFAULT_FORM_DATA: ElevatorLetterFormData = {
    date: new Date().toISOString().split('T')[0],
    bldgNumber: '', projectAddress: '', projManager: '',
    bankNames: '', thisBankName: '',
    mgmtCo: '', mgmtContact: '', mgmtPhone: '',
    elevCo: '', elevContact: '', elevPhone: '',
    systemType: '', takeover: false,
    securedFloorsA: '', rearHallCalls: 'No', phonesNextToReaders: 'No',
    readerType: 'Prox', flushMount: 'Surface', ferrousSurface: 'No',
    visitorProcessing: 'None', eorLocation: '',
    freightOperatesInGroup: 'No', freightCarNumber: '', freightHomeFloor: '', freightSecure: 'None',
    cars: [],
};

type Tab = 'project' | 'specs' | 'operations';

const TabButton: React.FC<{ tabId: Tab; currentTab: Tab; onClick: (tab: Tab) => void; children: React.ReactNode; Icon: React.ElementType }> = ({ tabId, currentTab, onClick, children, Icon }) => (
    <button
        onClick={() => onClick(tabId)}
        className={`flex items-center gap-3 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${currentTab === tabId ? 'bg-primary-600 text-white' : 'hover:bg-white/10 text-on-surface-variant'}`}
    >
        <Icon className="w-5 h-5" />
        {children}
    </button>
);


const ElevatorLetterDrafter: React.FC<ElevatorLetterDrafterProps> = ({ project, onFinish }) => {
    const dispatch = useAppDispatch();
    const viewRef = useFocusTrap<HTMLDivElement>(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('project');

    const formData = project?.elevatorLetterFormData || DEFAULT_FORM_DATA;
    const generatedText = project?.elevator_letter_content || '';

    useEffect(() => {
        if (project && !project.elevatorLetterFormData) {
            const allElevators = [...project.projectLevelInventory, ...project.floorplans.flatMap(f => f.inventory)]
                .filter(e => e.type === 'device' && e.deviceType === 'elevator') as DeviceEdit[];
            
            const firstElevatorData = allElevators[0]?.data as ElevatorData;

            const carEntries = allElevators.map((e, index) => {
                const data = e.data as ElevatorData;
                return {
                    id: index + 1,
                    name: data.location || `Car ${index + 1}`,
                    hasReader: 'Yes' as 'Yes' | 'No',
                    floorsServed: data.floor_count ? `1-${data.floor_count}` : '',
                    securedFloors: data.secured_floors || '',
                };
            });

            const initialData: ElevatorLetterFormData = {
                ...DEFAULT_FORM_DATA,
                projectAddress: project.site_address || '',
                projManager: project.se_name || '',
                bankNames: [...new Set(allElevators.map(e => (e.data as ElevatorData).bank_name).filter(Boolean))].join(', '),
                thisBankName: firstElevatorData?.bank_name || '',
                mgmtCo: firstElevatorData?.management_company || '',
                mgmtContact: firstElevatorData?.management_contact_person || '',
                mgmtPhone: firstElevatorData?.management_phone_number || '',
                elevCo: firstElevatorData?.elevator_company || '',
                elevContact: firstElevatorData?.elevator_contact_person || '',
                elevPhone: firstElevatorData?.elevator_phone_number || '',
                systemType: firstElevatorData?.elevator_type as any || '',
                visitorProcessing: (firstElevatorData?.visitor_processing as any) || 'None',
                cars: carEntries,
            };

            dispatch({ type: 'UPDATE_ELEVATOR_LETTER_FORM_DATA', payload: { projectId: project.id, formData: initialData } });
        }
    }, [project, dispatch]);
    
    const updateFormData = useCallback((newFormData: ElevatorLetterFormData) => {
        if (project) {
            dispatch({ type: 'UPDATE_ELEVATOR_LETTER_FORM_DATA', payload: { projectId: project.id, formData: newFormData } });
        }
    }, [project, dispatch]);
    
    const generatePrompt = () => {
        return `You are a technical writer for Kastle Systems, specializing in creating elevator control system specifications. Your tone is professional, precise, and formal.

Based on the following JSON data, generate a complete specification letter document. The document should be structured logically with clear headings for each section. Omit any sections where the data is not applicable (e.g., if visitor processing is 'None', omit the visitor operation section).

Use the data provided to fill in all placeholders like [DATE], [PROJECT ADDRESS], etc.

**DOCUMENT STRUCTURE GUIDELINES:**
1.  **Header:** Include Date, Project Address, Elevator Bank, and "TO" address for the Management Company. Use **bold** for labels (e.g., **DATE:**).
2.  **Introduction:** A standard professional opening paragraph.
3.  **Section I: TENANT OPERATION:** Describe the operation based on the 'systemType'.
4.  **Section II: VISITOR OPERATION:** If applicable, describe the visitor process.
5.  **Section III: ELEVATOR CONTRACTOR SPECIFICATIONS:** Standard liability and code compliance clause.
6.  **Subsequent Sections:** Include detailed, technical specifications for Wiring, Reader Mounting, Secure Control Wiring, and Freight Operations as applicable based on the provided data.
7.  **Conclusion:** A final section on system safety and fire code compliance.

**PROVIDED DATA:**
${JSON.stringify(formData, null, 2)}

Generate the full text of the letter. Do not include any commentary, just the letter content. Use simple markdown for headings, for example: '## SECTION I: TENANT OPERATION ##'.`;
    };

    const handleGenerate = async () => {
        if (!import.meta.env.VITE_API_KEY) {
            toast.error("API Key is not configured.");
            return;
        }
        if (!formData.systemType) {
            toast.error("Please select a System Type in Section 2.");
            return;
        }
        setIsGenerating(true);
        const toastId = toast.loading('Generating letter with AI...');
        try {
            const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_API_KEY});
            const prompt = generatePrompt();
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const resultText = response.text;

            if (project) {
                dispatch({ type: 'UPDATE_ELEVATOR_LETTER_CONTENT', payload: { projectId: project.id, content: resultText } });
            }
            toast.success('Letter generated successfully!', { id: toastId });
        } catch (err) {
            console.error("AI Generation Error:", err);
            toast.error('Failed to generate letter.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedText) {
            toast.error("Please generate the letter first.");
            return;
        }
        const toastId = toast.loading('Creating .docx file...');
        try {
            const blob = await generateElevatorLetterDocx(generatedText);
            saveAs(blob, `${sanitizeFilename(project?.name || 'Project')}_Elevator_Letter.docx`);
            toast.success('Download complete!', { id: toastId });
        } catch (err) {
            console.error("Docx generation failed:", err);
            toast.error('Failed to create .docx file.', { id: toastId });
        }
    };

    return (
        <div ref={viewRef} className="w-full h-full flex flex-col bg-background">
            <header className="p-4 md:p-6 border-b border-white/10 flex-shrink-0 flex justify-between items-center bg-surface">
                <h1 className="text-2xl font-bold">AI Elevator Specification Assistant</h1>
                <button onClick={onFinish} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
            </header>
            
            <div className="flex-1 flex flex-col md:flex-row gap-8 p-4 md:p-8 overflow-y-auto">
                {/* Left Pane: Form */}
                <div className="flex-1 lg:max-w-3xl">
                    <nav className="mb-6 flex items-center gap-2 p-1.5 bg-surface rounded-xl border border-white/10">
                        <TabButton tabId="project" currentTab={activeTab} onClick={setActiveTab} Icon={Building}>Project Details</TabButton>
                        <TabButton tabId="specs" currentTab={activeTab} onClick={setActiveTab} Icon={SettingsIcon}>System Specs</TabButton>
                        <TabButton tabId="operations" currentTab={activeTab} onClick={setActiveTab} Icon={Waypoints}>Operations</TabButton>
                    </nav>

                    <div className="space-y-6">
                        {activeTab === 'project' && <ProjectInfo formData={formData} onUpdate={updateFormData} />}
                        {activeTab === 'specs' && <SystemSpecs formData={formData} onUpdate={updateFormData} />}
                        {activeTab === 'operations' && <Operations formData={formData} onUpdate={updateFormData} />}
                    </div>
                </div>
                
                {/* Right Pane: Output */}
                <div className="flex-1 lg:max-w-2xl bg-surface p-6 rounded-xl border border-white/10 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Generated Specification Letter</h2>
                        <div className="flex gap-2">
                             <button onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                                {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <AiSuggestIcon className="w-4 h-4" />}
                                {isGenerating ? 'Generating...' : 'Generate with AI'}
                            </button>
                             <button onClick={handleDownload} disabled={!generatedText} className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                                <FileDownIcon className="w-4 h-4" />
                                Download .docx
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 bg-background rounded-md p-4 overflow-y-auto border border-white/10">
                        {generatedText ? <MarkdownRenderer content={generatedText} /> : (
                            <div className="flex items-center justify-center h-full text-center text-on-surface-variant">
                                <p>Fill out the form and click "Generate with AI" to create the letter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ElevatorLetterDrafter;