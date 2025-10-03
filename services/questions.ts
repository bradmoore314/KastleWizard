import { ChecklistCategory, ChecklistQuestion, Project, AccessDoorData } from '../types';
import { ChecklistAutofillService } from './aiChecklistAutofill';

export const CHECKLIST_CATEGORIES: readonly ChecklistCategory[] = [
    { key: 'general', title: 'General Project Information', icon: '🏢' },
    { key: 'scope', title: 'Scope of Work', icon: '🔧' },
    { key: 'video', title: 'Video System Takeover', icon: '📹' },
    { key: 'elevator', title: 'Elevator Integration', icon: '🛗' },
    { key: 'pricing', title: 'Pricing & Quoting', icon: '💵' },
    { key: 'labor', title: 'Installation & Labor Details', icon: '🧑‍🔧' },
    { key: 'network', title: 'Network & Power', icon: '🌐' },
    { key: 'site', title: 'Site-Specific Considerations', icon: '📍' },
    { key: 'client', title: 'Client Communication & Strategy', icon: '🧠' },
    { key: 'followup', title: 'Follow-ups & Turnover', icon: '📞' },
    { key: 'final', title: 'Final Wrap-up', icon: '✅' },
    { key: 'changeorders', title: 'Change Orders', icon: '🔄' },
];

