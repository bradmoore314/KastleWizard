import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnyEdit, DeviceEdit, DeviceType, MarkerEdit, MarkerType, Floorplan, MiscellaneousData } from '../types';
import { camelCaseToTitle, sanitizeFilename } from '../utils';
import { ChevronsUpDown, ArrowUp, ArrowDown, GripVertical, Move, Edit, Trash2 } from 'lucide-react';
import { AddIcon, ExportIcon, EditDataIcon, DeleteIcon, CopyIcon, PlaceFromInventoryIcon, SearchIcon, CloseIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import saveAs from 'file-saver';
import ImageWithFallback from './ImageWithFallback';
import { DEVICE_TYPE_TITLES, EQUIPMENT_CONFIG } from '../services/equipmentConfig';
import { generateDeliverablesExcelBlob } from '../services/export';
import { toast } from 'react-hot-toast';

const portalContainer = document.getElementById('portals');

interface EquipmentListProps {
  inventory: AnyEdit[];
  viewContext: 'project' | 'floorplan';
  onEditDevices: (devices: DeviceEdit | DeviceEdit[]) => void;
  onEditMarker: (marker: MarkerEdit) => void;
  onPlaceDevice: (device: DeviceEdit) => void;
  onPlaceMarker: (marker: MarkerEdit) => void;
  onDeleteItems: (items: (DeviceEdit | MarkerEdit)[]) => void;
  onDuplicateDevice: (device: DeviceEdit) => void;
  onDuplicateMarker: (marker: MarkerEdit) => void;
  onAddDevice: (type: DeviceType) => void;
  onAddMarker: (type: MarkerType) => void;
  onViewImage: (imageLocalId: string) => void;
  onMoveItems: (editIds: string[], targetFloorplanId: string) => void;
}

const AddDropdown: React.FC<{
    buttonText: string;
    items: { key: string, label: string }[];
    onSelect: (key: string) => void;
}> = ({ buttonText, items, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownMenuRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const calculatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const estimatedHeight = 300; 

        // FIX: Create new style object for state updates instead of modifying a readonly object.
        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            width: '14rem',
            zIndex: 110,
            left: `${rect.left}px`,
        };

        if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
            setDropdownStyle({
                ...baseStyle,
                bottom: `${window.innerHeight - rect.top + 4}px`,
            });
        } else {
            setDropdownStyle({
                ...baseStyle,
                top: `${rect.bottom + 4}px`,
            });
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node) && dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', calculatePosition);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', calculatePosition);
        };
    }, [isOpen, calculatePosition]);

    const toggleDropdown = () => {
        if (!isOpen) {
            calculatePosition();
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (key: string) => {
        onSelect(key);
        setIsOpen(false);
    };
    
    const DropdownMenu = (
        <div ref={dropdownMenuRef} style={dropdownStyle} className="divide-y divide-gray-600 rounded-md bg-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu">
            <div className="px-1 py-1 max-h-72 overflow-y-auto" role="none">
                {items.map(({ key, label }) => (
                    <button key={key} onClick={() => handleSelect(key)} className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-on-surface-variant hover:bg-white/10" role="menuitem">{label}</button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="inline-block text-left">
            <button ref={buttonRef} type="button" onClick={toggleDropdown} className="inline-flex items-center justify-center gap-2 rounded-md border border-primary-500 bg-primary-600 px-3 py-2 sm:px-4 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75" aria-haspopup="true" aria-expanded={isOpen}>
                <AddIcon className="w-5 h-5" />
                {buttonText}
            </button>
            {isOpen && portalContainer && createPortal(DropdownMenu, portalContainer)}
        </div>
    );
};

const SortableHeader: React.FC<{ label: string; sortKey: string; sortConfig: { key: string, direction: 'asc' | 'desc' } | null; onSort: (key: string) => void; }> = ({ label, sortKey, sortConfig, onSort }) => {
    const isSorting = sortConfig?.key === sortKey;
    const direction = sortConfig?.direction;
    const Icon = isSorting ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;
    return (
        <th scope="col" className="px-2 py-3 font-medium text-on-surface whitespace-nowrap min-w-[120px] select-none" onClick={() => onSort(sortKey)}>
            <div className="flex items-center gap-2 cursor-pointer">
                {label}
                <Icon className={`w-4 h-4 ${isSorting ? 'text-primary-400' : 'text-on-surface-variant/50'}`} />
            </div>
        </th>
    );
};

const EquipmentList: React.FC<EquipmentListProps> = ({ inventory, viewContext, onEditDevices, onEditMarker, onPlaceDevice, onPlaceMarker, onDeleteItems, onDuplicateDevice, onDuplicateMarker, onAddDevice, onAddMarker, onViewImage, onMoveItems }) => {
    const { projects, activeProjectId, activeFloorplanId } = useAppState();
    const dispatch = useAppDispatch();
    const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
    const activeFloorplan = useMemo(() => activeProject?.floorplans.find(f => f.id === activeFloorplanId), [activeProject, activeFloorplanId]);
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [sortConfigs, setSortConfigs] = useState<Record<string, { key: string, direction: 'asc' | 'desc' } | null>>({});
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    // Reordering is only enabled in the project-level view where the inventory is a single, non-virtual list.
    // When viewing from a floorplan context, the list is a combination of that floorplan's items and all unplaced items,
    // so drag-and-drop reordering is disabled to prevent incorrect state updates.
    const isProjectLevelView = viewContext === 'project';
    const isReorderingEnabled = isProjectLevelView;

    const deviceDropdownItems = useMemo(() => Object.entries(DEVICE_TYPE_TITLES).map(([key, title]) => ({ key, label: title.endsWith('s') ? title.slice(0, -1) : title })), []);
    const markerDropdownItems = useMemo(() => Object.entries(EQUIPMENT_CONFIG).filter(([, conf]) => conf.type === 'marker').map(([key, conf]) => ({ key, label: conf.label })), []);
    
    const filteredInventory = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
          return inventory;
        }
    
        return inventory.filter(item => {
            if (item.type !== 'device' && item.type !== 'marker') return false;
    
            const checkValue = (value: any): boolean => {
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(query);
            };
    
            const searchInData = (data: any): boolean => {
                for (const key in data) {
                    if (key === 'images') continue;
                    const value = data[key];
                    if (Array.isArray(value)) {
                        if (key === 'custom_fields') {
                            if ((value as any[]).some((field: any) => checkValue(field.label) || checkValue(field.value))) return true;
                        }
                    } else if (checkValue(value)) {
                        return true;
                    }
                }
                return false;
            }
    
            const itemTypeString = item.type === 'device' ? item.deviceType : item.markerType;
            if (checkValue(itemTypeString.replace(/-/g, ' '))) return true;
            
            if (searchInData(item.data)) return true;
    
            return false;
        });
    }, [inventory, searchQuery]);

    const devices = useMemo(() => filteredInventory.filter(edit => edit.type === 'device') as DeviceEdit[], [filteredInventory]);
    const markers = useMemo(() => filteredInventory.filter(edit => edit.type === 'marker') as MarkerEdit[], [filteredInventory]);

    const groupedDevices = useMemo(() => devices.reduce((acc, device) => {
        if (!acc[device.deviceType]) acc[device.deviceType] = [];
        acc[device.deviceType].push(device);
        return acc;
    }, {} as Record<DeviceType, DeviceEdit[]>), [devices]);

    useEffect(() => {
        setSelectedIds(new Set());
    }, [searchQuery]);

    useEffect(() => {
        setSelectedIds(new Set());
        setActiveFilter('all');
        setSortConfigs({});
    }, [inventory]);

    const summaryItems = useMemo(() => {
        const items = [...Object.entries(DEVICE_TYPE_TITLES).map(([key, title]) => ({ key, title, Icon: EQUIPMENT_CONFIG[Object.keys(EQUIPMENT_CONFIG).find(k => k.startsWith(key)) as string]?.IconComponent, count: (groupedDevices[key as DeviceType] || []).length })), ...Object.entries(EQUIPMENT_CONFIG).filter(([, conf]) => conf.type === 'marker').map(([key, conf]) => ({ key, title: conf.label, Icon: conf.IconComponent, count: markers.filter(m => m.markerType === key).length }))].filter(item => item.count > 0);
        return items.sort((a, b) => b.count - a.count);
    }, [groupedDevices, markers]);

    const handleSort = (category: string, key: string) => {
        const currentSort = sortConfigs[category];
        let newDirection: 'asc' | 'desc' = 'asc';
        if (currentSort && currentSort.key === key && currentSort.direction === 'asc') newDirection = 'desc';
        setSortConfigs(prev => ({ ...prev, [category]: { key, direction: newDirection } }));
    };

    const handleReorder = (draggedId: string, targetId: string) => {
        // FIX: Explicitly type the findIndex callback parameter to resolve type inference issues.
        const draggedIndex = inventory.findIndex((i: AnyEdit) => i.id === draggedId);
        // FIX: Explicitly type the findIndex callback parameter to resolve type inference issues.
        const targetIndex = inventory.findIndex((i: AnyEdit) => i.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return;
        const reorderedInventory = Array.from(inventory);
        const [movedItem] = reorderedInventory.splice(draggedIndex, 1);
        // FIX: Explicitly type the findIndex callback parameter to resolve type inference issues.
        const newTargetIndex = reorderedInventory.findIndex((i: AnyEdit) => i.id === targetId);
        reorderedInventory.splice(newTargetIndex, 0, movedItem);
        dispatch({ type: 'REORDER_EDITS_COMMAND', payload: { previousInventory: inventory, currentInventory: reorderedInventory } });
    };

    const genericSort = <T extends DeviceEdit | MarkerEdit>(items: T[], config: { key: string, direction: 'asc' | 'desc' } | null): T[] => {
        if (!config) return items;
        const { key, direction } = config;
        return [...items].sort((a, b) => {
            // FIX: Cast data object to `any` to allow dynamic property access for sorting.
            const valA = (a.data as any)[key];
            // FIX: Cast data object to `any` to allow dynamic property access for sorting.
            const valB = (b.data as any)[key];
            const aValue = valA === null || valA === undefined ? '' : valA;
            const bValue = valB === null || valB === undefined ? '' : valB;
            if (typeof aValue === 'number' && typeof bValue === 'number') return direction === 'asc' ? aValue - bValue : bValue - aValue;
            if (typeof aValue === 'boolean' && typeof bValue === 'boolean') return direction === 'asc' ? (aValue === bValue ? 0 : aValue ? -1 : 1) : (aValue === bValue ? 0 : aValue ? 1 : -1);
            return direction === 'asc' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
        });
    };

    const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedItemId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); };
    const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); if (id !== draggedItemId) setDropTargetId(id); };
    const handleDragLeave = () => setDropTargetId(null);
    const handleDrop = (e: React.DragEvent, id: string) => { e.preventDefault(); if (draggedItemId && draggedItemId !== id) handleReorder(draggedItemId, id); setDraggedItemId(null); setDropTargetId(null); };

    const handleExport = async (format: 'xlsx') => {
        if (!activeProject) return;
        const toastId = toast.loading(`Exporting as ${format.toUpperCase()}...`);
        try {
            if (format === 'xlsx') {
                const blob = generateDeliverablesExcelBlob(activeProject);
                saveAs(blob, `${sanitizeFilename(activeProject.name)}_Deliverables.xlsx`);
            }
            toast.success('Export successful!', { id: toastId });
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Export failed.', { id: toastId });
        }
    };
    
    const allKeysPerType = useMemo(() => {
        const keysByType: Record<string, string[]> = {};
        Object.keys(groupedDevices).forEach(key => {
            const deviceList = groupedDevices[key as DeviceType];
            const keySet = deviceList.reduce((keys, device) => {
                Object.entries(device.data).forEach(([k, value]) => {
                    if (value && String(value).trim() !== '' && k !== 'images' && k !== 'interior_perimeter' && k !== 'custom_fields' && k !== 'location') keys.add(k);
                });
                return keys;
            }, new Set<string>());
            keysByType[key] = Array.from(keySet);
        });
        return keysByType;
    }, [groupedDevices]);

    // Selection Logic
    const handleToggleOne = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleToggleAll = (itemIds: string[]) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            const allSelected = itemIds.every(id => newSet.has(id));
            if (allSelected) itemIds.forEach(id => newSet.delete(id));
            else itemIds.forEach(id => newSet.add(id));
            return newSet;
        });
    };
    
    const selectedItems = useMemo(() => inventory.filter(i => selectedIds.has(i.id)) as (DeviceEdit | MarkerEdit)[], [inventory, selectedIds]);
    const canBulkEdit = useMemo(() => {
        if (selectedItems.length < 2) return false;
        if (selectedItems.some(e => e.type !== 'device')) return false;
        const firstType = (selectedItems[0] as DeviceEdit).deviceType;
        return selectedItems.every(i => i.type === 'device' && (i as DeviceEdit).deviceType === firstType);
    }, [selectedItems]);
    
    const allPlacedIdsOnAnyFloorplan = useMemo(() => new Set(activeProject?.floorplans.flatMap(fp => fp.placedEditIds) || []), [activeProject]);
    
    const markersToDisplay = useMemo(() => {
        if (activeFilter === 'all' || searchQuery.trim()) return markers;
        const config = EQUIPMENT_CONFIG[activeFilter];
        if (config?.type === 'marker') {
            return markers.filter(m => m.markerType === activeFilter);
        }
        return [];
    }, [activeFilter, markers, searchQuery]);

    const devicesToDisplay = useMemo(() => {
        if (activeFilter === 'all' || searchQuery.trim()) {
            return Object.entries(DEVICE_TYPE_TITLES).map(([key]) => key);
        }
        return [activeFilter];
    }, [activeFilter, searchQuery]);


    return (
        <div className="w-full h-full flex flex-col text-on-surface bg-background">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center py-4 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Equipment List</h1>
                            <p className="text-md text-on-surface-variant mt-1">Manage all devices and markers in this inventory.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-on-surface-variant/70" />
                                </div>
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full sm:w-56 pl-10 pr-10 py-2 border border-white/20 rounded-md leading-5 bg-surface text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Search all fields..."
                                />
                                {searchQuery && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="p-1 rounded-full text-on-surface-variant/70 hover:text-on-surface hover:bg-white/10"
                                            aria-label="Clear search"
                                        >
                                            <CloseIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <AddDropdown buttonText="Add Device" items={deviceDropdownItems} onSelect={(key) => onAddDevice(key as DeviceType)} />
                            <AddDropdown buttonText="Add Marker" items={markerDropdownItems} onSelect={(key) => onAddMarker(key as MarkerType)} />
                            <button onClick={() => handleExport('xlsx')} className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-surface px-3 py-2 sm:px-4 text-sm font-medium text-on-surface hover:bg-white/10"><ExportIcon className="w-5 h-5" /> Export</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    {/* Summary & Filter */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-3">Summary</h2>
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                            <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 flex items-center gap-3 ${activeFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-surface hover:bg-white/10 border border-white/10'}`}>All Equipment <span className="text-xs opacity-70 bg-black/20 px-1.5 py-0.5 rounded-full">{filteredInventory.length}</span></button>
                            {summaryItems.map(item => (<button key={item.key} onClick={() => setActiveFilter(item.key)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 flex items-center gap-3 ${activeFilter === item.key ? 'bg-primary-600 text-white' : 'bg-surface hover:bg-white/10 border border-white/10'}`}>{item.Icon && <item.Icon className="w-5 h-5" />} {item.title} <span className="text-xs opacity-70 bg-black/20 px-1.5 py-0.5 rounded-full">{item.count}</span></button>))}
                        </div>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedIds.size > 0 && (
                        <div className="sticky top-0 z-40 mb-6 p-3 bg-primary-900/80 backdrop-blur-sm rounded-lg border border-primary-700 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <p className="font-semibold">{selectedIds.size} item(s) selected</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onEditDevices(selectedItems as DeviceEdit[])} disabled={!canBulkEdit} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" title={canBulkEdit ? "Edit selected items" : "Can only bulk edit devices of the same type"}><Edit className="w-4 h-4" /> Edit</button>
                                <AddDropdown buttonText="Move" items={(activeProject?.floorplans.filter(fp => fp.id !== activeFloorplanId) || []).map(fp => ({ key: fp.id, label: fp.name }))} onSelect={(fpId) => onMoveItems(Array.from(selectedIds), fpId)} />
                                <button onClick={() => onDeleteItems(selectedItems)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"><Trash2 className="w-4 h-4" /> Delete</button>
                            </div>
                        </div>
                    )}
                    
                    {/* Equipment Tables */}
                    <div className="space-y-12">
                         {devicesToDisplay.filter((key) => (groupedDevices[key as DeviceType] || []).length > 0).map((key) => {
                             const deviceList = groupedDevices[key as DeviceType];
                             const title = DEVICE_TYPE_TITLES[key as DeviceType];
                             const sortConfig = sortConfigs[key] || null;
                             const sortedDeviceList = genericSort(deviceList, sortConfig);
                             const allKeys = allKeysPerType[key] || [];
                             const isDraggable = isReorderingEnabled && !sortConfig && !searchQuery.trim();
                             return (
                                <div key={key}>
                                    <h2 className="text-2xl font-bold mb-4">{title}</h2>
                                    <div className="w-full overflow-x-auto bg-surface border border-white/10 rounded-xl">
                                        <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="p-3 w-12"><input type="checkbox" onChange={() => handleToggleAll(deviceList.map(d => d.id))} checked={deviceList.length > 0 && deviceList.every(d => selectedIds.has(d.id))} className="h-4 w-4 rounded text-primary-600 bg-surface border-gray-500 focus:ring-primary-500"/></th>
                                                    <th className="p-3 w-8"><GripVertical className="w-4 h-4 text-transparent" /></th>
                                                    <th className="p-3 w-16">Image</th>
                                                    <SortableHeader label="Location" sortKey="location" sortConfig={sortConfig} onSort={(sortKey) => handleSort(key, sortKey)} />
                                                    <th className="px-2 py-3 w-28">Actions</th>
                                                    {allKeys.map(k => <SortableHeader key={k} label={camelCaseToTitle(k.replace(/_/g, ' '))} sortKey={k} sortConfig={sortConfig} onSort={(sortKey) => handleSort(key, sortKey)} />)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedDeviceList.map(device => (
                                                    <tr key={device.id} draggable={isDraggable} onDragStart={e => handleDragStart(e, device.id)} onDragOver={e => handleDragOver(e, device.id)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, device.id)} className={`border-b border-white/10 last:border-b-0 transition-colors ${selectedIds.has(device.id) ? 'bg-primary-900/50' : 'hover:bg-white/5'} ${draggedItemId === device.id ? 'opacity-30' : ''} ${dropTargetId === device.id ? 'border-t-2 border-primary-500' : ''}`}>
                                                        <td className="p-3"><input type="checkbox" checked={selectedIds.has(device.id)} onChange={() => handleToggleOne(device.id)} className="h-4 w-4 rounded text-primary-600 bg-surface border-gray-500 focus:ring-primary-500"/></td>
                                                        <td className="p-3 text-center">{isDraggable && <GripVertical className="w-4 h-4 text-on-surface-variant/50 cursor-grab"/>}</td>
                                                        <td className="p-2">
                                                            {device.data.images && device.data.images.length > 0 && (
                                                                // FIX: Cast data object to any to allow property access.
                                                                <ImageWithFallback localId={device.data.images[0].localId} alt={(device.data as any).location} className="w-12 h-12 object-cover rounded-md cursor-pointer" onClick={() => onViewImage(device.data.images![0].localId)} />
                                                            )}
                                                        </td>
                                                        {/* FIX: Cast data object to any to allow property access. */}
                                                        <td className="px-2 py-4 font-semibold text-on-surface">{(device.data as any).location}</td>
                                                        <td className="px-2 py-4">
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => onEditDevices(device)} className="p-2 text-on-surface-variant hover:text-primary-400" title="Edit Data"><EditDataIcon className="w-4 h-4" /></button>
                                                                <button onClick={() => onDuplicateDevice(device)} className="p-2 text-on-surface-variant hover:text-primary-400" title="Duplicate"><CopyIcon className="w-4 h-4" /></button>
                                                                {!allPlacedIdsOnAnyFloorplan.has(device.id) && <button onClick={() => onPlaceDevice(device)} className="p-2 text-on-surface-variant hover:text-primary-400" title="Place on Floorplan"><PlaceFromInventoryIcon className="w-4 h-4" /></button>}
                                                                <button onClick={() => onDeleteItems([device])} className="p-2 text-on-surface-variant hover:text-red-400" title="Delete"><DeleteIcon className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                        {allKeys.map(k => {
                                                            const value = (device.data as any)[k];
                                                            let displayValue: React.ReactNode = '';
                                                            if (value !== null && value !== undefined) {
                                                                if (typeof value === 'boolean') {
                                                                    displayValue = value ? 'Yes' : 'No';
                                                                } else if (k === 'custom_fields' && Array.isArray(value)) {
                                                                    displayValue = (value as MiscellaneousData['custom_fields']).map(f => `${f.label}: ${f.value}`).join('; ');
                                                                } else {
                                                                    displayValue = String(value);
                                                                }
                                                            }
                                                            return (
                                                                <td key={k} className="px-2 py-4 text-on-surface-variant truncate max-w-xs" title={String(displayValue)}>
                                                                    {displayValue}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                             )
                         })}
                         
                         {markersToDisplay.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Markers</h2>
                                <div className="w-full overflow-x-auto bg-surface border border-white/10 rounded-xl">
                                    <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="p-3 w-12"><input type="checkbox" onChange={() => handleToggleAll(markersToDisplay.map(d => d.id))} checked={markersToDisplay.length > 0 && markersToDisplay.every(d => selectedIds.has(d.id))} className="h-4 w-4 rounded text-primary-600 bg-surface border-gray-500 focus:ring-primary-500"/></th>
                                                <th className="p-3 w-8"><GripVertical className="w-4 h-4 text-transparent" /></th>
                                                <th className="p-3 w-16">Image</th>
                                                <SortableHeader label="Label" sortKey="label" sortConfig={sortConfigs['markers'] || null} onSort={(sortKey) => handleSort('markers', sortKey)} />
                                                <th className="px-2 py-3 w-28">Actions</th>
                                                <SortableHeader label="Notes" sortKey="notes" sortConfig={sortConfigs['markers'] || null} onSort={(sortKey) => handleSort('markers', sortKey)} />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {genericSort(markersToDisplay, sortConfigs['markers'] || null).map(marker => {
                                                const isDraggable = isReorderingEnabled && !sortConfigs['markers'] && !searchQuery.trim();
                                                return (
                                                    <tr key={marker.id} draggable={isDraggable} onDragStart={e => handleDragStart(e, marker.id)} onDragOver={e => handleDragOver(e, marker.id)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, marker.id)} className={`border-b border-white/10 last:border-b-0 transition-colors ${selectedIds.has(marker.id) ? 'bg-primary-900/50' : 'hover:bg-white/5'} ${draggedItemId === marker.id ? 'opacity-30' : ''} ${dropTargetId === marker.id ? 'border-t-2 border-primary-500' : ''}`}>
                                                        <td className="p-3"><input type="checkbox" checked={selectedIds.has(marker.id)} onChange={() => handleToggleOne(marker.id)} className="h-4 w-4 rounded text-primary-600 bg-surface border-gray-500 focus:ring-primary-500"/></td>
                                                        <td className="p-3 text-center">{isDraggable && <GripVertical className="w-4 h-4 text-on-surface-variant/50 cursor-grab"/>}</td>
                                                        <td className="p-2">
                                                            {marker.data.images && marker.data.images.length > 0 && (
                                                                // FIX: Cast data object to any to allow property access.
                                                                <ImageWithFallback localId={marker.data.images[0].localId} alt={(marker.data as any).label} className="w-12 h-12 object-cover rounded-md cursor-pointer" onClick={() => onViewImage(marker.data.images![0].localId)} />
                                                            )}
                                                        </td>
                                                        {/* FIX: Cast data object to any to allow property access. */}
                                                        <td className="px-2 py-4 font-semibold text-on-surface">{(marker.data as any).label}</td>
                                                        <td className="px-2 py-4">
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => onEditMarker(marker)} className="p-2 text-on-surface-variant hover:text-primary-400" title="Edit Data"><EditDataIcon className="w-4 h-4" /></button>
                                                                <button onClick={() => onDuplicateMarker(marker)} className="p-2 text-on-surface-variant hover:text-primary-400" title="Duplicate"><CopyIcon className="w-4 h-4" /></button>
                                                                {!allPlacedIdsOnAnyFloorplan.has(marker.id) && <button onClick={() => onPlaceMarker(marker)} className="p-2 text-on-surface-variant hover:text-primary-400" title="Place on Floorplan"><PlaceFromInventoryIcon className="w-4 h-4" /></button>}
                                                                <button onClick={() => onDeleteItems([marker])} className="p-2 text-on-surface-variant hover:text-red-400" title="Delete"><DeleteIcon className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-4 text-on-surface-variant truncate max-w-xs" title={marker.data.notes || ''}>{marker.data.notes}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EquipmentList;