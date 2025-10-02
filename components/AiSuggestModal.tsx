import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { DeviceType, PartialDeviceData } from '../types';
// FIX: Update imports to use correct exported icon components.
import { AiSuggestIcon, CameraIcon, KeyRoundIcon, TargetIcon, Building as BuildingIcon, Waypoints as WaypointsIcon, CloseIcon } from './Icons';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { EQUIPMENT_CONFIG } from '../services/equipmentConfig';

export interface AiSuggestion {
    deviceType: DeviceType;
    placementPoint: {
        x: number;
        y: number;
    };
    location: string;
    reasoning: string;
    data?: PartialDeviceData;
    fieldOfViewRotation?: number;
}

interface AiSuggestModalProps {
    state: 'configuring' | 'loading' | 'reviewing' | 'error';
    suggestions: AiSuggestion[] | null;
    error: string | null;
    onClose: () => void;
    onGenerateRequest: (config: { prompt: string, selectedEquipment: Set<string> }) => void;
    onAccept: (suggestions: AiSuggestion[]) => void;
    pdfJsDoc: PDFDocumentProxy | null;
    currentPage: number;
}


const equipmentOptions = [
    { key: 'camera', label: 'Cameras', Icon: CameraIcon, color: 'text-blue-400' },
    { key: 'access-door', label: 'Access Doors', Icon: KeyRoundIcon, color: 'text-red-400' },
];

type Goal = 'perimeter' | 'traffic' | 'comprehensive';

const goals: { key: Goal; title: string; description: string; Icon: React.FC<any> }[] = [
    { key: 'perimeter', title: 'Perimeter Security', description: 'Focus on all entry and exit points.', Icon: BuildingIcon },
    { key: 'traffic', title: 'High-Traffic Areas', description: 'Monitor lobbies, hallways, and common areas.', Icon: WaypointsIcon },
    { key: 'comprehensive', title: 'Comprehensive', description: 'Balance of perimeter and interior coverage.', Icon: TargetIcon },
];