export const ALL_QUESTIONS: readonly ChecklistQuestion[] = [
    // General
    { id: 'gen1', text: '👥 Is this an existing client or a new client?', categoryKey: 'general', options: ['Existing', 'New'], assignedTo: 'BDM' },
    { id: 'gen2', text: '🏢 What type of client is it?', categoryKey: 'general', options: ['CRE', 'MF'], assignedTo: 'BDM' },
    { id: 'gen3', text: '🏗️ Is this for an entire building or a tenant space?', categoryKey: 'general', options: ['Building', 'Tenant'], assignedTo: 'Sales Engineer' },
    { id: 'gen4', text: '🔄 Is this a new installation or a takeover of an existing system?', categoryKey: 'general', options: ['New', 'Takeover', 'Mixed'], assignedTo: 'Sales Engineer', 
        derivation: (project: Project) => {
            const installTypes = new Set(project.floorplans.flatMap(fp => fp.inventory.flatMap(e => {
                if (e.type === 'device' && 'install_type' in e.data && e.data.install_type) {
                    return [e.data.install_type];
                }
                return [];
            })));
            if (installTypes.size === 1) {
                const type = installTypes.values().next().value;
                if (type === 'New Install') return 'New';
                if (type === 'Takeover') return 'Takeover';
            }
            if (installTypes.size > 1) return 'Mixed';
            return undefined;
        }
    },
    { id: 'gen5', text: '👷 If new, what type of construction is it?', categoryKey: 'general', options: ['Ground-up', 'Fit-out', 'Other'], assignedTo: 'Sales Engineer', branchingCondition: { questionId: 'gen4', value: 'New' } },
    { id: 'gen6', text: '📍 Is this a new location or a system addition?', categoryKey: 'general', options: ['New Location', 'Addition'], assignedTo: 'Sales Engineer' },
    { id: 'gen7', text: '📦 What systems are included?', categoryKey: 'general', assignedTo: 'Sales Engineer' },
    { id: 'gen9', text: '🗓️ What is the installation timeline or deadline?', categoryKey: 'general', assignedTo: 'BDM / SE' },
    { id: 'gen10', text: '😟 Is the client sensitive to deadlines or expectations?', categoryKey: 'general', options: ['Yes', 'No', 'Unknown'], assignedTo: 'BDM' },
    { id: 'gen11', text: '➕ Are we adding to an existing system or starting fresh?', categoryKey: 'general', options: ['Adding', 'Starting Fresh'], assignedTo: 'Sales Engineer' },
    { id: 'gen12', text: "💡 What are the customer's expectations regarding labor and power supply?", categoryKey: 'general', assignedTo: 'Sales Engineer' },

    // Scope of Work
    { id: 'scope1', text: '🔩 What hardware is being installed or replaced?', categoryKey: 'scope', assignedTo: 'Sales Engineer' },
    { id: 'scope2', text: '♻️ Are we reusing existing systems (e.g., DoorKing, Honeywell)?', categoryKey: 'scope', assignedTo: 'Sales Engineer' },
    { id: 'scope3', text: '💳 What reader/lock models are being used?', categoryKey: 'scope', assignedTo: 'Sales Engineer' },
    { id: 'scope4', text: '🔑 Are credentials needed (fobs, tags, BLE/NFC)?', categoryKey: 'scope', options: ['Fobs', 'Tags', 'BLE/NFC', 'None'], assignedTo: 'Sales Engineer' },
    { id: 'scope5', text: '🔢 How many credentials are required?', categoryKey: 'scope', assignedTo: 'Sales Engineer' },
    { id: 'scope6', text: '🤝 Who is providing the locks?', categoryKey: 'scope', options: ['Kastle', 'Customer', 'GC', 'Other', 'Mixed'], assignedTo: 'Sales Engineer',
        derivation: (project: Project) => {
            const providers = new Set(project.floorplans.flatMap(fp => fp.inventory.flatMap(e => {
                if (e.type === 'device' && e.deviceType === 'access-door') {
                    const data = e.data as AccessDoorData;
                    if (data.lock_provider && data.lock_provider !== '-') {
                        return [data.lock_provider];
                    }
                }
                return [];
            })));
            if (providers.size === 1) return providers.values().next().value;
            if (providers.size > 1) return 'Mixed';
            return undefined;
        }
    },
    { id: 'scope7', text: '🗺️ What system layout is being used?', categoryKey: 'scope', assignedTo: 'Sales Engineer' },
    { id: 'scope8', text: '🖥️ How many head-end locations are there?', categoryKey: 'scope', assignedTo: 'Sales Engineer',
        derivation: (project: Project) => {
             const count = project.floorplans.flatMap(fp => fp.inventory).filter(e => e.type === 'marker' && e.markerType === 'ac-headend').length;
             return count > 0 ? String(count) : undefined;
        }
    },
    { id: 'scope9', text: '〰️ Is conduit needed? Who is installing it?', categoryKey: 'scope', assignedTo: 'Sales Engineer' },
    { id: 'scope10', text: '🌐 Is network being provided by the customer?', categoryKey: 'scope', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'scope11', text: '⚡ Is power existing at each head-end location?', categoryKey: 'scope', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'scope12', text: '🔋 How is lock power being managed?', categoryKey: 'scope', assignedTo: 'Sales Engineer' },
    { id: 'scope13', text: '🔥 Are fire relays required?', categoryKey: 'scope', options: ['Yes', 'No', 'Unknown'], assignedTo: 'Sales Engineer' },
    { id: 'scope14', text: '🚪 Are crash bars or auto door openers included?', categoryKey: 'scope', options: ['Yes', 'No'], assignedTo: 'Sales Engineer',
        derivation: (project: Project) => {
            const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
            const hasCrashBar = allInventory.some(e => 
                e.type === 'device' && 
                e.deviceType === 'access-door' && 
                (e.data as AccessDoorData).crash_bar === true
            );
            return hasCrashBar ? 'Yes' : 'No';
        }
    },
    { id: 'scope15', text: '📞 Are intercoms or KFO in scope?', categoryKey: 'scope', options: ['Yes', 'No'], assignedTo: 'Sales Engineer', 
        derivation: (project: Project) => {
            return project.floorplans.flatMap(fp => fp.inventory).some(e => e.type === 'device' && e.deviceType === 'intercom') ? 'Yes' : 'No';
        }
    },
    { id: 'scope16', text: '📦 Are there any devices that need external enclosures (e.g., Hoffman boxes)?', categoryKey: 'scope', assignedTo: 'Sales Engineer' },
    { id: 'scope17', text: '🔄 Are media converters or point-to-point devices needed?', categoryKey: 'scope', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'scope18', text: '🧱 Are the readers surface-mounted or panel-integrated?', categoryKey: 'scope', options: ['Surface-Mounted', 'Panel-Integrated'], assignedTo: 'Sales Engineer' },
    { id: 'scope19', text: '🔌 Do we need junction boxes or additional wiring infrastructure?', categoryKey: 'scope', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'scope20', text: '🛠️ Are any site-specific wiring upgrades required?', categoryKey: 'scope', options: ['Yes', 'No', 'Unknown'], assignedTo: 'Sales Engineer' },

    // Video System Takeover
    { id: 'vid1', text: 'Are all existing cameras confirmed to be compatible with Kastle (ONVIF/H.264 compliant)?', categoryKey: 'video', options: ['Yes, All Confirmed', 'Some Confirmed', 'None Confirmed', 'Unknown'], assignedTo: 'Sales Engineer' },
    { id: 'vid2', text: 'Are there any Pan-Tilt-Zoom (PTZ) cameras in the existing system?', categoryKey: 'video', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'vid3', text: 'Does the client have full administrative credentials for all existing cameras and the NVR/VMS?', categoryKey: 'video', options: ['Yes, All Credentials Provided', 'Partial Credentials Provided', 'No Credentials Provided'], assignedTo: 'Sales Engineer' },
    { id: 'vid4', text: 'Has the overall operational status of the existing video system been confirmed?', categoryKey: 'video', options: ['Fully Operational', 'Partially Operational', 'Non-Operational', 'Unknown'], assignedTo: 'Sales Engineer' },
    { id: 'vid5', text: 'Has the Gateway Calculator been used to determine the required gateway quantity for this takeover?', categoryKey: 'video', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'vid6', text: 'Are there any existing video workstations to be integrated or replaced?', categoryKey: 'video', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'vid7', text: 'If yes, how many workstations are there, and are the camera views for each documented?', categoryKey: 'video', assignedTo: 'Sales Engineer', branchingCondition: { questionId: 'vid6', value: 'Yes' } },
    { id: 'vid8', text: 'Have new KastleVideo Viewing Stations been included in the scope if required?', categoryKey: 'video', options: ['Yes', 'No', 'N/A'], assignedTo: 'Sales Engineer' },
    { id: 'vid9', text: 'Have floor plans with accurate existing camera locations been provided by the client?', categoryKey: 'video', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'vid10', text: 'Is the Scope of Work for the video takeover clearly defined (cameras to keep, replace, relocate)?', categoryKey: 'video', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'vid11', text: 'Is the client aware of potential Purchaser Provided Items (PPI) such as network upgrades, power, or lifts?', categoryKey: 'video', options: ['Yes', 'No'], assignedTo: 'BDM / SE' },
    { id: 'vid12', text: 'Will a lift be required to access any of the camera locations for service or replacement?', categoryKey: 'video', options: ['Yes', 'No', 'Unknown'], assignedTo: 'Sales Engineer' },

    // Elevator Integration
    { id: 'elev1', text: '↕️ What type of elevator access is being installed?', categoryKey: 'elevator', assignedTo: 'Sales Engineer' },
    { id: 'elev2', text: '🤝 Are elevator companies involved in their portion of work?', categoryKey: 'elevator', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'elev3', text: '🔢 How many elevator banks and cars are there?', categoryKey: 'elevator', assignedTo: 'Sales Engineer',
        derivation: (project: Project) => {
             const count = project.floorplans.flatMap(fp => fp.inventory).filter(e => e.type === 'device' && e.deviceType === 'elevator').length;
             return count > 0 ? String(count) : undefined;
        }
    },
    { id: 'elev4', text: '❓ Are all elevator cabs serving the same floors? Any basement or rear door variations?', categoryKey: 'elevator', assignedTo: 'Sales Engineer' },
    { id: 'elev5', text: '📱 Are the readers BLE-compatible?', categoryKey: 'elevator', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'elev6', text: '📦 Are enclosures needed in the elevator machine room?', categoryKey: 'elevator', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'elev7', text: '🔗 Is there elevator access control integration needed?', categoryKey: 'elevator', options: ['Yes', 'No'], assignedTo: 'Sales Engineer',
        derivation: (project: Project) => {
            return project.floorplans.flatMap(fp => fp.inventory).some(e => e.type === 'device' && e.deviceType === 'elevator') ? 'Yes' : 'No';
        }
    },

    // Pricing & Quoting
    { id: 'change6', text: '💰 Is pricing aligned with customer expectations?', categoryKey: 'pricing', options: ['Yes', 'No', 'Unknown'], assignedTo: 'BDM' },
    { id: 'change7', text: '📜 Is price protection language included?', categoryKey: 'pricing', options: ['Yes', 'No'], assignedTo: 'BDM' },
    { id: 'change9', text: '📈 Are there new RMR opportunities?', categoryKey: 'pricing', options: ['Yes', 'No'], assignedTo: 'BDM' },

    // Installation & Labor Details
    { id: 'labor1', text: '🌍 Is this project local or remote?', categoryKey: 'labor', options: ['Local', 'Remote'], assignedTo: 'Sales Engineer' },
    { id: 'labor2', text: '👷 Who is performing the work?', categoryKey: 'labor', assignedTo: 'Sales Engineer' },
    { id: 'labor3', text: '⏰ What are the total labor hours quoted?', categoryKey: 'labor', assignedTo: 'Sales Engineer' },
    { id: 'labor4', text: '📉 Has labor been adjusted for any scope reductions?', categoryKey: 'labor', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'labor5', text: '🤝 Is subcontractor labor accounted for?', categoryKey: 'labor', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'labor6', text: '🔧 Who is commissioning the locks?', categoryKey: 'labor', assignedTo: 'Sales Engineer' },
    { id: 'labor7', text: '✅ Has labor been reviewed for accuracy?', categoryKey: 'labor', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },

    // Network & Power
    { id: 'network2', text: '💻 Are all head-ends on the same VLAN/Subnet?', categoryKey: 'network', options: ['Yes', 'No', 'Unknown'], assignedTo: 'Sales Engineer' },
    { id: 'network3', text: '⚡ Is power existing at head-ends?', categoryKey: 'network', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'network4', text: '🔥 Are fire relays required and where?', categoryKey: 'network', assignedTo: 'Sales Engineer' },
    { id: 'network5', text: '❓ Will the network in the elevator machine room match the rest of the system?', categoryKey: 'network', options: ['Yes', 'No', 'Unknown'], assignedTo: 'Sales Engineer' },

    // Site-Specific Considerations
    { id: 'site1', text: "🚪 Are there contact-only doors? What's their function?", categoryKey: 'site', assignedTo: 'Sales Engineer' },
    { id: 'site2', text: '🏛️ What is the condition of existing infrastructure?', categoryKey: 'site', assignedTo: 'Sales Engineer' },
    { id: 'site3', text: '🔌 Are relays, conduit, or new wiring needed?', categoryKey: 'site', options: ['Yes', 'No', 'Unknown'], assignedTo: 'Sales Engineer' },
    { id: 'site4', text: '🚪 Are there auto-openers or crash bars?', categoryKey: 'site', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'site5', text: '🤝 Do we need to engage other trades/vendors?', categoryKey: 'site', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'site6', text: '📄 Are site-specific exclusions documented?', categoryKey: 'site', options: ['Yes', 'No'], assignedTo: 'BDM / SE' },
    { id: 'site7', text: '⚠️ Are there caveats or risks called out in the proposal?', categoryKey: 'site', assignedTo: 'BDM / SE' },

    // Client Communication & Strategy
    { id: 'client1', text: '📸 Has the client requested special features like image display, visitor management?', categoryKey: 'client', options: ['Yes', 'No'], assignedTo: 'BDM / SE' },
    { id: 'client2', text: '🧑‍💻 Do they understand their role in device programming?', categoryKey: 'client', options: ['Yes', 'No', 'Partially'], assignedTo: 'BDM' },
    { id: 'client3', text: '💸 Are there objections to subscriptions or RMR?', categoryKey: 'client', options: ['Yes', 'No', 'Unknown'], assignedTo: 'BDM' },
    { id: 'client4', text: '🤔 Are other vendor solutions being considered?', categoryKey: 'client', options: ['Yes', 'No', 'Unknown'], assignedTo: 'BDM' },

    // Follow-ups & Turnover
    { id: 'follow1', text: '➡️ What are the next steps to finalize the quote?', categoryKey: 'followup', assignedTo: 'BDM / SE' },
    { id: 'follow2', text: '⏳ Are there outstanding approvals?', categoryKey: 'followup', options: ['Yes', 'No', 'N/A'], assignedTo: 'BDM' },
    { id: 'follow3', text: '📞 Are additional review calls needed?', categoryKey: 'followup', options: ['Yes', 'No'], assignedTo: 'BDM / SE' },
    { id: 'follow4', text: '👤 Who is responsible for next actions?', categoryKey: 'followup', assignedTo: 'BDM / SE' },

    // Final Wrap-up
    { id: 'final1', text: '✅ Are all scope, labor, and pricing items resolved?', categoryKey: 'final', options: ['Yes', 'No'], assignedTo: 'BDM / SE' },
    { id: 'final2', text: '📝 What exclusions/caveats need to be documented?', categoryKey: 'final', assignedTo: 'BDM / SE' },
    { id: 'final3', text: '❓ Are there any unresolved risks or questions?', categoryKey: 'final', assignedTo: 'BDM / SE' },

    // Change Orders
    { id: 'change1', text: '🔄 What change orders are being reviewed?', categoryKey: 'changeorders', assignedTo: 'BDM / SE' },
    { id: 'change2', text: '🛠️ What hardware is changing (add/remove/modify)?', categoryKey: 'changeorders', assignedTo: 'Sales Engineer' },
    { id: 'change3', text: '💰 Is labor included for the change order?', categoryKey: 'changeorders', options: ['Yes', 'No'], assignedTo: 'BDM / SE' },
    { id: 'change4', text: '💲 How does the change impact cost?', categoryKey: 'changeorders', assignedTo: 'BDM / SE' },
    { id: 'change5', text: '📄 Are hardware models clearly specified?', categoryKey: 'changeorders', options: ['Yes', 'No'], assignedTo: 'Sales Engineer' },
    { id: 'change8', text: '🏗️ Do quotes need to be rebuilt?', categoryKey: 'changeorders', options: ['Yes', 'No'], assignedTo: 'BDM / SE' },
];

// Enhanced derivation functions for better auto-answering
const enhancedDerivations = ChecklistAutofillService.getEnhancedDerivations();

// Apply enhanced derivations to questions
export const ENHANCED_QUESTIONS: readonly ChecklistQuestion[] = ALL_QUESTIONS.map(question => ({
    ...question,
    derivation: enhancedDerivations[question.id] || question.derivation
}));

// Function to get AI autofill suggestions
export async function getAIAutofillSuggestions(project: Project, apiKey: string): Promise<Record<string, string>> {
    if (!apiKey) {
        console.warn('No API key provided for AI autofill');
        return {};
    }

    try {
        const autofillService = new ChecklistAutofillService(apiKey);
        const results = await autofillService.autofillQuestions(project, ALL_QUESTIONS);
        
        const suggestions: Record<string, string> = {};
        results.forEach(result => {
            if (result.confidence === 'high' || result.confidence === 'medium') {
                suggestions[result.questionId] = result.answer;
            }
        });
        
        return suggestions;
    } catch (error) {
        console.error('Error getting AI autofill suggestions:', error);
        return {};
    }
}