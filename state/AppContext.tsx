import React, { createContext, useReducer, useContext, useEffect, Dispatch, useState } from 'react';
import { Project, Floorplan, AnyEdit, DeviceEdit, DeviceData, MarkerData, DeviceFormConfig, EquipmentImage, Command, GatewayConfiguration, MarkerEdit, TextEdit, DrawingEdit, RectangleEdit, ConduitEdit, AuditLogEntry, ElevatorLetterFormData } from '../types';
import { migrateProjectDataToV2, getClientUserId, camelCaseToTitle } from '../utils';
import { defaultFormConfig } from '../services/formConfig';
import { EQUIPMENT_CONFIG } from '../services/equipmentConfig';
import { saveFile, deleteFile, getAllFileIds } from '../services/fileStorage';
import { ALL_QUESTIONS } from '../services/questions';
import { toast } from 'react-hot-toast';
import { clearDirectoryHandle } from '../services/autoBackup';

// --- STATE ---
interface AppState {
    projects: Project[];
    activeProjectId: string | null;
    activeFloorplanId: string | null;
    formConfig: DeviceFormConfig;
    undoStack: Command[];
    redoStack: Command[];
    visibleLayers: Set<string>;
    isGridVisible: boolean;
}

const initialState: AppState = {
    projects: [],
    activeProjectId: null,
    activeFloorplanId: null,
    formConfig: defaultFormConfig,
    undoStack: [],
    redoStack: [],
    visibleLayers: new Set(Object.keys(EQUIPMENT_CONFIG)),
    isGridVisible: false,
};


// --- ACTIONS ---
type Action =
    | { type: 'SET_PROJECTS'; payload: Project[] }
    | { type: 'ADD_PROJECT'; payload: Project }
    | { type: 'CREATE_PROJECT_AND_ACTIVATE' }
    | { type: 'DELETE_PROJECT'; payload: string }
    | { type: 'UPDATE_PROJECT_NAME'; payload: { id: string, name: string } }
    | { type: 'UPDATE_PROJECT'; payload: Project }
    | { type: 'ADD_FLOORPLAN'; payload: { projectId: string, floorplan: Floorplan } }
    | { type: 'DELETE_FLOORPLAN'; payload: { projectId: string, floorplanId: string } }
    | { type: 'DELETE_PAGES'; payload: { pageIndices: number[] } }
    | { type: 'UPDATE_FLOORPLAN_NAME'; payload: { floorplanId: string, name: string } }
    | { type: 'SET_ACTIVE_PROJECT'; payload: string | null }
    | { type: 'SET_ACTIVE_FLOORPLAN'; payload: { projectId: string, floorplanId: string } | null }
    | { type: 'ADD_EDIT'; payload: { edit: AnyEdit, isPlaced: boolean } }
    | { type: 'ADD_PLACED_EDITS'; payload: AnyEdit[] }
    | { type: 'DELETE_EDITS'; payload: string[] }
    | { type: 'DUPLICATE_EDITS'; payload: string[] }
    | { type: 'DUPLICATE_ITEMS_TO_PROJECT_INVENTORY'; payload: { item: DeviceEdit | MarkerEdit; count: number } }
    | { type: 'COPY_EDITS_TO_PAGES'; payload: { editIds: string[], targetPageIndices: number[] } }
    | { type: 'MOVE_EDITS_TO_FLOORPLAN'; payload: { editIds: string[], targetFloorplanId: string } }
    | { type: 'PLACE_EXISTING_ITEM'; payload: { item: DeviceEdit | MarkerEdit, x: number, y: number, pageIndex: number } }
    | { type: 'BRING_TO_FRONT'; payload: string[] }
    | { type: 'SEND_TO_BACK'; payload: string[] }
    | { type: 'MAKE_SAME_SIZE'; payload: string[] }
    | { type: 'MAKE_SAME_SIZE_WITH_REFERENCE'; payload: { selectedIds: string[], referenceItemId: string } }
    | { type: 'UPDATE_DEVICE_DATA'; payload: { deviceId: string, data: DeviceData } }
    | { type: 'UPDATE_MULTIPLE_DEVICE_DATA'; payload: { deviceIds: string[], data: Partial<DeviceData> } }
    | { type: 'UPDATE_MARKER_DATA'; payload: { id: string, data: MarkerData } }
    | { type: 'ADD_IMAGES_TO_DEVICE'; payload: { deviceId: string, images: { metadata: EquipmentImage, file: File }[] } }
    | { type: 'DELETE_IMAGE_FROM_DEVICE'; payload: { deviceId: string, imageLocalId: string } }
    | { type: 'ADD_IMAGES_TO_MARKER'; payload: { markerId: string, images: { metadata: EquipmentImage, file: File }[] } }
    | { type: 'DELETE_IMAGE_FROM_MARKER'; payload: { markerId: string, imageLocalId: string } }
    | { type: 'SET_FORM_CONFIG'; payload: DeviceFormConfig }
    | { type: 'SET_ANALYSIS_RESULT'; payload: { projectId: string, result: string } }
    | { type: 'UPDATE_ELEVATOR_LETTER_CONTENT', payload: { projectId: string, content: string } }
    | { type: 'UPDATE_ELEVATOR_LETTER_FORM_DATA'; payload: { projectId: string; formData: ElevatorLetterFormData } }
    | { type: 'LOAD_PROJECT'; payload: { project: Project, loadedFiles: Record<string, File> } }
    | { type: 'RESTORE_BACKUP'; payload: { projects: Project[], loadedFiles: Record<string, File> } }
    | { type: 'UPDATE_CHECKLIST_ANSWER'; payload: { questionId: string, answer: any } }
    | { type: 'TOGGLE_LAYER_VISIBILITY'; payload: string }
    | { type: 'TOGGLE_GRID_VISIBILITY' }
    | { type: 'UPDATE_GATEWAY_CONFIG'; payload: { projectId: string, configuration: GatewayConfiguration } }
    | { type: 'UPDATE_EDITS_COMMAND'; payload: { previous: AnyEdit[], current: AnyEdit[] } }
    | { type: 'REORDER_EDITS_COMMAND'; payload: { previousInventory: AnyEdit[]; currentInventory: AnyEdit[]; } }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'RESET_STATE' };


const findItemInProjects = (projects: Project[], itemId: string): { project: Project, floorplan?: Floorplan, inventory: AnyEdit[], item: AnyEdit, itemIndex: number } | null => {
    for (const project of projects) {
        let itemIndex = project.projectLevelInventory.findIndex(e => e.id === itemId);
        if (itemIndex !== -1) {
            return { project, inventory: project.projectLevelInventory, item: project.projectLevelInventory[itemIndex], itemIndex };
        }
        for (const floorplan of project.floorplans) {
            itemIndex = floorplan.inventory.findIndex(e => e.id === itemId);
            if (itemIndex !== -1) {
                return { project, floorplan, inventory: floorplan.inventory, item: floorplan.inventory[itemIndex], itemIndex };
            }
        }
    }
    return null;
};

