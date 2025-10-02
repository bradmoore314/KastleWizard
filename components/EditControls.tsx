import React, { useState, useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { AnyEdit, DeviceEdit, MarkerEdit, TextEdit, BorderStyle } from '../types';
import { DeleteIcon, CopyIcon, EditDataIcon, SameSizeIcon, PaletteIcon } from './Icons';
import { toast } from 'react-hot-toast';

interface EditControlsProps {
    selectedIds: string[];
    onOpenDeviceForm: (devices: DeviceEdit | DeviceEdit[]) => void;
    onOpenMarkerForm: (marker: MarkerEdit) => void;
    onEditTextRequest: (id: string) => void;
    totalPages: number;
    onCopyToPagesRequest: () => void;
}

const StyleIcon: React.FC<{ style: BorderStyle }> = ({ style }) => {
    switch (style) {
        case 'solid': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12 H19" /></svg>;
        case 'dashed': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"><path d="M5 12 H19" /></svg>;
        case 'dotted': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1 3" strokeLinecap="round"><path d="M5 12 H19" /></svg>;
        case 'cloud': return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 16c-2 0-3-1-3-3s1-3 3-3h12c2 0 3 1 3 3s-1 3-3 3" strokeLinejoin="round" /></svg>;
    }
}

const EditControls: React.FC<EditControlsProps> = ({ selectedIds, onOpenDeviceForm, onOpenMarkerForm, onEditTextRequest, totalPages, onCopyToPagesRequest }) => {
    const { projects, activeProjectId, activeFloorplanId } = useAppState();
    const dispatch = useAppDispatch();
    
    const [isStyleOpen, setIsStyleOpen] = useState(false);
    
    // This state is just for the UI controls
    const [styleState, setStyleState] = useState({
        borderWidth: 0,
        borderColor: '#000000',
        fillColor: '#ffffff',
        fillOpacity: 0,
        padding: 1,
        fontSize: 16,
        borderStyle: 'solid' as BorderStyle,
    });
    const [initialStyledEdit, setInitialStyledEdit] = useState<TextEdit | null>(null);
    
    const { inventory } = useMemo(() => {
        const project = projects.find(p => p.id === activeProjectId);
        if (!project) return { inventory: [] };
        if (activeFloorplanId === 'project-level-inventory') {
            return { inventory: project.projectLevelInventory };
        }
        const floorplan = project.floorplans.find(f => f.id === activeFloorplanId);
        return { inventory: floorplan?.inventory || [] };
    }, [projects, activeProjectId, activeFloorplanId]);

    const selectedEdits = useMemo(() => 
        inventory.filter(e => selectedIds.includes(e.id)),
        [inventory, selectedIds]
    );

    const singleSelectedEdit = selectedEdits.length === 1 ? selectedEdits[0] : null;

    const canBulkEdit = useMemo(() => {
        if (selectedEdits.length < 2) return false;
        if (selectedEdits.some(e => e.type !== 'device')) return false;
        const firstType = (selectedEdits[0] as DeviceEdit).deviceType;
        return selectedEdits.every(e => (e as DeviceEdit).deviceType === firstType);
    }, [selectedEdits]);

    useEffect(() => {
        if (singleSelectedEdit && singleSelectedEdit.type === 'text') {
            if (isStyleOpen) {
                 setInitialStyledEdit(singleSelectedEdit);
                 setStyleState({
                    borderWidth: singleSelectedEdit.borderWidth ?? 0,
                    borderColor: singleSelectedEdit.borderColor ?? '#000000',
                    fillColor: singleSelectedEdit.fillColor ?? '#ffffff',
                    fillOpacity: singleSelectedEdit.fillOpacity ?? 0,
                    padding: singleSelectedEdit.padding ?? 1,
                    fontSize: singleSelectedEdit.fontSize,
                    borderStyle: singleSelectedEdit.borderStyle ?? 'solid',
                });
            }
        } else {
            setIsStyleOpen(false);
            setInitialStyledEdit(null);
        }
    }, [singleSelectedEdit, isStyleOpen]);

    const handleStyleChange = (updates: Partial<typeof styleState>) => {
        setStyleState(prev => ({ ...prev, ...updates }));
    };

    const handleStyleSaveAndClose = () => {
        if (!initialStyledEdit) return;
        const currentEdit = { ...initialStyledEdit, ...styleState };
        
        // Only dispatch if something actually changed.
        if (JSON.stringify(initialStyledEdit) !== JSON.stringify(currentEdit)) {
            dispatch({
                type: 'UPDATE_EDITS_COMMAND',
                payload: {
                    previous: [initialStyledEdit],
                    current: [currentEdit],
                }
            });
        }
        setIsStyleOpen(false);
        setInitialStyledEdit(null);
    };

    const handleDelete = () => {
        dispatch({ type: 'DELETE_EDITS', payload: selectedIds });
    };

    const handleDuplicate = () => {
        dispatch({ type: 'DUPLICATE_EDITS', payload: selectedIds });
    };
    
    const handleMakeSameSize = () => {
        dispatch({ type: 'MAKE_SAME_SIZE', payload: selectedIds });
    };

    const handleOpenForm = () => {
        const isBulkEdit = selectedEdits.length > 1;

        if (isBulkEdit) {
            const firstDevice = selectedEdits[0] as DeviceEdit;
            const allSameType = selectedEdits.every(e => e.type === 'device' && (e as DeviceEdit).deviceType === firstDevice.deviceType);
            
            if (allSameType) {
                onOpenDeviceForm(selectedEdits as DeviceEdit[]);
            } else {
                toast.error("Bulk edit is only available for devices of the same type.");
            }
        } else if (singleSelectedEdit) {
            if (singleSelectedEdit.type === 'device') onOpenDeviceForm(singleSelectedEdit);
            else if (singleSelectedEdit.type === 'marker') onOpenMarkerForm(singleSelectedEdit);
            else if (singleSelectedEdit.type === 'text') onEditTextRequest(singleSelectedEdit.id);
        }
    };

    const hasDataForm = singleSelectedEdit && (singleSelectedEdit.type === 'device' || singleSelectedEdit.type === 'marker' || singleSelectedEdit.type === 'text');
    const isSingleTextEdit = singleSelectedEdit?.type === 'text';

    const renderPanel = (title: string, onDone: () => void, children: React.ReactNode) => (
         <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[55] w-[calc(100%-2rem)] max-w-sm">
             <div className="bg-surface/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
                <div className="p-4">
                    <div className="flex items-center mb-4">
                        <h3 className="font-semibold">{title}</h3>
                    </div>
                    <div className="space-y-4">
                        {children}
                    </div>
                </div>
                <div className="p-3 border-t border-white/10 flex justify-end">
                    <button onClick={onDone} className="px-4 py-1.5 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
    
    if (selectedEdits.length === 0) {
        return null;
    }

    if (isStyleOpen && isSingleTextEdit) {
         return renderPanel("Style", handleStyleSaveAndClose, <>
            <div className="grid grid-cols-[80px_1fr] items-center gap-x-4 gap-y-3">
                <label className="text-sm text-on-surface-variant">Font Size</label>
                <div className="flex items-center gap-2">
                    <input type="number" value={styleState.fontSize} onChange={e => handleStyleChange({ fontSize: parseInt(e.target.value, 10) || 16 })} className="w-16 bg-background rounded p-1 text-center" />
                </div>

                <label className="text-sm text-on-surface-variant">Border</label>
                <div className="flex items-center gap-2">
                    <input type="number" value={styleState.borderWidth} onChange={e => handleStyleChange({ borderWidth: parseInt(e.target.value, 10) || 0 })} className="w-16 bg-background rounded p-1 text-center" />
                    <input type="color" value={styleState.borderColor} onChange={e => handleStyleChange({ borderColor: e.target.value })} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent" />
                </div>
                
                 <label className="text-sm text-on-surface-variant self-start pt-1">Style</label>
                <div className="flex items-center gap-2">
                    {(['solid', 'dashed', 'dotted', 'cloud'] as BorderStyle[]).map(style => (
                        <button
                            key={style}
                            onClick={() => handleStyleChange({ borderStyle: style })}
                            className={`p-2 rounded-md transition-colors ${styleState.borderStyle === style ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}
                            title={style.charAt(0).toUpperCase() + style.slice(1)}
                        >
                            <StyleIcon style={style} />
                        </button>
                    ))}
                </div>

                <label className="text-sm text-on-surface-variant">Fill</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={styleState.fillColor} onChange={e => handleStyleChange({ fillColor: e.target.value })} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent"/>
                    <input type="range" min="0" max="1" step="0.05" value={styleState.fillOpacity} onChange={e => handleStyleChange({ fillOpacity: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                
                <label className="text-sm text-on-surface-variant">Padding</label>
                <input type="number" value={styleState.padding} onChange={e => handleStyleChange({ padding: parseInt(e.target.value, 10) || 0 })} className="w-16 bg-background rounded p-1 text-center" />
            </div>
         </>);
    }

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[55] w-auto">
            <div className="bg-surface/90 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-around gap-1 shadow-2xl p-2">
                <button onClick={handleDelete} className="flex flex-col items-center gap-1 p-2 rounded-lg text-red-400 hover:bg-white/10 w-20">
                    <DeleteIcon className="w-5 h-5" />
                    <span className="text-xs">Delete</span>
                </button>
                <button onClick={handleDuplicate} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 w-20">
                    <CopyIcon className="w-5 h-5" />
                    <span className="text-xs">Duplicate</span>
                </button>
                
                {totalPages > 1 && (
                     <button onClick={onCopyToPagesRequest} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 w-20">
                        <CopyIcon className="w-5 h-5" />
                        <span className="text-xs">Copy to...</span>
                    </button>
                )}

                {(hasDataForm || canBulkEdit) && (
                    <button 
                        onClick={handleOpenForm} 
                        disabled={selectedEdits.length > 1 && !canBulkEdit}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 w-20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <EditDataIcon className="w-5 h-5" />
                        <span className="text-xs">{selectedEdits.length > 1 ? 'Bulk Edit' : 'Edit'}</span>
                    </button>
                )}
                
                {isSingleTextEdit && (
                     <button onClick={() => setIsStyleOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 w-20">
                        <PaletteIcon className="w-5 h-5" />
                        <span className="text-xs">Style</span>
                    </button>
                )}
                
                {selectedEdits.length > 1 && (
                    <button onClick={handleMakeSameSize} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 w-20">
                        <SameSizeIcon className="w-5 h-5" />
                        <span className="text-xs">Same Size</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default EditControls;