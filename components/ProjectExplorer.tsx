import React, { useState, useRef, ChangeEvent } from 'react';
import { Project, Floorplan } from '../types';
import { FolderPlus, FilePlus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useAppState, useAppDispatch } from '../state/AppContext';
import ConfirmModal from './ConfirmModal';
import { toast } from 'react-hot-toast';
import { saveFile } from '../services/fileStorage';
import AddFloorplanSourceModal from './AddFloorplanSourceModal';

interface ProjectExplorerProps {
    isOpen: boolean;
    onClose: () => void;
    onTakePhotoRequest: () => void;
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ isOpen, onClose, onTakePhotoRequest }) => {
    const { projects, activeProjectId, activeFloorplanId } = useAppState();
    const dispatch = useAppDispatch();
    
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'project' | 'floorplan', id: string, name: string } | null>(null);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    React.useEffect(() => {
        if(activeProjectId && !expandedProjects.has(activeProjectId)){
             toggleProjectExpansion(activeProjectId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProjectId]);

    const handleCreateProject = () => {
        dispatch({ type: 'CREATE_PROJECT_AND_ACTIVATE' });
    };

    const handleAddFloorplanClick = () => {
        if (!activeProjectId) {
            toast.error("Please select a project first.");
            return;
        }
        setIsAddSourceModalOpen(true);
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeProjectId) return;

        // Accept PDFs and common image formats
        const isPdf = file.type.includes('pdf');
        const isImage = file.type.includes('image') || file.type.includes('jpeg') || file.type.includes('png') || file.type.includes('jpg');

        if (!isPdf && !isImage) {
            toast.error("Please select a PDF, JPEG, or PNG file.");
            return;
        }

        const baseName = file.name.replace(/\.(pdf|jpe?g|png)$/i, '');
        const newFloorplan: Floorplan = {
            id: crypto.randomUUID(),
            name: baseName,
            pdfFileName: isPdf ? file.name : undefined,
            imageFileName: isImage ? file.name : undefined,
            inventory: [],
            placedEditIds: [],
        };
        
        try {
            await saveFile(newFloorplan.id, file);
            toast.success("Floorplan saved to database.");
        } catch (err) {
            toast.error("Could not save floorplan file.");
            console.error("Error saving to IndexedDB:", err);
            return;
        }
        
        dispatch({ type: 'ADD_FLOORPLAN', payload: { projectId: activeProjectId, floorplan: newFloorplan } });
        dispatch({ type: 'SET_ACTIVE_FLOORPLAN', payload: { projectId: activeProjectId, floorplanId: newFloorplan.id } });
        onClose(); // Close explorer on mobile after adding a floorplan

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleProjectExpansion = (projectId: string) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    };
    
    const handleRename = (id: string, currentValue: string) => {
        setEditingId(id);
        setEditingValue(currentValue);
    };
    
    const handleDelete = (id: string, type: 'project' | 'floorplan') => {
        let name = '';
        if (type === 'project') {
            name = projects.find(p => p.id === id)?.name || 'this project';
        } else {
            name = projects.flatMap(p => p.floorplans).find(f => f.id === id)?.name || 'this floorplan';
        }
        setDeleteConfirmation({ type, id, name });
    };

    const confirmDelete = () => {
        if (!deleteConfirmation) return;
        const { id, type } = deleteConfirmation;

        if (type === 'project') {
            dispatch({ type: 'DELETE_PROJECT', payload: id });
        } else { // floorplan
            const projectOfFloorplan = projects.find(p => p.floorplans.some(f => f.id === id));
            if (projectOfFloorplan) {
                dispatch({ type: 'DELETE_FLOORPLAN', payload: { projectId: projectOfFloorplan.id, floorplanId: id } });
            }
        }
        setDeleteConfirmation(null);
    };


    const handleEditBlur = () => {
        if (!editingId) return;
        
        const isProject = projects.some(p => p.id === editingId);
        if (isProject) {
            dispatch({ type: 'UPDATE_PROJECT_NAME', payload: { id: editingId, name: editingValue } });
        } else {
            dispatch({ type: 'UPDATE_FLOORPLAN_NAME', payload: { floorplanId: editingId, name: editingValue } });
        }
        setEditingId(null);
    };
    
    const handleSelectFloorplan = (projectId: string, floorplanId: string) => {
        dispatch({ type: 'SET_ACTIVE_FLOORPLAN', payload: { projectId, floorplanId } });
        onClose(); // Close on mobile after selection
    }

    return (
        <>
        <div 
            className={`fixed top-0 left-0 h-screen z-[70] bg-surface flex flex-col border-r border-white/10 shrink-0
                        transform transition-transform duration-300 ease-in-out
                        w-full sm:w-72 pt-16 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="p-3 flex flex-col gap-2 border-b border-white/10 flex-shrink-0">
                <button 
                    onClick={handleCreateProject} 
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-semibold"
                >
                    <FolderPlus size={18} />
                    Add Project
                </button>
                <button 
                    onClick={handleAddFloorplanClick} 
                    disabled={!activeProjectId}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-background text-on-surface rounded-md hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                    title={!activeProjectId ? "Select a project to add a floorplan" : "Add floorplan from PDF"}
                >
                    <FilePlus size={18} />
                    Add Floorplan
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,image/*" className="hidden" />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <h3 className="px-2 py-1 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Projects</h3>
                {projects.map(project => (
                    <div key={project.id}>
                        <div 
                            className={`group flex items-center justify-between rounded p-1.5 cursor-pointer text-sm font-medium ${activeProjectId === project.id ? 'bg-primary-700/50 text-white' : 'text-on-surface hover:bg-white/10'}`}
                            onClick={() => dispatch({ type: 'SET_ACTIVE_PROJECT', payload: project.id })}
                        >
                           <div className="flex items-center gap-1 flex-1 truncate" onDoubleClick={() => handleRename(project.id, project.name)}>
                             <button onClick={(e) => { e.stopPropagation(); toggleProjectExpansion(project.id); }} className="p-0.5 rounded-full hover:bg-white/10">
                                {expandedProjects.has(project.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                             </button>
                             
                             {editingId === project.id ? (
                                <input type="text" value={editingValue} onChange={e => setEditingValue(e.target.value)} onBlur={handleEditBlur} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} autoFocus className="bg-transparent border-b border-blue-400 outline-none w-full ml-1"/>
                             ) : (
                                <span className="truncate ml-1">{project.name}</span>
                             )}
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id, 'project')}} className="p-1 -mr-1 rounded-full text-on-surface-variant/50 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Trash2 size={14}/>
                           </button>
                        </div>

                        {expandedProjects.has(project.id) && (
                            <ul className="pl-5 py-1">
                                {project.floorplans.length === 0 && (
                                    <li>
                                        <div 
                                            className={`flex items-center justify-between rounded p-1.5 pl-2 my-0.5 cursor-pointer text-sm ${activeFloorplanId === 'project-level-inventory' && activeProjectId === project.id ? 'bg-primary-600 text-white' : 'text-on-surface-variant hover:bg-white/10'}`}
                                            onClick={() => handleSelectFloorplan(project.id, 'project-level-inventory')}
                                        >
                                            <span className="truncate">General Notes & Equipment</span>
                                        </div>
                                    </li>
                                )}
                                {project.floorplans.map(floorplan => (
                                    <li key={floorplan.id}>
                                         <div 
                                            className={`group flex items-center justify-between rounded p-1.5 pl-2 my-0.5 cursor-pointer text-sm ${activeFloorplanId === floorplan.id ? 'bg-primary-600 text-white' : 'text-on-surface-variant hover:bg-white/10'}`}
                                            onClick={() => handleSelectFloorplan(project.id, floorplan.id)}
                                            onDoubleClick={() => handleRename(floorplan.id, floorplan.name)}
                                         >
                                            <div className="flex-1 truncate">
                                                {editingId === floorplan.id ? (
                                                    <input type="text" value={editingValue} onChange={e => setEditingValue(e.target.value)} onBlur={handleEditBlur} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} autoFocus className="bg-transparent border-b border-blue-400 outline-none w-full"/>
                                                ) : (
                                                    <span className="truncate">{floorplan.name} ({floorplan.placedEditIds.length})</span>
                                                )}
                                            </div>
                                            <button onClick={(e) => {e.stopPropagation(); handleDelete(floorplan.id, 'floorplan')}} className="p-1 -mr-1 rounded-full text-on-surface-variant/50 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={14}/>
                                            </button>
                                         </div>
                                    </li>
                                ))}
                                {project.floorplans.length === 0 && (
                                    <li className="text-xs text-on-surface-variant/50 text-center py-2">No floorplans</li>
                                )}
                            </ul>
                        )}
                    </div>
                ))}
                 {projects.length === 0 && (
                    <div className="text-center text-on-surface-variant text-sm p-4 mt-4">
                        No projects yet. Click "+ Add Project" to start.
                    </div>
                )}
            </div>
            <div className="p-2 border-t border-white/10 text-center text-xs text-on-surface-variant/50 flex-shrink-0">
                Version 1.3
            </div>
            {deleteConfirmation && (
                <ConfirmModal
                    isOpen={!!deleteConfirmation}
                    title={`Delete ${deleteConfirmation.type}`}
                    message={`Are you sure you want to permanently delete "${deleteConfirmation.name}"? This action cannot be undone.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirmation(null)}
                    confirmText="Confirm Delete"
                    confirmVariant="danger"
                />
            )}
        </div>
        <AddFloorplanSourceModal 
            isOpen={isAddSourceModalOpen}
            onClose={() => setIsAddSourceModalOpen(false)}
            onUploadClick={() => fileInputRef.current?.click()}
            onTakePhotoClick={onTakePhotoRequest}
        />
        {isOpen && <div className="fixed inset-0 bg-black/50 z-60 md:hidden" onClick={onClose}></div>}
        </>
    );
};

export default ProjectExplorer;