// --- AUDIT LOG HELPER ---
const createLogEntry = (action: string, description: string, details?: Record<string, any>): AuditLogEntry => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId: getClientUserId(),
    action,
    description,
    details
});

const getEditName = (edit: AnyEdit): string => {
    if (edit.type === 'device' || edit.type === 'marker') {
        return (edit.data as any).location || (edit.data as any).label || `Unnamed ${edit.type}`;
    }
    if (edit.type === 'text') {
        return `Text: "${edit.text.substring(0, 20)}..."`;
    }
    return `Unnamed ${edit.type}`;
};


// --- REDUCER ---
const appReducer = (state: AppState, action: Action): AppState => {
    const { projects, activeProjectId, activeFloorplanId } = state;
    const activeProject = projects.find(p => p.id === activeProjectId);
    
    const getActiveInventories = () => {
        if (!activeProject) return { projectInventory: [], floorplanInventory: null, floorplan: null };
        const floorplan = activeProject.floorplans.find(f => f.id === activeFloorplanId);
        return { 
            projectInventory: activeProject.projectLevelInventory,
            floorplanInventory: floorplan ? floorplan.inventory : null,
            floorplan: floorplan || null
        };
    };

    switch (action.type) {
        case 'SET_PROJECTS':
            return { ...state, projects: action.payload };

        case 'CREATE_PROJECT_AND_ACTIVATE': {
            // FIX: Add missing properties to align with the Project type.
            const newProject: Project = { 
                id: crypto.randomUUID(), 
                name: 'New Project', 
                floorplans: [], 
                projectLevelInventory: [],
                checklistAnswers: {},
                auditLog: [createLogEntry('CREATE_PROJECT', 'Created new project "New Project"')],
                gatewayCalculations: [],
                conduitCalculations: [],
                laborCalculations: [],
            };
            const newProjects = [...state.projects, newProject];
            return { 
                ...state, 
                projects: newProjects, 
                activeProjectId: newProject.id,
                activeFloorplanId: 'project-level-inventory', // Default to general notes
                undoStack: [],
                redoStack: []
            };
        }

        case 'ADD_PROJECT': {
            const newProjects = [...state.projects, action.payload];
            return { ...state, projects: newProjects, activeProjectId: action.payload.id, activeFloorplanId: 'project-level-inventory' };
        }
        
        case 'DELETE_PROJECT': {
            const newProjects = state.projects.filter(p => p.id !== action.payload);
            const newActiveProjectId = state.activeProjectId === action.payload ? (newProjects[0]?.id || null) : state.activeProjectId;
            const newActiveFloorplanId = newActiveProjectId ? 'project-level-inventory' : null;

             // Delete associated floorplan files
            const projectToDelete = state.projects.find(p => p.id === action.payload);
            projectToDelete?.floorplans.forEach(fp => deleteFile(fp.id));

            return { ...state, projects: newProjects, activeProjectId: newActiveProjectId, activeFloorplanId: newActiveFloorplanId };
        }
        
        case 'UPDATE_PROJECT_NAME': {
            let oldName = '';
            const newProjects = state.projects.map(p => {
                if (p.id === action.payload.id) {
                    oldName = p.name;
                    const log = createLogEntry('UPDATE_PROJECT', `Updated project name from "${oldName}" to "${action.payload.name}"`);
                    return { ...p, name: action.payload.name, auditLog: [log, ...p.auditLog] };
                }
                return p;
            });
            return { ...state, projects: newProjects };
        }
        case 'UPDATE_PROJECT': {
            const newProjects = state.projects.map(p => {
                if (p.id === action.payload.id) {
                    const log = createLogEntry('UPDATE_PROJECT', `Updated project data`);
                    return { ...action.payload, auditLog: [log, ...action.payload.auditLog] };
                }
                return p;
            });
            return { ...state, projects: newProjects };
        }

        case 'ADD_FLOORPLAN': {
            let projectToUpdate = state.projects.find(p => p.id === action.payload.projectId);
            if (!projectToUpdate) return state;
        
            const isFirstFloorplan = projectToUpdate.floorplans.length === 0;
            let projectLevelInventoryToMove: AnyEdit[] = [];
            let updatedProjectLevelInventory = projectToUpdate.projectLevelInventory;
        
            // When the first floorplan is added, move any existing project-level items to it.
            if (isFirstFloorplan && projectToUpdate.projectLevelInventory.length > 0) {
                projectLevelInventoryToMove = [...projectToUpdate.projectLevelInventory];
                updatedProjectLevelInventory = []; // Clear it from project level
            }
            
            const newFloorplanWithMovedItems = {
                ...action.payload.floorplan,
                inventory: [...action.payload.floorplan.inventory, ...projectLevelInventoryToMove],
                 // These moved items are now unplaced items for this floorplan. They are not added to placedEditIds.
            };
            
            const newProjects = state.projects.map(p => {
                if (p.id === action.payload.projectId) {
                    const log = createLogEntry('ADD_FLOORPLAN', `Added floorplan "${action.payload.floorplan.name}"`);
                    return {
                        ...p,
                        floorplans: [...p.floorplans, newFloorplanWithMovedItems],
                        projectLevelInventory: updatedProjectLevelInventory,
                        auditLog: [log, ...p.auditLog]
                    };
                }
                return p;
            });
        
            return { ...state, projects: newProjects };
        }
        
        case 'DELETE_FLOORPLAN': {
             const { projectId, floorplanId } = action.payload;
             const floorplanToDelete = state.projects.find(p => p.id === projectId)?.floorplans.find(f => f.id === floorplanId);
             if (!floorplanToDelete) return state;

             const newProjects = state.projects.map(p => {
                 if (p.id === projectId) {
                     const log = createLogEntry('DELETE_FLOORPLAN', `Deleted floorplan "${floorplanToDelete.name}"`);
                     return { ...p, floorplans: p.floorplans.filter(f => f.id !== floorplanId), auditLog: [log, ...p.auditLog] };
                 }
                 return p;
             });
             
             deleteFile(floorplanId); // Delete associated PDF file
             
             let newActiveFloorplanId = state.activeFloorplanId;
             if (state.activeFloorplanId === floorplanId) {
                newActiveFloorplanId = 'project-level-inventory';
             }

             return { ...state, projects: newProjects, activeFloorplanId: newActiveFloorplanId };
        }

        case 'DELETE_PAGES': {
            if (!activeProject || !activeFloorplanId || activeFloorplanId === 'project-level-inventory') return state;
            
            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;
                
                const log = createLogEntry('DELETE_PAGES', `Deleted page(s) ${action.payload.pageIndices.map(i => i + 1).join(', ')}`);
                let newP = { ...p, auditLog: [log, ...p.auditLog] };

                const newFloorplans = newP.floorplans.map(fp => {
                    if (fp.id !== activeFloorplanId) return fp;
                    
                    const mappedInventory = (fp.inventory || []).map((edit): AnyEdit => {
                        const pagesDeletedBefore = action.payload.pageIndices.filter(i => i < edit.pageIndex).length;
                        if (pagesDeletedBefore === 0) return edit;
                        const newPageIndex = edit.pageIndex - pagesDeletedBefore;
                        
                        // Using a switch statement is the safest way to update a property
                        // on a member of a discriminated union without losing its specific type.
                        switch (edit.type) {
                            case 'text': return { ...edit, pageIndex: newPageIndex };
                            case 'draw': return { ...edit, pageIndex: newPageIndex };
                            case 'rectangle': return { ...edit, pageIndex: newPageIndex };
                            case 'conduit': return { ...edit, pageIndex: newPageIndex };
                            case 'device': return { ...edit, pageIndex: newPageIndex };
                            case 'marker': return { ...edit, pageIndex: newPageIndex };
                        }
                    });
                    
                    const newInventory = mappedInventory.filter(edit => !action.payload.pageIndices.includes(edit.pageIndex));
                    
                    return { ...fp, inventory: newInventory, placedEditIds: newInventory.map(e => e.id) };
                });
                return { ...newP, floorplans: newFloorplans };
            });
            return { ...state, projects: newProjects };
        }
        
        case 'UPDATE_FLOORPLAN_NAME': {
            let oldName = '';
            let projId = '';
            const newProjects = state.projects.map(p => ({
                ...p,
                floorplans: p.floorplans.map(f => {
                    if (f.id === action.payload.floorplanId) {
                        oldName = f.name;
                        projId = p.id;
                        return { ...f, name: action.payload.name };
                    }
                    return f;
                })
            }));

            if (oldName && projId) {
                const finalProjects = newProjects.map(p => {
                    if (p.id === projId) {
                        const log = createLogEntry('UPDATE_FLOORPLAN', `Updated floorplan name from "${oldName}" to "${action.payload.name}"`);
                        return { ...p, auditLog: [log, ...p.auditLog] };
                    }
                    return p;
                });
                return { ...state, projects: finalProjects };
            }
            return { ...state, projects: newProjects };
        }
        
        case 'SET_ACTIVE_PROJECT': {
            if (state.activeProjectId === action.payload) return state;
            return {
                ...state,
                activeProjectId: action.payload,
                activeFloorplanId: action.payload ? 'project-level-inventory' : null,
                undoStack: [],
                redoStack: []
            };
        }
        
        case 'SET_ACTIVE_FLOORPLAN': {
             if (!action.payload) {
                 return { ...state, activeFloorplanId: null, activeProjectId: null };
             }
             const { projectId, floorplanId } = action.payload;
             if (state.activeProjectId === projectId && state.activeFloorplanId === floorplanId) return state;
             
             return { ...state, activeProjectId: projectId, activeFloorplanId: floorplanId, undoStack: [], redoStack: [] };
        }

        case 'ADD_EDIT': {
            const { edit, isPlaced } = action.payload;
            if (!activeProject) return state;
        
            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;
        
                const logDetails = isPlaced ? { coordinates: { x: Math.round(edit.x), y: Math.round(edit.y) } } : undefined;
                const logDescription = isPlaced
                    ? `Created and placed item: "${getEditName(edit)}"`
                    : `Created item: "${getEditName(edit)}"`;
                const log = createLogEntry('CREATE_ITEM', logDescription, logDetails);
                const newP = { ...p, auditLog: [log, ...p.auditLog] };
        
                if (activeFloorplanId && activeFloorplanId !== 'project-level-inventory') {
                    const newFloorplans = newP.floorplans.map(f => {
                        if (f.id !== activeFloorplanId) return f;
        
                        const newInventory = [...f.inventory, edit];
                        const newPlacedIds = isPlaced ? [...f.placedEditIds, edit.id] : f.placedEditIds;
        
                        return {
                            ...f,
                            inventory: newInventory,
                            placedEditIds: newPlacedIds
                        };
                    });
                    return { ...newP, floorplans: newFloorplans };
                } else {
                    return { ...newP, projectLevelInventory: [...newP.projectLevelInventory, edit] };
                }
            });
        
            return { ...state, projects: newProjects };
        }
        
        case 'ADD_PLACED_EDITS': {
             if (!activeProject || !activeFloorplanId || activeFloorplanId === 'project-level-inventory') return state;
             
             const newProjects = projects.map(p => {
                 if (p.id !== activeProjectId) return p;
                 
                 const newEdits = action.payload;
                 const log = createLogEntry('CREATE_ITEMS', `Created and placed ${newEdits.length} items from AI suggestion`);
                 const newP = { ...p, auditLog: [log, ...p.auditLog] };

                 const newFloorplans = newP.floorplans.map(fp => {
                     if (fp.id !== activeFloorplanId) return fp;
                     
                     const newEditIds = newEdits.map(e => e.id);
                     const existingProjectLevelItems = newP.projectLevelInventory.filter(item => newEditIds.includes(item.id));
                     
                     // If items already exist in project inventory, don't add duplicates, just mark as placed
                     if (existingProjectLevelItems.length > 0) {
                         return {
                             ...fp,
                             inventory: [...fp.inventory, ...existingProjectLevelItems],
                             placedEditIds: [...fp.placedEditIds, ...newEditIds]
                         };
                     } else {
                         return {
                            ...fp,
                            inventory: [...fp.inventory, ...newEdits],
                            placedEditIds: [...fp.placedEditIds, ...newEditIds]
                         }
                     }
                 });
                 return { ...newP, floorplans: newFloorplans };
             });

             return { ...state, projects: newProjects };
        }
        
        case 'DELETE_EDITS': {
            const idsToDelete = new Set(action.payload);
            const deletedItems: AnyEdit[] = [];
            
            state.projects.forEach(p => {
                p.projectLevelInventory.forEach(e => { if(idsToDelete.has(e.id)) deletedItems.push(e); });
                p.floorplans.forEach(f => f.inventory.forEach(e => { if(idsToDelete.has(e.id)) deletedItems.push(e); }));
            });

            const newProjects = state.projects.map(p => {
                const newProjectInventory = p.projectLevelInventory.filter(e => !idsToDelete.has(e.id));
                const newFloorplans = p.floorplans.map(f => ({
                    ...f,
                    inventory: f.inventory.filter(e => !idsToDelete.has(e.id)),
                    placedEditIds: f.placedEditIds.filter(id => !idsToDelete.has(id))
                }));
                
                if (p.id === activeProjectId && deletedItems.length > 0) {
                    const itemNames = deletedItems.map(getEditName).join(', ');
                    const log = createLogEntry('DELETE_ITEMS', `Deleted ${deletedItems.length} item(s): ${itemNames}`);
                    return { ...p, projectLevelInventory: newProjectInventory, floorplans: newFloorplans, auditLog: [log, ...p.auditLog] };
                }
                return { ...p, projectLevelInventory: newProjectInventory, floorplans: newFloorplans };
            });
            return { ...state, projects: newProjects };
        }
        
        case 'DUPLICATE_EDITS': {
            const idsToDuplicate = new Set(action.payload);
            const itemsToDuplicate: AnyEdit[] = [];
            const foundIn = {
                projectInventory: false,
                floorplanId: ''
            };

            const project = state.projects.find(p => {
                if (!foundIn.projectInventory && p.projectLevelInventory.some(e => idsToDuplicate.has(e.id))) {
                    foundIn.projectInventory = true;
                    itemsToDuplicate.push(...p.projectLevelInventory.filter(e => idsToDuplicate.has(e.id)));
                    return true;
                }
                const fp = p.floorplans.find(f => f.inventory.some(e => idsToDuplicate.has(e.id)));
                if (fp) {
                    foundIn.floorplanId = fp.id;
                    itemsToDuplicate.push(...fp.inventory.filter(e => idsToDuplicate.has(e.id)));
                    return true;
                }
                return false;
            });
            
            if (!project || itemsToDuplicate.length === 0) return state;

            const duplicatedItems = itemsToDuplicate.map((item): AnyEdit => {
                const newItem = {
                    ...item,
                    id: crypto.randomUUID(),
                    x: item.x + 15,
                    y: item.y + 15,
                };
                if ('data' in item && item.data) {
                    const newData = JSON.parse(JSON.stringify(item.data));
                    if ('location' in newData) {
                        newData.location = `${newData.location} (Copy)`;
                    } else if ('label' in newData) {
                        newData.label = `${newData.label} (Copy)`;
                    }
                    if ('images' in newData) {
                        delete newData.images;
                    }
                    (newItem as DeviceEdit | MarkerEdit).data = newData;
                }
                return newItem;
            });

            const newProjects = state.projects.map(p => {
                if (p.id !== project.id) return p;

                const itemNames = itemsToDuplicate.map(getEditName).join(', ');
                const log = createLogEntry('DUPLICATE_ITEMS', `Duplicated ${itemsToDuplicate.length} item(s): ${itemNames}`);
                const newP = { ...p, auditLog: [log, ...p.auditLog] };

                if (foundIn.projectInventory) {
                    return { ...newP, projectLevelInventory: [...newP.projectLevelInventory, ...duplicatedItems] };
                } else if (foundIn.floorplanId) {
                    const newFloorplans = newP.floorplans.map(f => {
                        if (f.id !== foundIn.floorplanId) return f;
                        return { 
                            ...f, 
                            inventory: [...f.inventory, ...duplicatedItems],
                            placedEditIds: [...f.placedEditIds, ...duplicatedItems.map(d => d.id)]
                        };
                    });
                    return { ...newP, floorplans: newFloorplans };
                }
                return newP;
            });
            return { ...state, projects: newProjects };
        }

        case 'DUPLICATE_ITEMS_TO_PROJECT_INVENTORY': {
            const { item, count } = action.payload;
            if (!activeProject) return state;

            const duplicates = Array.from({ length: count }, () => {
                const newItem = { ...item, id: crypto.randomUUID() };

                // Deep copy data and update name
                const newData = JSON.parse(JSON.stringify(item.data));
                if ('location' in newData) {
                    newData.location = `${newData.location} (Copy)`;
                } else if ('label' in newData) {
                    newData.label = `${newData.label} (Copy)`;
                }
                if ('images' in newData) {
                    delete newData.images;
                }
                (newItem as DeviceEdit | MarkerEdit).data = newData;

                // Reset placement info as it's going to unplaced inventory
                newItem.x = 0;
                newItem.y = 0;
                newItem.pageIndex = -1;

                return newItem;
            });

            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;
                const log = createLogEntry('DUPLICATE_ITEMS', `Created ${count} duplicate(s) of "${getEditName(item)}" in project inventory`);
                return { ...p, projectLevelInventory: [...p.projectLevelInventory, ...duplicates], auditLog: [log, ...p.auditLog] };
            });
            return { ...state, projects: newProjects };
        }
        
        case 'COPY_EDITS_TO_PAGES': {
            const { editIds, targetPageIndices } = action.payload;
            if (!activeProject || !activeFloorplanId || targetPageIndices.length === 0) return state;
            
            const sourceFloorplan = activeProject.floorplans.find(f => f.id === activeFloorplanId);
            if (!sourceFloorplan) return state;

            const editsToCopy = sourceFloorplan.inventory.filter(e => editIds.includes(e.id));
            if (editsToCopy.length === 0) return state;
            
            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;

                const log = createLogEntry('COPY_ITEMS', `Copied ${editsToCopy.length} item(s) to page(s): ${targetPageIndices.map(i => i + 1).join(', ')}`);
                const newP = { ...p, auditLog: [log, ...p.auditLog] };
                let newFloorplans = [...newP.floorplans];

                targetPageIndices.forEach(pageIndex => {
                    const newEditsForPage = editsToCopy.map(edit => ({
                        ...JSON.parse(JSON.stringify(edit)),
                        id: crypto.randomUUID(),
                        pageIndex: pageIndex,
                    }));
                    
                    newFloorplans = newFloorplans.map(fp => {
                        // All edits are copied to the same floorplan document, just different pages.
                        if (fp.id === activeFloorplanId) {
                            return {
                                ...fp,
                                inventory: [...fp.inventory, ...newEditsForPage],
                                placedEditIds: [...fp.placedEditIds, ...newEditsForPage.map(e => e.id)]
                            };
                        }
                        return fp;
                    });
                });
                return { ...newP, floorplans: newFloorplans };
            });

            return { ...state, projects: newProjects };
        }
        
        case 'MOVE_EDITS_TO_FLOORPLAN': {
            const { editIds, targetFloorplanId } = action.payload;
            const editIdSet = new Set(editIds);

            const editsToMove: AnyEdit[] = [];
            
            // This logic is complex, so we'll build a new projects array state immutably.
            let tempProjects = JSON.parse(JSON.stringify(state.projects));

            // Find and remove items from their sources
            for (const project of tempProjects) {
                const foundInProject = project.projectLevelInventory.filter((e: AnyEdit) => editIdSet.has(e.id));
                if (foundInProject.length > 0) {
                    editsToMove.push(...foundInProject);
                    project.projectLevelInventory = project.projectLevelInventory.filter((e: AnyEdit) => !editIdSet.has(e.id));
                }

                for (const floorplan of project.floorplans) {
                    const foundInFloorplan = floorplan.inventory.filter((e: AnyEdit) => editIdSet.has(e.id));
                    if (foundInFloorplan.length > 0) {
                        editsToMove.push(...foundInFloorplan);
                        floorplan.inventory = floorplan.inventory.filter((e: AnyEdit) => !editIdSet.has(e.id));
                        floorplan.placedEditIds = floorplan.placedEditIds.filter((id: string) => !editIdSet.has(id));
                    }
                }
            }
            
            // Add items to the target floorplan
            for (const project of tempProjects) {
                const targetFp = project.floorplans.find((f: Floorplan) => f.id === targetFloorplanId);
                if (targetFp) {
                    targetFp.inventory.push(...editsToMove);
                    if (project.id === activeProjectId) {
                        const log = createLogEntry('MOVE_ITEMS', `Moved ${editsToMove.length} item(s) to floorplan "${targetFp.name}"`);
                        project.auditLog = [log, ...project.auditLog];
                    }
                    break; 
                }
            }

            return { ...state, projects: tempProjects };
        }

        case 'PLACE_EXISTING_ITEM': {
            const { item, x, y, pageIndex } = action.payload;
            if (!activeProject || !activeFloorplanId || activeFloorplanId === 'project-level-inventory') return state;
        
            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;
        
                let originalItem: AnyEdit | undefined;
                let wasInProjectInventory = false;
        
                // Find the item in project-level inventory first.
                originalItem = p.projectLevelInventory.find(i => i.id === item.id);
                if (originalItem) {
                    wasInProjectInventory = true;
                } else {
                    // If not found, search all floorplans.
                    for (const floorplan of p.floorplans) {
                        originalItem = floorplan.inventory.find(i => i.id === item.id);
                        if (originalItem) break;
                    }
                }
        
                if (!originalItem) {
                    console.error(`PLACE_EXISTING_ITEM: Could not find item with ID ${item.id} anywhere in the project.`);
                    return p; // Return project unchanged if item not found
                }
                
                let updatedProjectLevelInventory = p.projectLevelInventory;
                
                // If the item was found in the project-level (unplaced) inventory, remove it from there.
                if(wasInProjectInventory) {
                    updatedProjectLevelInventory = p.projectLevelInventory.filter(i => i.id !== item.id);
                }
        
                let floorplanName = '';
                const newFloorplans = p.floorplans.map(f => {
                    if (f.id !== activeFloorplanId) return f;
                    floorplanName = f.name;
        
                    // The item to be added to the current floorplan's inventory.
                    const placedItem = { ...originalItem!, x, y, pageIndex };
        
                    // We need to either add a new item or update an existing one if it was already there but unplaced.
                    const existingItemIndex = f.inventory.findIndex(i => i.id === item.id);
                    let updatedInventory;
                    if (existingItemIndex > -1) {
                        // It was already on this floorplan, just unplaced. Update it.
                        updatedInventory = [...f.inventory];
                        updatedInventory[existingItemIndex] = placedItem;
                    } else {
                        // It's new to this floorplan. Add it.
                        updatedInventory = [...f.inventory, placedItem];
                    }
                    
                    return {
                        ...f,
                        inventory: updatedInventory,
                        placedEditIds: [...new Set([...f.placedEditIds, item.id])]
                    };
                });
                
                const logDetails = { coordinates: { x: Math.round(x), y: Math.round(y) } };
                const log = createLogEntry('PLACE_ITEM', `Placed item "${getEditName(item)}" on floorplan "${floorplanName}"`, logDetails);
                return { ...p, floorplans: newFloorplans, projectLevelInventory: updatedProjectLevelInventory, auditLog: [log, ...p.auditLog] };
            });
        
            return { ...state, projects: newProjects };
        }

        case 'BRING_TO_FRONT':
        case 'SEND_TO_BACK': {
            const { projectInventory, floorplanInventory, floorplan } = getActiveInventories();
            const inventory = floorplan ? floorplanInventory : projectInventory;
            if (!inventory) return state;

            const selectedSet = new Set(action.payload);
            const selectedItems = inventory.filter(e => selectedSet.has(e.id));
            const otherItems = inventory.filter(e => !selectedSet.has(e.id));
            
            const newInventory = action.type === 'BRING_TO_FRONT'
                ? [...otherItems, ...selectedItems]
                : [...selectedItems, ...otherItems];

            if (floorplan) { // On a floorplan
                const newProjects = projects.map(p => p.id === activeProjectId ? {
                    ...p,
                    floorplans: p.floorplans.map(f => f.id === activeFloorplanId ? { ...f, inventory: newInventory } : f)
                } : p);
                return { ...state, projects: newProjects };
            } else { // On project-level inventory
                 const newProjects = projects.map(p => p.id === activeProjectId ? {
                    ...p,
                    projectLevelInventory: newInventory
                 } : p);
                 return { ...state, projects: newProjects };
            }
        }
        
        case 'MAKE_SAME_SIZE': {
            const { projectInventory, floorplanInventory, floorplan } = getActiveInventories();
            const inventory = floorplan ? floorplanInventory : projectInventory;
            if (!inventory || action.payload.length < 2) return state;
             
             const selectedItems = inventory.filter(e => action.payload.includes(e.id));
             if (selectedItems.length < 2) return state;

             const templateItem = selectedItems[selectedItems.length - 1];
             const { width, height } = templateItem;

             // FIX: Use a switch statement to ensure TypeScript preserves discriminated union types when mapping.
             const newInventory = inventory.map((item): AnyEdit => {
                 if (action.payload.includes(item.id)) {
                     switch (item.type) {
                        case 'text':
                            return { ...item, width, height };
                        case 'draw':
                            return { ...item, width, height };
                        case 'rectangle':
                            return { ...item, width, height };
                        case 'conduit':
                            return { ...item, width, height };
                        case 'device':
                            return { ...item, width, height };
                        case 'marker':
                            return { ...item, width, height };
                     }
                 }
                 return item;
             });

            if (floorplan) {
                const newProjects = projects.map(p => p.id === activeProjectId ? {
                    ...p,
                    floorplans: p.floorplans.map(f => f.id === activeFloorplanId ? { ...f, inventory: newInventory } : f)
                } : p);
                return { ...state, projects: newProjects };
            } else {
                 const newProjects = projects.map(p => p.id === activeProjectId ? {
                    ...p,
                    projectLevelInventory: newInventory
                 } : p);
                 return { ...state, projects: newProjects };
            }
        }

        case 'MAKE_SAME_SIZE_WITH_REFERENCE': {
            const { projectInventory, floorplanInventory, floorplan } = getActiveInventories();
            const inventory = floorplan ? floorplanInventory : projectInventory;
            if (!inventory) return state;

            const { selectedIds, referenceItemId } = action.payload;
            const referenceItem = inventory.find(e => e.id === referenceItemId);
            if (!referenceItem) return state;

            const { width, height } = referenceItem;

            const newInventory = inventory.map((item): AnyEdit => {
                if (selectedIds.includes(item.id) && item.id !== referenceItemId) {
                    switch (item.type) {
                        case 'text':
                            return { ...item, width, height };
                        case 'draw':
                            return { ...item, width, height };
                        case 'rectangle':
                            return { ...item, width, height };
                        case 'conduit':
                            return { ...item, width, height };
                        case 'device':
                            return { ...item, width, height };
                        case 'marker':
                            return { ...item, width, height };
                    }
                }
                return item;
            });

            if (floorplan) {
                const newProjects = projects.map(p => p.id === activeProjectId ? {
                    ...p,
                    floorplans: p.floorplans.map(f => f.id === activeFloorplanId ? { ...f, inventory: newInventory } : f)
                } : p);
                return { ...state, projects: newProjects };
            } else {
                const newProjects = projects.map(p => p.id === activeProjectId ? {
                    ...p,
                    projectLevelInventory: newInventory
                } : p);
                return { ...state, projects: newProjects };
            }
        }

        case 'UPDATE_DEVICE_DATA': {
            const logs: AuditLogEntry[] = [];
            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;

                const processInventory = (inv: AnyEdit[]) => inv.map(e => {
                    if (e.id === action.payload.deviceId && e.type === 'device') {
                        const oldData = e.data;
                        const newData = action.payload.data;
                        Object.keys(newData).forEach(key => {
                            const oldValue = (oldData as any)[key];
                            const newValue = (newData as any)[key];
                            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                                logs.push(createLogEntry(
                                    'UPDATE_ITEM',
                                    `Updated '${camelCaseToTitle(key)}' on "${getEditName(e)}" from "${oldValue}" to "${newValue}"`
                                ));
                            }
                        });
                        return { ...e, data: newData };
                    }
                    return e;
                });
                
                const newP = {
                    ...p,
                    projectLevelInventory: processInventory(p.projectLevelInventory),
                    floorplans: p.floorplans.map(f => ({ ...f, inventory: processInventory(f.inventory) }))
                };
                if (logs.length > 0) {
                    newP.auditLog = [...logs.reverse(), ...p.auditLog];
                }
                return newP;
            });
            return { ...state, projects: newProjects };
        }
        
        case 'UPDATE_MULTIPLE_DEVICE_DATA': {
            const idsToUpdate = new Set(action.payload.deviceIds);
            const logs: AuditLogEntry[] = [];
            
            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;

                const processInventory = (inv: AnyEdit[]) => inv.map(e => {
                    if (idsToUpdate.has(e.id) && e.type === 'device') {
                        const oldData = e.data;
                        const newData = { ...oldData, ...action.payload.data };
                        Object.keys(action.payload.data).forEach(key => {
                            const oldValue = (oldData as any)[key];
                            const newValue = (newData as any)[key];
                            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                                logs.push(createLogEntry(
                                    'UPDATE_ITEM_BULK',
                                    `Updated '${camelCaseToTitle(key)}' on "${getEditName(e)}" from "${oldValue}" to "${newValue}"`
                                ));
                            }
                        });
                        return { ...e, data: newData };
                    }
                    return e;
                });
                
                const newP = {
                    ...p,
                    projectLevelInventory: processInventory(p.projectLevelInventory),
                    floorplans: p.floorplans.map(f => ({ ...f, inventory: processInventory(f.inventory) }))
                };

                if (logs.length > 0) {
                    newP.auditLog = [...logs.reverse(), ...p.auditLog];
                }
                return newP;
            });
            return { ...state, projects: newProjects };
        }
        
        case 'UPDATE_MARKER_DATA': {
            const logs: AuditLogEntry[] = [];
            const newProjects = state.projects.map(p => ({
                ...p,
                projectLevelInventory: p.projectLevelInventory.map(e => {
                    if (e.id === action.payload.id && e.type === 'marker') {
                        // Diffing logic here
                        return { ...e, data: action.payload.data };
                    }
                    return e;
                }),
                floorplans: p.floorplans.map(f => ({
                    ...f,
                    inventory: f.inventory.map(e => {
                        if (e.id === action.payload.id && e.type === 'marker') {
                            const oldData = e.data;
                            const newData = action.payload.data;
                             Object.keys(newData).forEach(key => {
                                const oldValue = (oldData as any)[key];
                                const newValue = (newData as any)[key];
                                if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                                    logs.push(createLogEntry(
                                        'UPDATE_ITEM',
                                        `Updated '${camelCaseToTitle(key)}' on "${getEditName(e)}" from "${oldValue}" to "${newValue}"`
                                    ));
                                }
                            });
                            return { ...e, data: newData };
                        }
                        return e;
                    })
                }))
            }));
            
            if (logs.length > 0 && activeProject) {
                const finalProjects = newProjects.map(p => {
                    if (p.id === activeProjectId) {
                        return { ...p, auditLog: [...logs.reverse(), ...p.auditLog] };
                    }
                    return p;
                });
                return { ...state, projects: finalProjects };
            }
            return { ...state, projects: newProjects };
        }
        
        case 'ADD_IMAGES_TO_DEVICE':
        case 'ADD_IMAGES_TO_MARKER': {
            const { images } = action.payload;
            const itemId = 'deviceId' in action.payload ? action.payload.deviceId : action.payload.markerId;
            const itemType = action.type === 'ADD_IMAGES_TO_DEVICE' ? 'device' : 'marker';
            
            images.forEach(({ file, metadata }) => saveFile(metadata.localId, file));

            const updateImages = (currentImages: EquipmentImage[] = []) => [...currentImages, ...images.map(i => i.metadata)];
            
            const newProjects = state.projects.map(p => ({
                ...p,
                projectLevelInventory: p.projectLevelInventory.map(e => {
                    // FIX: Use explicit type checks to help TypeScript's inference.
                    if (e.id === itemId) {
                        if (e.type === 'device' && itemType === 'device') {
                            return { ...e, data: { ...e.data, images: updateImages(e.data.images) } };
                        }
                        if (e.type === 'marker' && itemType === 'marker') {
                            return { ...e, data: { ...e.data, images: updateImages(e.data.images) } };
                        }
                    }
                    return e;
                }),
                floorplans: p.floorplans.map(f => ({
                    ...f,
                    inventory: f.inventory.map(e => {
                         // FIX: Use explicit type checks to help TypeScript's inference.
                         if (e.id === itemId) {
                            if (e.type === 'device' && itemType === 'device') {
                                return { ...e, data: { ...e.data, images: updateImages(e.data.images) } };
                            }
                            if (e.type === 'marker' && itemType === 'marker') {
                                return { ...e, data: { ...e.data, images: updateImages(e.data.images) } };
                            }
                        }
                        return e;
                    })
                }))
            }));
            return { ...state, projects: newProjects };
        }
        
        case 'DELETE_IMAGE_FROM_DEVICE':
        case 'DELETE_IMAGE_FROM_MARKER': {
            const { imageLocalId } = action.payload;
            const itemId = 'deviceId' in action.payload ? action.payload.deviceId : action.payload.markerId;
            const itemType = action.type === 'DELETE_IMAGE_FROM_DEVICE' ? 'device' : 'marker';

            deleteFile(imageLocalId);

            const filterImages = (images: EquipmentImage[] = []) => images.filter(img => img.localId !== imageLocalId);

            const newProjects = state.projects.map(p => ({
                ...p,
                projectLevelInventory: p.projectLevelInventory.map(e => {
                    // FIX: Use explicit type checks to help TypeScript's inference.
                    if (e.id === itemId) {
                        if (e.type === 'device' && itemType === 'device') {
                            return { ...e, data: { ...e.data, images: filterImages(e.data.images) } };
                        }
                        if (e.type === 'marker' && itemType === 'marker') {
                            return { ...e, data: { ...e.data, images: filterImages(e.data.images) } };
                        }
                    }
                    return e;
                }),
                floorplans: p.floorplans.map(f => ({
                    ...f,
                    inventory: f.inventory.map(e => {
                        // FIX: Use explicit type checks to help TypeScript's inference.
                         if (e.id === itemId) {
                            if (e.type === 'device' && itemType === 'device') {
                                return { ...e, data: { ...e.data, images: filterImages(e.data.images) } };
                            }
                            if (e.type === 'marker' && itemType === 'marker') {
                                return { ...e, data: { ...e.data, images: filterImages(e.data.images) } };
                            }
                        }
                        return e;
                    })
                }))
            }));
            return { ...state, projects: newProjects };
        }
        
        case 'SET_FORM_CONFIG':
            return { ...state, formConfig: action.payload };

        case 'SET_ANALYSIS_RESULT': {
            const newProjects = state.projects.map(p => 
                p.id === action.payload.projectId ? { ...p, analysis_result: action.payload.result } : p
            );
            return { ...state, projects: newProjects };
        }

        case 'UPDATE_ELEVATOR_LETTER_CONTENT': {
            const newProjects = state.projects.map(p => 
                p.id === action.payload.projectId ? { ...p, elevator_letter_content: action.payload.content } : p
            );
            return { ...state, projects: newProjects };
        }
        
        case 'UPDATE_ELEVATOR_LETTER_FORM_DATA': {
            const newProjects = state.projects.map(p =>
                p.id === action.payload.projectId
                    ? { ...p, elevatorLetterFormData: action.payload.formData }
                    : p
            );
            return { ...state, projects: newProjects };
        }
        
        case 'LOAD_PROJECT': {
            const { project, loadedFiles } = action.payload;
            Object.entries(loadedFiles).forEach(([id, file]) => saveFile(id, file));
            const newProjects = [...state.projects, project];
            return { ...state, projects: newProjects, activeProjectId: project.id, activeFloorplanId: 'project-level-inventory', undoStack: [], redoStack: [] };
        }
        
        case 'RESTORE_BACKUP': {
            const { projects, loadedFiles } = action.payload;
            Object.entries(loadedFiles).forEach(([id, file]) => saveFile(id, file));
            return {
                ...initialState,
                projects: projects,
                activeProjectId: projects[0]?.id || null,
                activeFloorplanId: projects[0] ? 'project-level-inventory' : null
            };
        }
        
        case 'UPDATE_CHECKLIST_ANSWER': {
            if (!activeProject) return state;
            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;
                const questionText = ALL_QUESTIONS.find(q => q.id === action.payload.questionId)?.text || action.payload.questionId;
                const log = createLogEntry('UPDATE_CHECKLIST', `Answered "${questionText}" with "${action.payload.answer}"`);
                const newAnswers = { ...p.checklistAnswers, [action.payload.questionId]: action.payload.answer };
                return { ...p, checklistAnswers: newAnswers, auditLog: [log, ...p.auditLog] };
            });
            return { ...state, projects: newProjects };
        }

        case 'TOGGLE_LAYER_VISIBILITY': {
            const newSet = new Set(state.visibleLayers);
            if (newSet.has(action.payload)) {
                newSet.delete(action.payload);
            } else {
                newSet.add(action.payload);
            }
            return { ...state, visibleLayers: newSet };
        }

        case 'TOGGLE_GRID_VISIBILITY': {
            return { ...state, isGridVisible: !state.isGridVisible };
        }
        
        case 'UPDATE_GATEWAY_CONFIG': {
             // FIX: Correctly update the `gatewayCalculations` array instead of the legacy `gatewayConfiguration` property.
             const newProjects = state.projects.map(p => {
                if (p.id !== action.payload.projectId) return p;
                
                let newGatewayCalcs = [...(p.gatewayCalculations || [])];
                if (newGatewayCalcs.length > 0) {
                    // Update the first one
                    newGatewayCalcs[0] = { ...newGatewayCalcs[0], ...action.payload.configuration };
                } else {
                    // Create a new one
                    newGatewayCalcs.push({
                        id: crypto.randomUUID(),
                        name: 'Default Calculation',
                        ...action.payload.configuration
                    });
                }
                return { ...p, gatewayCalculations: newGatewayCalcs };
             });
            return { ...state, projects: newProjects };
        }
        
        // --- COMMAND PATTERN (UNDO/REDO) ACTIONS ---
        case 'UPDATE_EDITS_COMMAND': {
            if (!activeProject) return state;
            
            const floorplanId = activeFloorplanId || 'project-level-inventory';
            const command: Command = { type: 'UPDATE_EDITS', payload: { ...action.payload, floorplanId } };
            
            const logs: AuditLogEntry[] = [];
            action.payload.previous.forEach(prevEdit => {
                const currEdit = action.payload.current.find(c => c.id === prevEdit.id);
                if (!currEdit) return;
        
                if (Math.round(prevEdit.x) !== Math.round(currEdit.x) || Math.round(prevEdit.y) !== Math.round(currEdit.y)) {
                    logs.push(createLogEntry(
                        'MOVE_ITEM',
                        `Moved item "${getEditName(currEdit)}"`,
                        { 
                            from: { x: Math.round(prevEdit.x), y: Math.round(prevEdit.y) }, 
                            to: { x: Math.round(currEdit.x), y: Math.round(currEdit.y) }
                        }
                    ));
                }
                if (Math.round(prevEdit.width) !== Math.round(currEdit.width) || Math.round(prevEdit.height) !== Math.round(currEdit.height)) {
                     logs.push(createLogEntry('RESIZE_ITEM', `Resized item "${getEditName(currEdit)}"`));
                }
                if (Math.round(prevEdit.rotation) !== Math.round(currEdit.rotation)) {
                     logs.push(createLogEntry('ROTATE_ITEM', `Rotated item "${getEditName(currEdit)}"`));
                }
                 if (prevEdit.type === 'text' && currEdit.type === 'text') {
                    if (prevEdit.text !== currEdit.text) {
                        logs.push(createLogEntry('UPDATE_ITEM', `Updated text for item`));
                    }
                    if (
                        prevEdit.fontSize !== currEdit.fontSize ||
                        prevEdit.borderColor !== currEdit.borderColor ||
                        prevEdit.borderWidth !== currEdit.borderWidth ||
                        prevEdit.fillColor !== currEdit.fillColor ||
                        prevEdit.fillOpacity !== currEdit.fillOpacity ||
                        prevEdit.padding !== currEdit.padding
                    ) {
                        logs.push(createLogEntry('STYLE_ITEM', `Updated style for text item`));
                    }
                }
            });

            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;
                
                const updateInventory = (inventory: AnyEdit[]): AnyEdit[] =>
                    inventory.map(e => action.payload.current.find(c => c.id === e.id) || e);

                let newP = { ...p };
                if (logs.length > 0) {
                    newP.auditLog = [...logs.reverse(), ...newP.auditLog];
                }

                if (floorplanId === 'project-level-inventory') {
                    return { ...newP, projectLevelInventory: updateInventory(newP.projectLevelInventory) };
                } else {
                    const newFloorplans = newP.floorplans.map(f => 
                        f.id === floorplanId ? { ...f, inventory: updateInventory(f.inventory) } : f
                    );
                    return { ...newP, floorplans: newFloorplans };
                }
            });

            return { 
                ...state, 
                projects: newProjects,
                undoStack: [...state.undoStack, command],
                redoStack: [] // Clear redo stack on new action
            };
        }

        case 'REORDER_EDITS_COMMAND': {
            const { previousInventory, currentInventory } = action.payload;
            if (!activeProject) return state;

            const floorplanId = activeFloorplanId || 'project-level-inventory';

            const command: Command = {
                type: 'REORDER_EDITS',
                payload: { previousInventory, currentInventory, floorplanId },
            };

            const newProjects = state.projects.map(p => {
                if (p.id !== activeProjectId) return p;
                if (floorplanId === 'project-level-inventory') {
                    return { ...p, projectLevelInventory: currentInventory };
                } else {
                    return {
                        ...p,
                        floorplans: p.floorplans.map(f =>
                            f.id === floorplanId ? { ...f, inventory: currentInventory } : f
                        ),
                    };
                }
            });

            return {
                ...state,
                projects: newProjects,
                undoStack: [...state.undoStack, command],
                redoStack: [],
            };
        }
        
        case 'UNDO': {
            // ... undo logic (not shown, but would apply inverse of command)
            return state;
        }

        case 'REDO': {
            // ... redo logic (not shown, but would re-apply command)
            return state;
        }
        
        case 'RESET_STATE':
            // Clear all files from storage
            getAllFileIds().then(ids => ids.forEach(id => deleteFile(id)));
            return initialState;
            
        default:
            return state;
    }
};

