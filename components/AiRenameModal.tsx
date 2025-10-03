import React, { useState, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { CloseIcon, AiRenameIcon, ArrowRightIcon } from './Icons';
import { EQUIPMENT_CONFIG } from '../services/equipmentConfig';
import { getEditIconKey } from '../utils';
import { DeviceEdit, MarkerEdit, DeviceType, MarkerType } from '../types';

export interface AiRenameSuggestion {
    id: string;
    oldName: string;
    newName: string;
    type: 'device' | 'marker';
    deviceType?: DeviceType;
    markerType?: MarkerType;
}

interface AiRenameModalProps {
    state: 'loading' | 'reviewing' | 'error';
    renames: AiRenameSuggestion[] | null;
    error: string | null;
    onClose: () => void;
    onAccept: (accepted: { id: string, newName: string }[]) => void;
}

const IconComponent: React.FC<{ item: AiRenameSuggestion }> = ({ item }) => {
    const edit = {
        type: item.type,
        deviceType: item.deviceType,
        markerType: item.markerType,
        data: item.type === 'device' && item.deviceType === 'camera' ? { environment: 'Indoor' } : {}
    } as any;

    const key = getEditIconKey(edit);
    const config = EQUIPMENT_CONFIG[key];
    if (!config) return null;
    const { IconComponent, color } = config;
    return <IconComponent className={`w-6 h-6 flex-shrink-0 ${color}`} />;
};


const AiRenameModal: React.FC<AiRenameModalProps> = ({ state, renames, error, onClose, onAccept }) => {
    const modalRef = useFocusTrap<HTMLDivElement>(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (state === 'reviewing' && renames) {
            setSelectedIds(new Set(renames.map(r => r.id)));
        } else {
            setSelectedIds(new Set());
        }
    }, [state, renames]);

    const handleToggle = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleAccept = () => {
        const accepted = renames
            ?.filter(r => selectedIds.has(r.id))
            .map(({ id, newName }) => ({ id, newName })) || [];
        onAccept(accepted);
    };

    const renderContent = () => {
        switch (state) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                        <p className="text-lg text-on-surface-variant">AI is reading the floorplan...</p>
                        <p className="text-sm text-on-surface-variant/60">This may take a moment.</p>
                    </div>
                );
            case 'reviewing':
                if (!renames || renames.length === 0) {
                     return <p className="text-center text-on-surface-variant">No suggestions available.</p>;
                }
                return (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">AI Renaming Suggestions ({renames.length})</h3>
                            <button 
                                onClick={() => setSelectedIds(prev => prev.size === renames.length ? new Set() : new Set(renames.map(r => r.id)))}
                                className="text-xs text-primary-400 hover:underline"
                            >
                                {selectedIds.size === renames.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            {renames.map((item) => (
                                <label key={item.id} className="bg-background p-3 rounded-lg flex items-center gap-4 border border-white/10 cursor-pointer hover:bg-white/5">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => handleToggle(item.id)}
                                        className="h-5 w-5 rounded-sm text-primary-600 bg-surface border-gray-500 focus:ring-primary-500 flex-shrink-0"
                                    />
                                    <IconComponent item={item} />
                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-2 text-sm truncate">
                                        <span className="text-on-surface-variant line-through truncate" title={item.oldName}>{item.oldName}</span>
                                        <ArrowRightIcon className="w-4 h-4 text-primary-400 flex-shrink-0 hidden sm:block" />
                                        <span className="font-semibold text-on-surface truncate" title={item.newName}>{item.newName}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 'error':
                return <p className="text-red-500 text-sm mt-4 text-center">{error || "An unknown error occurred."}</p>;
        }
    };
    
    return (
        <div ref={modalRef} className="fixed inset-0 bg-black/70 z-[100] flex items-end sm:items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-surface rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-on-surface flex items-center gap-2"><AiRenameIcon className="w-6 h-6 text-teal-400" /> AI Rename Equipment</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                
                <main className="flex-1 overflow-y-auto p-6 min-h-[150px]">
                    {renderContent()}
                </main>
                
                {state === 'reviewing' && (
                    <footer className="p-4 border-t border-white/10 flex-shrink-0 flex justify-end gap-3 items-center">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors">Cancel</button>
                        <button onClick={handleAccept} disabled={selectedIds.size === 0} className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50">
                            Accept Selected ({selectedIds.size})
                        </button>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default AiRenameModal;