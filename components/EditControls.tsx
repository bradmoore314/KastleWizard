import React, { useState, useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { AnyEdit, DeviceEdit, MarkerEdit, TextEdit, BorderStyle } from '../types';
import { DeleteIcon, CopyIcon, EditDataIcon, SameSizeIcon, PaletteIcon } from './Icons';
import { toast } from 'react-hot-toast';

// Modal for selecting which item to use as size reference
const SameSizeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    items: (DeviceEdit | MarkerEdit | TextEdit)[];
    onConfirm: (referenceItemId: string) => void;
}> = ({ isOpen, onClose, items, onConfirm }) => {
    const [selectedItemId, setSelectedItemId] = useState<string>('');

    useEffect(() => {
        if (items.length > 0 && !selectedItemId) {
            setSelectedItemId(items[0].id);
        }
    }, [items, selectedItemId]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedItemId) {
            onConfirm(selectedItemId);
            onClose();
        }
    };

    const getItemName = (item: AnyEdit) => {
        switch (item.type) {
            case 'device':
                const deviceData = item.data as any;
                return deviceData.location || deviceData.deviceType || 'Device';
            case 'marker':
                const markerData = item.data as any;
                return markerData.label || 'Marker';
            case 'text':
                return 'Text';
            case 'draw':
                return 'Drawing';
            case 'rectangle':
                return 'Rectangle';
            case 'conduit':
                return 'Conduit';
            default:
                return 'Item';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onClose}>
            <div className="bg-surface border border-white/10 rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-on-surface mb-4">Choose Size Reference</h2>
                <p className="text-on-surface-variant mb-4">
                    Select which item to use as the size reference for all selected items:
                </p>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    {items.map(item => (
                        <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer">
                            <input
                                type="radio"
                                name="sizeReference"
                                value={item.id}
                                checked={selectedItemId === item.id}
                                onChange={() => setSelectedItemId(item.id)}
                                className="text-primary-600"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-on-surface">{getItemName(item)}</div>
                                <div className="text-sm text-on-surface-variant">
                                    {item.width} × {item.height} pixels
                                </div>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-on-surface-variant hover:bg-white/10 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedItemId}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Apply Size
                    </button>
                </div>
            </div>
        </div>
    );
};

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
    const [isSameSizeModalOpen, setIsSameSizeModalOpen] = useState(false);
    const [sameSizeItems, setSameSizeItems] = useState<(DeviceEdit | MarkerEdit | TextEdit)[]>([]);
    
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
        if (selectedIds.length < 2) {
            toast.error('Please select at least 2 items to make the same size');
            return;
        }

        // Get the actual items from the current floorplan or project inventory
        const { projectInventory, floorplanInventory, floorplan } = getActiveInventories();
        const inventory = floorplan ? floorplanInventory : projectInventory;

        if (!inventory) {
            toast.error('No active floorplan or project');
            return;
        }

        const items = inventory.filter(e => selectedIds.includes(e.id));
        if (items.length < 2) {
            toast.error('Selected items not found');
            return;
        }

        setSameSizeItems(items);
        setIsSameSizeModalOpen(true);
    };

    const handleSameSizeConfirm = (referenceItemId: string) => {
        dispatch({ type: 'MAKE_SAME_SIZE_WITH_REFERENCE', payload: { selectedIds, referenceItemId } });
        toast.success('Items resized to match reference');
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
        </>
    )}

    return (
        <>
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

            <SameSizeModal
                isOpen={isSameSizeModalOpen}
                onClose={() => setIsSameSizeModalOpen(false)}
                items={sameSizeItems}
                onConfirm={handleSameSizeConfirm}
            />
        </>
    );
};

export default EditControls;