const AiSuggestModal: React.FC<AiSuggestModalProps> = ({ state, suggestions, error, onClose, onGenerateRequest, onAccept, pdfJsDoc, currentPage }) => {
    const modalRef = useFocusTrap<HTMLDivElement>(true);
    
    const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set(['camera', 'access-door']));
    const [goal, setGoal] = useState<Goal>('comprehensive');
    const [minCameras, setMinCameras] = useState<string>('');
    const [maxCameras, setMaxCameras] = useState<string>('');
    const [minAccessDoors, setMinAccessDoors] = useState<string>('');
    const [maxAccessDoors, setMaxAccessDoors] = useState<string>('');
    
    const generatedPrompt = useMemo(() => {
        const equipmentList = Array.from(selectedEquipment).map((e: string) => {
            const config = equipmentOptions.find(opt => opt.key === e);
            return config ? config.label : e.replace('-', ' ');
        }).join(' and ');

        const totalPages = pdfJsDoc?.numPages || 1;

        const goalPrompts: Record<Goal, string> = {
            perimeter: 'Focus on securing the building perimeter. Place devices at all entry and exit points shown on the floorplan.',
            traffic: 'Focus on monitoring high-traffic interior areas. Place devices in lobbies, main corridors, elevator banks, and stairwells.',
            comprehensive: 'Provide a balanced approach, securing key perimeter points while also monitoring critical interior high-traffic areas and choke points.'
        };

        let basePrompt = `You are an expert security engineer for Kastle Systems. Your task is to analyze the attached floor plan, which is Page ${currentPage} of ${totalPages}, and suggest optimal placements for security equipment.\n\n`;

        basePrompt += `Primary Goal: ${goalPrompts[goal]}\n\n`;
        
        if (equipmentList) {
          basePrompt += `Equipment to Place: ${equipmentList}.\n\n`;
        } else {
          basePrompt += `Equipment to Place: None selected.\n\n`;
        }
        
        let constraints = [];
        if (selectedEquipment.has('camera')) {
            const min = parseInt(minCameras, 10);
            const max = parseInt(maxCameras, 10);
            if (!isNaN(min) && min > 0) constraints.push(`suggest a minimum of ${min} cameras`);
            if (!isNaN(max) && max > 0) constraints.push(`suggest a maximum of ${max} cameras`);
        }
        if (selectedEquipment.has('access-door')) {
            const min = parseInt(minAccessDoors, 10);
            const max = parseInt(maxAccessDoors, 10);
            if (!isNaN(min) && min > 0) constraints.push(`suggest a minimum of ${min} access doors`);
            if (!isNaN(max) && max > 0) constraints.push(`suggest a maximum of ${max} access doors`);
        }

        if (constraints.length > 0) {
            basePrompt += `Constraints: You must ${constraints.join(' and ')}.\n\n`;
        }

        basePrompt += `For each suggestion, provide a concise but descriptive location name (e.g., "North Lobby Entrance", "IT Room Door") and a brief, professional justification for the placement based on security best practices.\n\n`;
        basePrompt += `You MUST respond with ONLY a valid JSON object that conforms to the provided schema. Do not include any explanatory text or markdown formatting.`;

        return basePrompt;
    }, [selectedEquipment, goal, minCameras, maxCameras, minAccessDoors, maxAccessDoors, currentPage, pdfJsDoc]);
    
    const [prompt, setPrompt] = useState(generatedPrompt);

    useEffect(() => {
        setPrompt(generatedPrompt);
    }, [generatedPrompt]);


    const handleEquipmentToggle = (key: string) => {
        setSelectedEquipment(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const handleGenerateRequest = () => {
        if (selectedEquipment.size === 0) {
            alert("Please select at least one equipment type to suggest.");
            return;
        }
        onGenerateRequest({ prompt, selectedEquipment });
    };

    const handleAccept = () => {
        if (suggestions) {
            onAccept(suggestions);
        }
    };

    const IconComponent = ({ deviceType }: { deviceType: string }) => {
        const key = deviceType === 'camera' ? 'camera-indoor' : deviceType === 'access-door' ? 'access-door-interior' : deviceType;
        const config = EQUIPMENT_CONFIG[key];
        if (!config) return null;
        const { IconComponent, color } = config;
        return <IconComponent className={`w-6 h-6 flex-shrink-0 ${color}`} />;
    };

    const GoalCard: React.FC<{ goalItem: typeof goals[0]}> = ({ goalItem }) => (
        <button
            onClick={() => setGoal(goalItem.key)}
            className={`flex flex-col text-left p-3 rounded-lg border-2 transition-colors ${goal === goalItem.key ? 'border-primary-600 bg-primary-950/50' : 'border-white/10 hover:bg-white/5'}`}
        >
            <goalItem.Icon className="w-6 h-6 mb-2 text-primary-400" />
            <span className="font-semibold text-on-surface">{goalItem.title}</span>
            <span className="text-xs text-on-surface-variant mt-1">{goalItem.description}</span>
        </button>
    );

    const renderContent = () => {
        switch (state) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                        <p className="text-lg text-on-surface-variant">AI is analyzing your floorplan...</p>
                        <p className="text-sm text-on-surface-variant/60">This may take a moment.</p>
                    </div>
                );
            case 'reviewing':
                return (
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Generated Suggestions ({suggestions?.length || 0})</h3>
                        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
                            {suggestions?.map((s, i) => (
                                <div key={i} className="bg-background p-3 rounded-lg flex items-start gap-3 border border-white/10">
                                    <IconComponent deviceType={s.deviceType} />
                                    <div className="flex-1">
                                        <p className="font-semibold text-on-surface">{s.location}</p>
                                        <p className="text-sm text-on-surface-variant">{s.reasoning}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'error':
                return <p className="text-red-500 text-sm mt-4">{error}</p>;
            case 'configuring':
            default:
                 return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-on-surface-variant mb-3">1. What to add?</h3>
                            <div className="space-y-3">
                                {equipmentOptions.map(({ key, label, Icon, color }) => (
                                    <div key={key} className={`p-3 rounded-lg border-2 transition-colors ${selectedEquipment.has(key) ? 'border-primary-600 bg-primary-950/50' : 'border-white/10'}`}>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={selectedEquipment.has(key)} onChange={() => handleEquipmentToggle(key)} className="h-5 w-5 rounded-sm text-primary-600 bg-surface border-gray-500 focus:ring-primary-500" />
                                            <Icon className={`w-5 h-5 ${color}`} />
                                            <span className="font-semibold text-on-surface">{label}</span>
                                        </label>
                                        {selectedEquipment.has(key) && (
                                            <div className="mt-3 pl-10 flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="text-xs text-on-surface-variant mb-1 block">Min</label>
                                                    <input type="number" min="0" value={key === 'camera' ? minCameras : minAccessDoors} onChange={e => key === 'camera' ? setMinCameras(e.target.value) : setMinAccessDoors(e.target.value)} placeholder="Any" className="w-full bg-background border border-white/20 rounded-md p-1.5 text-on-surface text-sm"/>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-on-surface-variant mb-1 block">Max</label>
                                                    <input type="number" min="0" value={key === 'camera' ? maxCameras : maxAccessDoors} onChange={e => key === 'camera' ? setMaxCameras(e.target.value) : setMaxAccessDoors(e.target.value)} placeholder="Any" className="w-full bg-background border border-white/20 rounded-md p-1.5 text-on-surface text-sm"/>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-semibold text-on-surface-variant mb-2">2. What is your goal?</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {goals.map(g => <GoalCard key={g.key} goalItem={g} />)}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-on-surface-variant mb-2">3. Customize Instructions</h3>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={8}
                                className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface-variant text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                placeholder="Enter your detailed instructions for the AI..."
                            />
                        </div>
                     </div>
                );
        }
    };
    

    return (
        <div ref={modalRef} className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-on-surface flex items-center gap-2"><AiSuggestIcon className="w-6 h-6 text-primary-400" /> AI Layout Suggestions</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                
                <main className="flex-1 overflow-y-auto p-6">
                    {renderContent()}
                </main>
                
                <footer className="p-4 border-t border-white/10 flex-shrink-0 flex justify-end gap-3 items-center">
                    {state === 'reviewing' && (
                        <button type="button" onClick={handleGenerateRequest} className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors">Regenerate</button>
                    )}
                    {state === 'reviewing' ? (
                        <button onClick={handleAccept} className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">Accept & Place ({suggestions?.length || 0})</button>
                    ) : (
                        <button onClick={handleGenerateRequest} disabled={state === 'loading' || selectedEquipment.size === 0} className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Generate Suggestions
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default AiSuggestModal;