// --- CONTEXT & PROVIDER ---
interface AppContextType {
    state: AppState;
    dispatch: Dispatch<Action>;
}

// FIX: Export contexts for use in testing.
export const AppStateContext = createContext<AppState | undefined>(undefined);
export const AppDispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const initializer = (initialState: AppState): AppState => {
        try {
            const savedStateJSON = localStorage.getItem('appState');
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                const migratedProjects = migrateProjectDataToV2(savedState.projects || []);

                return {
                    ...initialState,
                    projects: migratedProjects,
                    activeProjectId: savedState.activeProjectId || null,
                    activeFloorplanId: savedState.activeFloorplanId || null,
                    formConfig: savedState.formConfig || defaultFormConfig,
                    isGridVisible: savedState.isGridVisible || false,
                    visibleLayers: new Set(savedState.visibleLayers || Object.keys(EQUIPMENT_CONFIG)),
                };
            }
        } catch (error) {
            console.error("Failed to load or parse state from localStorage:", error);
            // If parsing fails, clear the corrupted state to prevent crash loops
            localStorage.removeItem('appState');
        }
        return initialState;
    };

    const [state, dispatch] = useReducer(appReducer, initialState, initializer);

    // Effect to manage active floorplan and ensure a valid one is selected if floorplans exist.
    useEffect(() => {
        if (state.activeProjectId) {
            const activeProject = state.projects.find(p => p.id === state.activeProjectId);
            if (activeProject) {
                const hasFloorplans = activeProject.floorplans.length > 0;
                const currentFpId = state.activeFloorplanId;

                // If general notes is active but floorplans exist, switch to the first floorplan.
                if (hasFloorplans && currentFpId === 'project-level-inventory') {
                    dispatch({
                        type: 'SET_ACTIVE_FLOORPLAN',
                        payload: { projectId: activeProject.id, floorplanId: activeProject.floorplans[0].id }
                    });
                }
            }
        }
    }, [state.activeProjectId, state.projects, state.activeFloorplanId, dispatch]);

    // Save to localStorage on state change
    useEffect(() => {
        const stateToSave = {
            projects: state.projects,
            activeProjectId: state.activeProjectId,
            activeFloorplanId: state.activeFloorplanId,
            formConfig: state.formConfig,
            isGridVisible: state.isGridVisible,
            visibleLayers: Array.from(state.visibleLayers), // Convert Set to Array for JSON
        };
        localStorage.setItem('appState', JSON.stringify(stateToSave));
    }, [state]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};

// --- HOOKS ---
export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within a AppProvider');
    }
    return context;
};

export const useAppDispatch = () => {
    const context = useContext(AppDispatchContext);
    if (context === undefined) {
        throw new Error('useAppDispatch must be used within a AppProvider');
    }
    return context;
};