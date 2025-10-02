import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import saveAs from 'file-saver';
import { GoogleGenAI, Type } from '@google/genai';
import { Toaster, toast } from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { loadPdf, convertImageToPdf } from './services/pdf';
import { AnyEdit, Tool, DeviceEdit, DeviceType, DeviceData, Project, Floorplan, MarkerEdit, EquipmentImage, TextEdit, CameraData, MarkerType, MarkerData, EquipmentType, PartialDeviceData } from './types';
import Toolbar from './components/Toolbar';
import PageThumbnails from './components/PageThumbnails';
import PdfViewer, { PdfViewerHandle } from './components/PdfViewer';
import DeviceForm from './components/DeviceForm';
import MarkerForm from './components/MarkerForm';
import Tooltip from './components/Tooltip';
import Legend from './components/Legend';
import EquipmentList from './components/EquipmentList';
import ImageViewer from './components/ImageViewer';
// FIX: Import CloseIcon, BugIcon, and LightbulbIcon instead of X, Bug, and Lightbulb.
import { EditorViewIcon, ListViewIcon, MenuIcon, SparklesIcon, Logo, GalleryHorizontalIcon, CalculatorIcon, AiSuggestIcon, CloseIcon, BugIcon, LightbulbIcon, ElevatorLetterIcon, AuditLogIcon, BookOpen as DocumentationIcon, AiRenameIcon, VideoGatewayIcon, ConduitIcon } from './components/Icons';
import { sanitizeFilename, loadProjectFromZip, createDefaultDevice, generateProjectDataForAI, createDefaultMarker } from './utils';
import ProjectExplorer from './components/ProjectExplorer';
import AnalysisModal from './components/AnalysisModal';
import AiAssistant from './components/AiAssistant';
import WelcomeScreen from './components/WelcomeScreen';
import AddItemModal from './components/AddItemModal';
import EditControls from './components/EditControls';
import Checklist from './components/Checklist';
import GalleryView from './components/GalleryView';
import { useAppState, useAppDispatch } from './state/AppContext';
import ConfirmModal from './components/ConfirmModal';
import DesktopActionsMenu from './components/DesktopActionsMenu';
import MobileActionsMenu from './components/MobileActionsMenu';
import LayersPanel from './components/LayersPanel';
import { 
    generatePdfBlob,
    generateProjectZipBlob,
    generateDeliverablesZipBlob,
    generateBackupZipBlob 
} from './services/export';
import { saveDirectoryHandle, getDirectoryHandle, clearDirectoryHandle, verifyPermission } from './services/autoBackup';
import { getFile, saveFile, getAllFileIds, deleteFile } from './services/fileStorage';
import SettingsModal from './components/SettingsModal';
import GatewayCalculator from './components/GatewayCalculator';
import ConduitCalculator from './components/ConduitCalculator';
import LaborCalculator from './components/LaborCalculator';
import PartnerBudgetCalculator from './components/PartnerBudgetCalculator';
import TEECalculator from './components/TEECalculator';
import SubcontractorList from './components/SubcontractorList';
import PartnerDirectory from './components/PartnerDirectory';
import WhatsNewModal from './components/WhatsNewModal';
import ElevatorLetterDrafter from './components/ElevatorLetterDrafter';
import DuplicateModal from './components/DuplicateModal';
import CameraCapture from './components/CameraCapture';
import SharePointSendModal from './components/SharePointSendModal';
import { EQUIPMENT_CONFIG } from './services/equipmentConfig';
import AiSuggestModal, { AiSuggestion } from './components/AiSuggestModal';
import DeleteRangeModal from './components/DeleteRangeModal';
// FIX: Changed import of CopyToPagesModal to a named import.
import { CopyToPagesModal } from './components/CopyToPagesModal';
import { useFocusTrap } from './hooks/useFocusTrap';
import AuditLogViewer from './components/AuditLogViewer';
import DocumentationModal from './components/DocumentationModal';
import AiRenameModal, { AiRenameSuggestion } from './components/AiRenameModal';


pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;

const GENERAL_NOTES_ID = 'project-level-inventory';
const DEFAULT_SHAREPOINT_URL = 'https://prod-105.westus.logic.azure.com:443/workflows/2b6ceb55b9c847668e4df2949b57ab09/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-KifdqtI28Zch9FZC_vOu92Xx-fL51iUqmKTFR5PPnk';

type View = 'editor' | 'list' | 'tools' | 'checklist' | 'gallery' | 'audit-log' | 'partner-directory';
type CalculatorType = 'gateway' | 'conduit' | 'labor' | 'partner-budget' | 'tee' | 'subcontractors' | 'elevator-letter';

// Wrapper for new calculators
const CalculatorWrapper: React.FC<{ title: string, onBack: () => void, children: React.ReactNode }> = ({ title, onBack, children }) => (
    <div className="w-full h-full flex flex-col bg-background">
        <header className="p-4 md:p-6 border-b border-white/10 flex-shrink-0 flex justify-between items-center bg-surface">
            <h1 className="text-2xl font-bold">{title}</h1>
            <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
    </div>
);

// Selection screen for calculators
const CalculatorSelectionScreen: React.FC<{ onSelect: (calc: CalculatorType) => void }> = ({ onSelect }) => {
    const calcOptions = [
        { key: 'gateway', title: 'Gateway Calculator', description: 'Plan video storage and throughput for KastleVideo gateways.', Icon: VideoGatewayIcon },
        { key: 'conduit', title: 'Conduit Calculator', description: 'Estimate material and labor costs for conduit runs.', Icon: ConduitIcon },
        { key: 'labor', title: 'Labor Calculator', description: 'Estimate labor hours for various installation tasks.', Icon: AuditLogIcon },
        { key: 'partner-budget', title: 'Partner Budget Calculator', description: 'Calculate partner budgets with T&E for project proposals.', Icon: CalculatorIcon },
        { key: 'tee', title: 'T&E Calculator', description: 'Calculate travel & expense costs for remote jobs.', Icon: CalculatorIcon },
        { key: 'subcontractors', title: 'Subcontractors', description: 'Browse and search approved subcontractor partners.', Icon: AuditLogIcon },
        { key: 'elevator-letter', title: 'Elevator Letter', description: 'Generate professional elevator specification letters.', Icon: ElevatorLetterIcon }
    ];

    return (
        <div className="w-full h-full p-4 md:p-8 flex flex-col items-center justify-center bg-background">
            <div className="max-w-4xl text-center">
                <h1 className="text-4xl font-bold mb-2">Tools</h1>
                <p className="text-lg text-on-surface-variant mb-8">Select a tool to assist with project planning and estimation.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {calcOptions.map(({ key, title, description, Icon }) => (
                        <button key={key} onClick={() => onSelect(key as any)} className="bg-surface p-8 rounded-xl border border-white/10 text-left hover:border-primary-500 hover:bg-primary-950/30 transition-all duration-300 transform hover:-translate-y-1">
                            <Icon className="w-10 h-10 text-primary-400 mb-4" />
                            <h2 className="text-xl font-bold text-on-surface mb-2">{title}</h2>
                            <p className="text-on-surface-variant">{description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


const MobilePageNavigator: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (page: number) => {
        onPageChange(page);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={navRef}>
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-surface border border-white/10 rounded-lg shadow-xl z-10">
                    <ul className="py-1 max-h-72 overflow-y-auto">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                            <li key={pageNumber}>
                                <button
                                    onClick={() => handleSelect(pageNumber)}
                                    className={`w-full text-left px-4 py-2 text-sm ${currentPage === pageNumber ? 'bg-primary-600 text-white font-semibold' : 'text-on-surface-variant hover:bg-white/10'}`}
                                >
                                    Page {pageNumber}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="px-4 py-2 bg-surface/80 backdrop-blur-md rounded-lg border border-white/10 text-on-surface font-semibold text-sm shadow-lg"
            >
                Page {currentPage} / {totalPages}
            </button>
        </div>
    );
};

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const [feedbackType, setFeedbackType] = useState<'bug' | 'feature'>('bug');
    const [description, setDescription] = useState('');
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    const titleId = "feedback-modal-title";

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleSubmit = () => {
        if (!description.trim()) {
            toast.error("Please provide a description.");
            return;
        }

        const subject = feedbackType === 'bug'
            ? '[Bug Report] Kastle Site Wizard Feedback'
            : '[Feature Request] Kastle Site Wizard Feedback';
        
        const body = `Feedback Type: ${feedbackType === 'bug' ? 'Bug Report' : 'Feature Request'}\n\nDescription:\n${description}`;
        
        const mailtoLink = `mailto:bmoore@kastle.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="bg-black/70 z-[120] flex items-center justify-center p-4 fixed inset-0"
            onClick={onClose}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 id={titleId} className="text-xl font-bold text-on-surface">Submit Feedback</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-2">Feedback Type</label>
                        <div className="flex items-center gap-2 bg-background rounded-lg p-1">
                            <button onClick={() => setFeedbackType('bug')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm transition-colors ${feedbackType === 'bug' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}>
                                <BugIcon className="w-4 h-4" />
                                Bug Report
                            </button>
                            <button onClick={() => setFeedbackType('feature')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm transition-colors ${feedbackType === 'feature' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}>
                                <LightbulbIcon className="w-4 h-4" />
                                Feature Request
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="feedback-description" className="block text-sm font-medium text-on-surface-variant mb-2">
                            Description
                        </label>
                        <textarea
                            id="feedback-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            placeholder={feedbackType === 'bug' ? "Please describe the bug, including steps to reproduce it." : "Please describe the feature you'd like to see."}
                            className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                            required
                        />
                    </div>
                </div>
                <div className="bg-background/50 px-6 py-4 flex justify-end gap-4 rounded-b-xl">
                    <button
                        type="button"
                        className="px-4 py-2 rounded-md border border-gray-600 bg-surface text-on-surface hover:bg-white/10"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="px-6 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={!description.trim()}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};


const App = () => {
  const { projects, activeProjectId, activeFloorplanId, undoStack, redoStack } = useAppState();
  const dispatch = useAppDispatch();
  
  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const activeFloorplan = useMemo(() => activeProject?.floorplans.find(f => f.id === activeFloorplanId), [activeProject, activeFloorplanId]);
  
  const editorInventory = useMemo(() => {
      if (!activeProject) return [];
      if (activeFloorplanId === GENERAL_NOTES_ID) {
          return activeProject.projectLevelInventory;
      }
      return activeFloorplan?.inventory || [];
  }, [activeProject, activeFloorplanId, activeFloorplan]);

  const equipmentListInventory = useMemo(() => {
    if (!activeProject) return [];

    const allItemsMap = new Map<string, AnyEdit>();
    
    // Add placed items from all floorplans first. These are the source of truth for placed items.
    activeProject.floorplans.forEach(fp => {
        fp.inventory.forEach(item => allItemsMap.set(item.id, item));
    });

    // Add items from the project-level inventory ONLY if they haven't already been added from a floorplan.
    // This adds the unplaced items.
    activeProject.projectLevelInventory.forEach(item => {
        if (!allItemsMap.has(item.id)) {
            allItemsMap.set(item.id, item);
        }
    });

    return Array.from(allItemsMap.values());
  }, [activeProject]);


  const [activePdfJsDoc, setActivePdfJsDoc] = useState<PDFDocumentProxy | null>(null);
  const [activePageDimensions, setActivePageDimensions] = useState<{ width: number, height: number }[]>([]);
  
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [itemToPlace, setItemToPlace] = useState<DeviceEdit | MarkerEdit | string | null>(null);
  const [itemTypeToPlace, setItemTypeToPlace] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEditIds, setSelectedEditIds] = useState<string[]>([]);
  const [viewport, setViewport] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingDevice, setEditingDevice] = useState<Partial<DeviceEdit> | Partial<DeviceEdit>[] | null>(null);
  const [deletingItems, setDeletingItems] = useState<(DeviceEdit | MarkerEdit)[] | null>(null);
  const [duplicatingDevice, setDuplicatingDevice] = useState<DeviceEdit | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<{ pageIndices: number[]; name: string } | null>(null);
  const [isDeleteRangeModalOpen, setIsDeleteRangeModalOpen] = useState(false);
  const [isCopyToPagesModalOpen, setIsCopyToPagesModalOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<MarkerEdit | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);
  const [tooltipData, setTooltipData] = useState<{ content: any, position: { x: number, y: number } } | null>(null);
  const [view, setView] = useState<View>('editor');
  const [viewingImageId, setViewingImageId] = useState<string | null>(null);
  
  const [isExplorerOpen, setIsExplorerOpen] = useState(window.innerWidth > 768);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType | null>(null);
  
  // AI Suggestion Flow State
  const [aiSuggestionState, setAiSuggestionState] = useState<'idle' | 'configuring' | 'defining_area' | 'loading' | 'reviewing' | 'error'>('idle');
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null);
  const [aiArea, setAiArea] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  const [aiPromptConfig, setAiPromptConfig] = useState<{ prompt: string, selectedEquipment: Set<string> } | null>(null);

  // AI Rename Flow State
  const [aiRenameState, setAiRenameState] = useState<'idle' | 'defining_area' | 'loading' | 'reviewing' | 'error'>('idle');
  const [aiRenames, setAiRenames] = useState<AiRenameSuggestion[] | null>(null);
  const [aiRenameError, setAiRenameError] = useState<string | null>(null);

  const [isSharePointSendModalOpen, setIsSharePointSendModalOpen] = useState(false);
  
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isDocumentationModalOpen, setIsDocumentationModalOpen] = useState(false);
  const [isWhatsNewModalOpen, setIsWhatsNewModalOpen] = useState(false);
  const [sharePointUrl, setSharePointUrl] = useState('');

  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  const [autoBackupHandle, setAutoBackupHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [autoBackupStatus, setAutoBackupStatus] = useState<'unconfigured' | 'configured' | 'error'>('unconfigured');
  const debounceTimerRef = useRef<number | null>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);
  
  const pdfViewerRef = useRef<PdfViewerHandle>(null);
  const desktopActionsMenuRef = useRef<HTMLDivElement>(null);
  const mobileActionsMenuRef = useRef<HTMLDivElement>(null);
  const importProjectInputRef = useRef<HTMLInputElement>(null);
  const restoreBackupInputRef = useRef<HTMLInputElement>(null);
  const prevFloorplanIdRef = useRef(activeFloorplanId);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);


  const hasPdf = !!activeFloorplan?.pdfFileName;
  
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const findEditInProjects = useCallback((id: string): AnyEdit | null => {
    for (const project of projects) {
      const inventories = [project.projectLevelInventory, ...project.floorplans.map(fp => fp.inventory)];
      for (const inv of inventories) {
        const found = inv.find(e => e.id === id);
        if (found) return found;
      }
    }
    return null;
  }, [projects]);


  // Sync editingDevice state with global state to reflect updates like adding images
  useEffect(() => {
    if (!editingDevice) return;
    
    if (Array.isArray(editingDevice)) { // Bulk edit
      const updatedDevices = editingDevice.map(d => {
        if (!d.id) return d;
        return (findEditInProjects(d.id) as DeviceEdit) || d;
      });

      if (JSON.stringify(updatedDevices) !== JSON.stringify(editingDevice)) {
        setEditingDevice(updatedDevices);
      }
    } else { // Single edit
      if (!editingDevice.id) return;
      const updatedDevice = findEditInProjects(editingDevice.id);
      if (updatedDevice && JSON.stringify(updatedDevice) !== JSON.stringify(editingDevice)) {
        setEditingDevice(updatedDevice as DeviceEdit);
      }
    }
  }, [projects, editingDevice, findEditInProjects]);

  // Sync editingMarker state with global state
  useEffect(() => {
    if (!editingMarker?.id) return;
    
    const updatedMarker = findEditInProjects(editingMarker.id);
    if (updatedMarker && JSON.stringify(updatedMarker) !== JSON.stringify(editingMarker)) {
        setEditingMarker(updatedMarker as MarkerEdit);
    }
  }, [projects, editingMarker, findEditInProjects]);

  useEffect(() => {
    const savedUrl = localStorage.getItem('sharePointUrl');
    if (savedUrl !== null) {
        setSharePointUrl(savedUrl);
    } else {
        setSharePointUrl(DEFAULT_SHAREPOINT_URL);
        localStorage.setItem('sharePointUrl', DEFAULT_SHAREPOINT_URL);
    }
  }, []);

  useEffect(() => {
    const loadHandle = async () => {
        if (!window.showDirectoryPicker) {
            console.warn("File System Access API not supported. Auto-backup disabled.");
            return;
        }
        try {
            const handle = await getDirectoryHandle();
            if (handle) {
                if (await verifyPermission(handle)) {
                    setAutoBackupHandle(handle);
                    setAutoBackupStatus('configured');
                    toast.success(`Auto-backup re-enabled for folder: ${handle.name}`);
                } else {
                    setAutoBackupHandle(null);
                    setAutoBackupStatus('error');
                    toast.error("Permission for auto-backup folder was denied. Please reconfigure.");
                    await clearDirectoryHandle();
                }
            }
        } catch (error) {
            console.error("Error loading auto-backup handle:", error);
            setAutoBackupStatus('error');
        }
    };
    loadHandle();
  }, []);

  useEffect(() => {
    if (autoBackupStatus !== 'configured' || !autoBackupHandle || projects.length === 0) {
        return;
    }

    if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
        const backupPromise = async () => {
            const floorplanFileData: Record<string, {name: string, data: ArrayBuffer}> = {};
            const allFloorplanIds = projects.flatMap(p => p.floorplans.map(f => f.id));
            
            for (const id of allFloorplanIds) {
                const floorplan = projects.flatMap(p => p.floorplans).find(f => f.id === id);
                if (floorplan && floorplan.pdfFileName) {
                    const file = await getFile(id);
                    if (file) {
                        const buffer = await file.arrayBuffer();
                        floorplanFileData[id] = { name: file.name, data: buffer };
                    }
                }
            }

            const { blob } = await generateBackupZipBlob(projects, floorplanFileData);
            
            const fileHandle = await autoBackupHandle.getFileHandle('kastle-wizard-autosave.zip', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
        };
        
        toast.promise(
            backupPromise(),
            {
                loading: 'Auto-saving backup...',
                success: <b>Auto-save complete!</b>,
                error: <b>Auto-save failed.</b>,
            }
        );

    }, 3000); // 3 second debounce

    return () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    };
  }, [projects, autoBackupHandle, autoBackupStatus]);

  const handleConfigureAutoBackup = async () => {
    if (!window.showDirectoryPicker) {
        toast.error("Your browser does not support this feature.");
        return;
    }
    try {
        const handle = await window.showDirectoryPicker();
        await saveDirectoryHandle(handle);
        setAutoBackupHandle(handle);
        setAutoBackupStatus('configured');
        toast.success(`Auto-backup configured to folder: ${handle.name}`);
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return; // User cancelled the picker, ignore.
        }
        console.error("Error configuring auto-backup:", error);
        toast.error("Could not configure auto-backup.");
    }
  };
    
  const handleDisableAutoBackup = async () => {
    try {
        await clearDirectoryHandle();
        setAutoBackupHandle(null);
        setAutoBackupStatus('unconfigured');
        toast.success("Auto-backup disabled.");
    } catch (error) {
        console.error("Error disabling auto-backup:", error);
        toast.error("Could not disable auto-backup.");
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;
    
    setIsLoading(true);
    toast.loading('Processing file...', { id: 'file-processing' });

    try {
        let pdfFile = file;
        if (!file.type.includes('pdf')) {
            pdfFile = await convertImageToPdf(file);
        }
        
        const { pageDimensions } = await loadPdf(pdfFile);

        let projectIdToUse = activeProjectId;
        if (!projectIdToUse) {
            // FIX: Add missing properties to align with the Project type.
            const newProject: Project = { id: crypto.randomUUID(), name: pdfFile.name.replace('.pdf', ''), floorplans: [], projectLevelInventory: [], checklistAnswers: {}, auditLog: [], gatewayCalculations: [], conduitCalculations: [], laborCalculations: [] };
            dispatch({ type: 'ADD_PROJECT', payload: newProject });
            projectIdToUse = newProject.id;
        }

        const newFloorplan: Floorplan = {
            id: crypto.randomUUID(),
            name: pdfFile.name.replace('.pdf', ''),
            pdfFileName: pdfFile.name,
            inventory: [],
            placedEditIds: [],
        };

        await saveFile(newFloorplan.id, pdfFile);
        
        dispatch({ type: 'ADD_FLOORPLAN', payload: { projectId: projectIdToUse, floorplan: newFloorplan } });
        dispatch({ type: 'SET_ACTIVE_FLOORPLAN', payload: { projectId: projectIdToUse, floorplanId: newFloorplan.id } });
        
        setActivePageDimensions(pageDimensions);
        setCurrentPage(1);
        toast.success('File loaded successfully!', { id: 'file-processing' });

    } catch (error) {
        console.error("Error processing file:", error);
        toast.error('Failed to process file. Please ensure it is a valid PDF, JPEG, or PNG.', { id: 'file-processing' });
    } finally {
        setIsLoading(false);
    }
  }, [activeProjectId, dispatch]);


  const handleCreateProject = useCallback(() => {
    dispatch({ type: 'CREATE_PROJECT_AND_ACTIVATE' });
  }, [dispatch]);
  
  const handleImportProject = () => {
    importProjectInputRef.current?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Importing project...");
    try {
        // The new loadProjectFromZip determines if it's a backup from content, not filename.
        const { project, projects, isBackup, floorplanFiles } = await loadProjectFromZip(file);
        
        if (isBackup && projects) {
            dispatch({ type: 'RESTORE_BACKUP', payload: { projects, loadedFiles: floorplanFiles } });
        } else if (project) {
            dispatch({ type: 'LOAD_PROJECT', payload: { project, loadedFiles: floorplanFiles } });
        }
        toast.success("Project imported successfully!", { id: toastId });
    } catch (err: any) {
        console.error("Failed to import project:", err);
        toast.error(`Failed to import project. ${err.message || 'The file may be corrupt.'}`, { id: toastId });
    }
    
    if (e.target) e.target.value = ''; // Reset input
  };
  
  const handleExportProject = async () => {
    if (!activeProject) return;

    const toastId = toast.loading('Exporting project...');
    try {
        const floorplanFiles: Record<string, { name: string; data: ArrayBuffer; }> = {};
        for (const fp of activeProject.floorplans) {
            if (fp.pdfFileName) {
                const file = await getFile(fp.id);
                if (file) {
                    floorplanFiles[fp.id] = { name: file.name, data: await file.arrayBuffer() };
                }
            }
        }
        const { blob, filename } = await generateProjectZipBlob(activeProject, floorplanFiles);
        saveAs(blob, filename);
        toast.success('Project exported!', { id: toastId });
    } catch (err) {
        console.error("Export failed:", err);
        toast.error('Export failed.', { id: toastId });
    }
  };

  const handleExportDeliverables = async () => {
    if (!activeProject) return;
    const toastId = toast.loading('Generating deliverables...');
    try {
        const floorplanFiles: Record<string, { name: string; data: ArrayBuffer; }> = {};
        for (const fp of activeProject.floorplans) {
            if (fp.pdfFileName) {
                const file = await getFile(fp.id);
                if (file) {
                    floorplanFiles[fp.id] = { name: file.name, data: await file.arrayBuffer() };
                }
            }
        }
        const { blob, filename } = await generateDeliverablesZipBlob(activeProject, floorplanFiles);
        saveAs(blob, filename);
        toast.success('Deliverables exported!', { id: toastId });
    } catch (err: any) {
        console.error("Deliverables export failed:", err);
        toast.error('Deliverables export failed.', { id: toastId });
    }
  };
  
  const handleBackupAllData = async () => {
    const toastId = toast.loading("Backing up all data...");
    try {
        const floorplanFileData: Record<string, {name: string, data: ArrayBuffer}> = {};
        const allFloorplanIds = projects.flatMap(p => p.floorplans.map(f => f.id));
        
        for (const id of allFloorplanIds) {
            const floorplan = projects.flatMap(p => p.floorplans).find(f => f.id === id);
            if (floorplan && floorplan.pdfFileName) {
                const file = await getFile(id);
                if (file) {
                    const buffer = await file.arrayBuffer();
                    floorplanFileData[id] = { name: file.name, data: buffer };
                }
            }
        }
        const { blob, filename } = await generateBackupZipBlob(projects, floorplanFileData);
        saveAs(blob, filename);
        toast.success("Backup successful!", { id: toastId });
    } catch (err) {
        console.error("Backup failed:", err);
        toast.error("Backup failed.", { id: toastId });
    }
  };
  
  const handleRestoreBackup = () => {
    restoreBackupInputRef.current?.click();
  };

  const handleSendToSharePointRequest = () => {
      if (!sharePointUrl) {
          toast.error("SharePoint URL is not configured. Please add it in Settings.");
          setIsSettingsModalOpen(true);
          return;
      }
      setIsSharePointSendModalOpen(true);
  };

  const handleSendToSharePoint = async (recipientEmail: string | null) => {
    if (!activeProject) return;

    const toastId = toast.loading('Sending to SharePoint...');
    try {
        const floorplanFiles: Record<string, { name: string; data: ArrayBuffer; }> = {};
        for (const fp of activeProject.floorplans) {
            if (fp.pdfFileName) {
                const file = await getFile(fp.id);
                if (file) {
                    floorplanFiles[fp.id] = { name: file.name, data: await file.arrayBuffer() };
                }
            }
        }
        
        const { blob: deliverablesBlob, filename: deliverablesFilename } = await generateDeliverablesZipBlob(activeProject, floorplanFiles);
        const { blob: projectBlob, filename: projectFilename } = await generateProjectZipBlob(activeProject, floorplanFiles);

        const commonHeaders = { 'Content-Type': 'application/octet-stream' };
        
        const deliverablesResponse = await fetch(sharePointUrl, {
            method: 'POST',
            headers: { ...commonHeaders, 'X-File-Name': deliverablesFilename },
            body: deliverablesBlob,
        });

        if (!deliverablesResponse.ok) throw new Error(`SharePoint upload failed for deliverables: ${deliverablesResponse.statusText}`);
        toast.success("Deliverables package sent!", { id: toastId });
        
        const projectFileHeaders = {
            ...commonHeaders,
            'X-File-Name': projectFilename,
            'X-Deliverables-File-Name': deliverablesFilename,
        };
        if (recipientEmail) {
            projectFileHeaders['X-Recipient-Email'] = recipientEmail;
        }

        const projectResponse = await fetch(sharePointUrl, {
            method: 'POST',
            headers: projectFileHeaders,
            body: projectBlob,
        });

        if (!projectResponse.ok) throw new Error(`SharePoint upload failed for project file: ${projectResponse.statusText}`);

        toast.success(recipientEmail ? "Project sent & user notified!" : "Project file sent!", { id: toastId });

    } catch (err: any) {
        console.error("Send to SharePoint failed:", err);
        toast.error(`Send failed: ${err.message}`, { id: toastId });
    }
  };

  const handleSetActiveFloorplan = useCallback((fpId: string) => {
    if (!activeProjectId) return;
    dispatch({ type: 'SET_ACTIVE_FLOORPLAN', payload: { projectId: activeProjectId, floorplanId: fpId }});
  }, [dispatch, activeProjectId]);

  const handleSaveSettings = (url: string) => {
      setSharePointUrl(url);
      localStorage.setItem('sharePointUrl', url);
      toast.success('Settings saved!');
      setIsSettingsModalOpen(false);
  };
  
  const handleResetAppRequest = () => setIsResetConfirmOpen(true);

  const handleResetAppConfirm = async () => {
    setIsResetConfirmOpen(false);
    const toastId = toast.loading("Resetting application...");
    try {
        const allIds = await getAllFileIds();
        await Promise.all(allIds.map(id => deleteFile(id)));
        localStorage.clear();
        await clearDirectoryHandle();
        
        toast.success("Application reset. Reloading...", { id: toastId });
        setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
        console.error("Failed to reset application:", e);
        toast.error("Failed to clear all data.", { id: toastId });
    }
  };

  const handleOpenDeviceForm = useCallback((devices: Partial<DeviceEdit> | Partial<DeviceEdit>[]) => {
    setEditingDevice(devices);
    setIsCreatingDevice(false);
  }, []);

  const handleOpenMarkerForm = useCallback((marker: MarkerEdit) => {
    setEditingMarker(marker);
  }, []);
  
  const handleOpenDeviceFormOnDoubleClick = (device: DeviceEdit) => {
    handleOpenDeviceForm(device);
  };
  
  const handleOpenMarkerFormOnDoubleClick = (marker: MarkerEdit) => {
    handleOpenMarkerForm(marker);
  };

  const handleShowTooltip = (edit: AnyEdit, event: React.MouseEvent) => {
    if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
    }

    let content: Record<string, any>;

    switch (edit.type) {
      case 'device':
        content = { type: edit.deviceType, ...edit.data };
        break;
      case 'marker':
        content = { type: edit.markerType, ...edit.data };
        break;
      case 'text':
        content = { type: 'Text', text: edit.text.length > 50 ? edit.text.substring(0, 47) + '...' : edit.text, fontSize: `${edit.fontSize}pt` };
        break;
      case 'draw':
        content = { type: 'Drawing', color: edit.color, strokeWidth: `${edit.strokeWidth}px` };
        break;
      case 'rectangle':
        content = { type: 'Rectangle', stroke: edit.color, fill: edit.fillColor, strokeWidth: `${edit.strokeWidth}px` };
        break;
      case 'conduit':
        content = { type: 'Conduit', color: edit.color, strokeWidth: `${edit.strokeWidth}px` };
        break;
      default: {
        const _exhaustiveCheck: never = edit;
        content = {};
      }
    }

    setTooltipData({ content, position: { x: event.clientX, y: event.clientY } });

    tooltipTimeoutRef.current = window.setTimeout(() => {
        setTooltipData(null);
        tooltipTimeoutRef.current = null;
    }, 2000); // Hide after 2 seconds
  };
  
  const handleHideTooltip = () => {
    if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
    }
    setTooltipData(null);
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!activeProject) {
        toast.error("No active project to download.");
        return;
    }
    
    const isProjectInventoryView = activeFloorplanId === GENERAL_NOTES_ID;
    const floorplanToExport = isProjectInventoryView
        ? { 
            id: GENERAL_NOTES_ID, 
            name: 'Project Level Inventory', 
            inventory: activeProject.projectLevelInventory, 
            placedEditIds: activeProject.projectLevelInventory.map(i => i.id) 
          }
        : activeFloorplan;

    if (!floorplanToExport) {
        toast.error("No active floorplan to download.");
        return;
    }
    
    setIsSaving(true);
    toast.loading('Generating PDF...', { id: 'pdf-gen' });
    
    try {
        let pdfBuffer: ArrayBuffer | undefined;
        
        if (floorplanToExport.pdfFileName) {
            const file = await getFile(floorplanToExport.id);
            if (file) pdfBuffer = await file.arrayBuffer();
        }
            
        const analysisToInclude = activeProject.analysis_result;

        const blob = await generatePdfBlob(pdfBuffer, activeProject, floorplanToExport as Floorplan, analysisToInclude || null);
        const fileName = sanitizeFilename(`${activeProject.name} - ${floorplanToExport.name}.pdf`);
        saveAs(blob, fileName);
        toast.success('PDF downloaded!', { id: 'pdf-gen' });
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        toast.error('Failed to generate PDF.', { id: 'pdf-gen' });
    } finally {
        setIsSaving(false);
    }
  }, [activeFloorplan, activeProject, activeFloorplanId]);
  
  const handleDeleteSinglePageRequest = (pageIndex: number) => {
    setDeletingTarget({ pageIndices: [pageIndex], name: `Page ${pageIndex + 1}` });
  };

  const handleConfirmDeleteRange = (from: number, to: number) => {
    const pageIndices = Array.from({ length: to - from + 1 }, (_, i) => from + i - 1);
    setDeletingTarget({ pageIndices, name: `Pages ${from} to ${to}` });
    setIsDeleteRangeModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget || !activeProject || !activeFloorplan || !activeFloorplan.pdfFileName) return;

    const { pageIndices, name } = deletingTarget;
    const toastId = toast.loading(`Deleting ${name}...`);

    try {
        const file = await getFile(activeFloorplan.id);
        if (!file) throw new Error("Floorplan PDF not found.");

        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        
        if (pdfDoc.getPageCount() <= pageIndices.length) {
            toast.error("Cannot delete all pages of a document.", { id: toastId });
            setDeletingTarget(null);
            return;
        }

        const sortedIndices = [...pageIndices].sort((a, b) => b - a);
        for (const index of sortedIndices) {
          pdfDoc.removePage(index);
        }

        const pdfBytes = await pdfDoc.save();
        const newPdfFile = new File([pdfBytes], activeFloorplan.pdfFileName, { type: 'application/pdf' });

        await saveFile(activeFloorplan.id, newPdfFile);

        dispatch({ type: 'DELETE_PAGES', payload: { pageIndices } });

        // Manually trigger reload of pdf.js doc and its dimensions
        const loadingTask = pdfjsLib.getDocument(await newPdfFile.arrayBuffer());
        const pdf = await loadingTask.promise;

        const pageDimensionPromises = Array.from({ length: pdf.numPages }, (_, i) => 
            pdf.getPage(i + 1).then(page => {
                const viewport = page.getViewport({ scale: 1 });
                return { width: viewport.width, height: viewport.height };
            })
        );
        const pageDimensions = await Promise.all(pageDimensionPromises);
        
        if (pdf.numPages > 0) {
          setActivePdfJsDoc(pdf);
          setActivePageDimensions(pageDimensions);
  
          // Adjust current page if it was deleted
          if (pageIndices.includes(currentPage - 1)) {
            setCurrentPage(1);
          } else {
            // Adjust current page number if pages before it were deleted
            const pagesDeletedBeforeCurrent = pageIndices.filter(i => i < currentPage - 1).length;
            setCurrentPage(p => p - pagesDeletedBeforeCurrent);
          }
        } else {
          dispatch({ type: 'DELETE_FLOORPLAN', payload: { projectId: activeProject.id, floorplanId: activeFloorplan.id } });
        }

        toast.success('Page(s) deleted successfully!', { id: toastId });

    } catch (err) {
        console.error("Failed to delete page(s):", err);
        toast.error('Failed to delete page(s).', { id: toastId });
    } finally {
        setDeletingTarget(null);
    }
  };

  const unplacedInventory = useMemo(() => {
    if (!activeProject || !activeFloorplan || activeFloorplanId === GENERAL_NOTES_ID) return [];
    
    const placedIds = new Set(activeFloorplan.placedEditIds);
    return activeProject.projectLevelInventory.filter(item => !placedIds.has(item.id));
  }, [activeProject, activeFloorplan, activeFloorplanId]);
  
  
  useEffect(() => {
    const hotkeyListener = (e: KeyboardEvent) => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }
      
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key === 'z') {
        e.preventDefault();
        if(canUndo) dispatch({ type: 'UNDO' });
      } else if (isCtrlOrMeta && e.key === 'y') {
        e.preventDefault();
        if(canRedo) dispatch({ type: 'REDO' });
      } else if (e.key === 'v') {
          setSelectedTool('select');
      } else if (e.key === 'h') {
          setSelectedTool('pan');
      }
    };
    window.addEventListener('keydown', hotkeyListener);
    return () => window.removeEventListener('keydown', hotkeyListener);
  }, [dispatch, canUndo, canRedo]);

  // Auto-switch view when the active floorplan changes to a sensible default.
  // This hook intentionally uses a ref to only trigger view changes when the floorplan ID itself changes,
  // preventing side-effects from other state updates (like project data modifications from other views).
  useEffect(() => {
    if (prevFloorplanIdRef.current === activeFloorplanId) {
      return; // Do nothing if the floorplan hasn't changed.
    }
    prevFloorplanIdRef.current = activeFloorplanId;

    if (!activeFloorplanId) return;

    const hasPdfForActiveFloorplan = projects
        .find(p => p.id === activeProjectId)?.floorplans
        .find(f => f.id === activeFloorplanId)?.pdfFileName;

    if (hasPdfForActiveFloorplan) {
        setView('editor');
    } else if (activeFloorplanId !== GENERAL_NOTES_ID) {
        // For floorplans without a PDF, default to the equipment list view.
        setView('list');
    }
  }, [activeFloorplanId, projects, activeProjectId]);

  // Load PDF data whenever the active floorplan changes
  useEffect(() => {
    let isCancelled = false;

    const loadActivePdf = async () => {
      if (!activeFloorplan || !activeFloorplan.pdfFileName) {
        setActivePdfJsDoc(null);
        setActivePageDimensions([{width: 612, height: 792}]);
        setCurrentPage(1);
        return;
      }
      
      try {
        const file = await getFile(activeFloorplan.id);
        if (!file || isCancelled) return;
        
        const loadingTask = pdfjsLib.getDocument(await file.arrayBuffer());
        const pdf = await loadingTask.promise;
        
        const pageDimensionPromises = Array.from({ length: pdf.numPages }, (_, i) => 
            pdf.getPage(i + 1).then(page => {
                const viewport = page.getViewport({ scale: 1 });
                return { width: viewport.width, height: viewport.height };
            })
        );
        const pageDimensions = await Promise.all(pageDimensionPromises);
        
        if (!isCancelled) {
          setActivePdfJsDoc(pdf);
          setActivePageDimensions(pageDimensions);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Failed to load active PDF:", err);
        toast.error("Could not load floorplan PDF.");
      }
    };
    
    if(activeFloorplanId !== null) {
        loadActivePdf();
    }
    
    return () => { isCancelled = true; };
  }, [activeFloorplan?.id, activeFloorplan?.pdfFileName]);
  
  const handlePlaceItem = (x: number, y: number) => {
    if (!activeProject) return;

    if (itemTypeToPlace) {
        const config = EQUIPMENT_CONFIG[itemTypeToPlace];
        if (!config) return;

        const defaultWidth = 24;
        const defaultHeight = 24;
        const finalX = x - defaultWidth / 2;
        const finalY = y - defaultHeight / 2;
        
        let newItem: DeviceEdit | MarkerEdit;
        const isPlaced = !!(activeFloorplanId && activeFloorplanId !== GENERAL_NOTES_ID);

        if (config.type === 'device') {
            const parts = itemTypeToPlace.split('-');
            const deviceType = parts.length > 2 && parts[0] === 'access' ? 'access-door' : parts[0] as DeviceType;
            
            let dataOverride: PartialDeviceData = {};
            if (deviceType === 'access-door') {
                dataOverride = { interior_perimeter: itemTypeToPlace.includes('interior') ? 'Interior' : 'Perimeter' };
            } else if (deviceType === 'camera') {
                 dataOverride = { environment: itemTypeToPlace.includes('indoor') ? 'Indoor' : 'Outdoor' };
            }
            
            newItem = createDefaultDevice(deviceType, { x: finalX, y: finalY, pageIndex: currentPage - 1, data: dataOverride });
            handleOpenDeviceForm(newItem);
        } else { // marker
            newItem = createDefaultMarker(itemTypeToPlace as MarkerType, { x: finalX, y: finalY, pageIndex: currentPage - 1 });
            handleOpenMarkerForm(newItem);
        }

        dispatch({ type: 'ADD_EDIT', payload: { edit: newItem, isPlaced } });
        setSelectedEditIds([newItem.id]);
        
        setItemTypeToPlace(null);
        setSelectedTool('select');
    } else if (itemToPlace) {
        if (!activeFloorplan || activeFloorplanId === GENERAL_NOTES_ID) return;
        const item = typeof itemToPlace === 'string'
          ? editorInventory.find(i => i.id === itemToPlace) as (DeviceEdit | MarkerEdit)
          : itemToPlace;
        
        if (!item) return;

        dispatch({
            type: 'PLACE_EXISTING_ITEM',
            payload: { item: item, x: x - item.width/2, y: y - item.height/2, pageIndex: currentPage - 1 }
        });
        
        setItemToPlace(null);
        setSelectedTool('select');
    }
  };
  
  const handleSelectDeviceToPlace = (device: DeviceEdit | MarkerEdit) => {
    if (!activeProject) return;

    // If we are currently on a floorplan that has a PDF (but in list view), just switch to editor.
    if (activeFloorplan?.pdfFileName) {
        setSelectedTool('place-item');
        setItemToPlace(device);
        setView('editor');
        return;
    }

    // Otherwise, find a suitable floorplan to navigate to.
    const floorplansWithPdfs = activeProject.floorplans.filter(f => f.pdfFileName);

    if (floorplansWithPdfs.length > 0) {
        // Activate placement mode
        setSelectedTool('place-item');
        setItemToPlace(device);
        
        // Navigate to the first available floorplan with a PDF. If multiple exist, this is a simple default.
        const targetFloorplanId = floorplansWithPdfs[0].id;
        handleSetActiveFloorplan(targetFloorplanId);
        // An existing useEffect hook will switch the view to 'editor' upon this state change.
    } else {
        toast.error("Add a PDF to a floorplan to start placing items.");
    }
  };

  const handleRunAnalysis = async () => {
    if (!activeProject || !import.meta.env.VITE_API_KEY) {
        toast.error("Project or API key is missing.");
        return;
    }
    setIsAnalyzing(true);
    setIsAnalysisModalOpen(true);
    try {
        const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_API_KEY});
        const projectData = generateProjectDataForAI(activeProject);
        const prompt = `Please analyze the following security system project data. Provide a professional, client-facing summary that can be used in a quote. The summary should be well-structured with markdown formatting.
        - Start with an executive summary of the project scope.
        - Detail the number and types of devices being installed or taken over (cameras, access points, etc.).
        - Mention any key features or integrations like elevator access control or intercom systems if present.
        - Highlight potential issues, risks, or items that need for clarification based on the checklist answers. For example, if power/network is not confirmed, state that as an assumption or exclusion.
        - Provide a section with "Key Assumptions & Exclusions" based on the data. For example: "Assumes existing network infrastructure is sufficient," or "Excludes cost of lock hardware provided by 3rd party."
        - Conclude with a brief summary of next steps.
        - Do not mention pricing or costs.
        
        Here is the project data in JSON format:
        ${projectData}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const resultText = response.text;
        setAnalysisResult(resultText);
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { projectId: activeProject.id, result: resultText } });
    } catch (err) {
        console.error("AI Analysis Error:", err);
        toast.error("Failed to run AI analysis.");
        setAnalysisResult("An error occurred during analysis.");
    } finally {
        setIsAnalyzing(false);
    }
  };
  
  const handleAddImages = async (itemId: string, files: FileList, itemType: 'device' | 'marker') => {
      const imagePayloads = Array.from(files).map(file => ({
          metadata: { localId: crypto.randomUUID(), id: 0, createdAt: new Date().toISOString() },
          file
      }));

      const saveToast = toast.loading('Saving images...');
      try {
          await Promise.all(imagePayloads.map(p => saveFile(p.metadata.localId, p.file)));
          
          if (itemType === 'device') {
              dispatch({ type: 'ADD_IMAGES_TO_DEVICE', payload: { deviceId: itemId, images: imagePayloads } });
          } else {
              dispatch({ type: 'ADD_IMAGES_TO_MARKER', payload: { markerId: itemId, images: imagePayloads } });
          }
          toast.success(`${imagePayloads.length} image(s) added!`, { id: saveToast });
      } catch (err) {
          console.error("Failed to save images", err);
          toast.error('Could not save images.', { id: saveToast });
      }
  };

  const handleAddDevice = (deviceType: DeviceType) => {
    const newDevice = createDefaultDevice(deviceType);
    dispatch({ type: 'ADD_EDIT', payload: { edit: newDevice, isPlaced: false } });
    setEditingDevice(newDevice);
  };
  
  const handleAddMarker = (markerType: MarkerType) => {
    const newMarker = createDefaultMarker(markerType);
    dispatch({ type: 'ADD_EDIT', payload: { edit: newMarker, isPlaced: false } });
    setEditingMarker(newMarker);
  };
  
  const handleDuplicateDevice = (device: DeviceEdit) => {
      setDuplicatingDevice(device);
  };
  
  const handleDuplicateMarker = (marker: MarkerEdit) => {
      dispatch({ type: 'DUPLICATE_ITEMS_TO_PROJECT_INVENTORY', payload: { item: marker, count: 1 } });
      toast.success(`Duplicated "${marker.data.label}"`);
  };
  
  const handleConfirmDuplicate = (count: number) => {
      if (!duplicatingDevice) return;
      dispatch({ type: 'DUPLICATE_ITEMS_TO_PROJECT_INVENTORY', payload: { item: duplicatingDevice, count }});
      toast.success(`Created ${count} duplicate(s) of "${(duplicatingDevice.data as any).location}"`);
      setDuplicatingDevice(null);
  };

  const preparedImages = useMemo(() => {
    if (!activeProject) return [];
    
    const allImages: {
        localId: string;
        createdAt: string;
        equipmentId: string;
        equipmentLocation: string;
        equipmentType: EquipmentType;
        floorplanId: string | null;
        floorplanName: string;
    }[] = [];

    const processInventory = (inventory: AnyEdit[], floorplanId: string | null, floorplanName: string) => {
        inventory.forEach(item => {
            if ((item.type === 'device' || item.type === 'marker') && item.data.images) {
                item.data.images.forEach(img => {
                    allImages.push({
                        localId: img.localId,
                        createdAt: img.createdAt,
                        equipmentId: item.id,
                        equipmentLocation: (item.data as any).location || (item.data as any).label,
                        equipmentType: item.type === 'device' ? item.deviceType : item.markerType,
                        floorplanId,
                        floorplanName
                    });
                });
            }
        });
    };
    
    processInventory(activeProject.projectLevelInventory, null, 'Project Level');
    activeProject.floorplans.forEach(fp => {
        processInventory(fp.inventory, fp.id, fp.name);
    });

    return allImages;
  }, [activeProject]);

  const handleSelectItemToPlace = (itemKey: string) => {
      setItemTypeToPlace(itemKey);
      setSelectedTool('place-item');
      setIsAddItemModalOpen(false);
  };

  const handleStartAiAreaDefinition = (config: { prompt: string, selectedEquipment: Set<string> }) => {
    setAiPromptConfig(config);
    setAiSuggestionState('defining_area');
    toast('Please draw a rectangle on the floorplan to define the analysis area.', {
      icon: '✏️',
      duration: 5000,
    });
  };

  const handleAiSuggestAreaDefined = useCallback(async (area: { x: number; y: number; width: number; height: number; }) => {
    if (!aiPromptConfig || !activePdfJsDoc || !import.meta.env.VITE_API_KEY) {
        setAiSuggestionError("Cannot generate suggestions without a floorplan or API key.");
        setAiSuggestionState('error');
        return;
    }
    
    setAiArea(area);
    setAiSuggestionState('loading');
    
    try {
        const page = await activePdfJsDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 }); // High-res for AI
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = viewport.width;
        fullCanvas.height = viewport.height;
        const fullContext = fullCanvas.getContext('2d');
        if (!fullContext) throw new Error("Could not create canvas context");
        
        await page.render({ canvas: fullCanvas, canvasContext: fullContext, viewport }).promise;

        const croppedCanvas = document.createElement('canvas');
        const scale = 1.5;
        croppedCanvas.width = area.width * scale;
        croppedCanvas.height = area.height * scale;
        const croppedContext = croppedCanvas.getContext('2d');
        if (!croppedContext) throw new Error("Could not create cropped canvas context");

        croppedContext.drawImage(
            fullCanvas,
            area.x * scale, area.y * scale, // source position
            area.width * scale, area.height * scale, // source dimensions
            0, 0, // destination position
            croppedCanvas.width, croppedCanvas.height // destination dimensions
        );
        
        const imageDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.8);
        const base64Data = imageDataUrl.split(',')[1];

        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        const deviceTypeEnum = Array.from(aiPromptConfig.selectedEquipment);
        
        const imageWidth = Math.round(croppedCanvas.width);
        const imageHeight = Math.round(croppedCanvas.height);
        
        const placementInstructions = `
You will provide your suggestions as an array of JSON objects. For each suggestion, you MUST provide a 'placementPoint' object containing the exact pixel coordinates (x, y) for the CENTER of the device icon.

CRITICAL PLACEMENT RULES:
1.  The image is ${imageWidth} pixels wide and ${imageHeight} pixels high. The coordinate system's origin (0,0) is at the top-left corner.
2.  For 'access-door' devices (Card Readers), the 'placementPoint' MUST be on the wall, immediately adjacent to the door frame, typically on the side opposite the hinge. DO NOT place it in the middle of the doorway.
3.  For 'camera' devices, the 'placementPoint' MUST be on a wall or ceiling surface that provides the best vantage point for the area described in your 'location' and 'reasoning'.
4.  For cameras, you MUST also provide a 'fieldOfViewRotation' angle in degrees. 0 is right (East), -90 is up (North), 90 is down (South), 180 is left (West). The camera should be aimed logically to cover its target area.
5.  If a camera is outside, you MUST set 'environment' to 'Outdoor'. If a door is on the building's outer wall, you MUST set 'interior_perimeter' to 'Perimeter'.
`;
        const promptWithDimensions = `${aiPromptConfig.prompt}\n${placementInstructions}`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                suggestions: {
                    type: Type.ARRAY,
                    description: 'A list of suggested device placements.',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            deviceType: { type: Type.STRING, description: `The type of device.`, enum: deviceTypeEnum },
                            placementPoint: {
                                type: Type.OBJECT,
                                description: 'The exact pixel coordinates (x, y) for the center of the device icon, relative to the top-left corner (0,0) of the image.',
                                properties: {
                                    x: { type: Type.NUMBER, description: `The X coordinate, from 0 to ${imageWidth - 1}.` },
                                    y: { type: Type.NUMBER, description: `The Y coordinate, from 0 to ${imageHeight - 1}.` },
                                },
                                required: ['x', 'y']
                            },
                            location: { type: Type.STRING, description: 'A brief, descriptive name for this location, e.g., "Main Lobby Entrance".' },
                            reasoning: { type: Type.STRING, description: 'A brief, professional justification for why this placement is recommended.' },
                            fieldOfViewRotation: { type: Type.NUMBER, description: "For cameras, the angle in degrees for the FOV. 0 is right, -90 is up, 90 is down, 180 is left." },
                            data: {
                                type: Type.OBJECT,
                                description: 'Optional data overrides for the device.',
                                properties: {
                                    environment: { type: Type.STRING, enum: ['Indoor', 'Outdoor'], description: 'For cameras, specifies if it is indoor or outdoor.' },
                                    interior_perimeter: { type: Type.STRING, enum: ['Interior', 'Perimeter'], description: 'For access doors, specifies if it is on the building perimeter or interior.' }
                                }
                            }
                        },
                        required: ['deviceType', 'placementPoint', 'location', 'reasoning']
                    }
                }
            },
            required: ['suggestions']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Data } }, { text: promptWithDimensions }] }],
            config: { responseMimeType: 'application/json', responseSchema },
        });

        let result;
        try {
            result = JSON.parse(response.text.trim());
        } catch (parseError) {
             console.error("Failed to parse AI JSON response:", parseError, "Raw response:", response.text);
             throw new Error("The AI returned an unexpected response. Please try again.");
        }

        if (result.suggestions && Array.isArray(result.suggestions)) {
            setAiSuggestions(result.suggestions);
            setAiSuggestionState('reviewing');
        } else {
            throw new Error("Invalid response format from AI. Missing 'suggestions' array.");
        }

    } catch (err: any) {
        console.error("AI Suggestion Error:", err);
        setAiSuggestionError(`Failed to generate suggestions. ${err.message || ''}`);
        setAiSuggestionState('error');
        toast.error("AI suggestion failed.");
    }
  }, [activePdfJsDoc, currentPage, aiPromptConfig]);
  
  const handleAiSuggestions = (suggestions: AiSuggestion[]) => {
    if (!activeProject || !activeFloorplan || !aiArea || activeFloorplanId === GENERAL_NOTES_ID) return;

    const pageIndex = currentPage - 1;
    const scale = 1.5; // The same scale used in handleAiSuggestAreaDefined

    const newDevicesToPlace = suggestions.map(s => {
        if (!s.placementPoint) {
            console.warn('AI suggestion is missing a placementPoint:', s);
            return null; // Skip suggestions without a placement point
        }
        const { x: centerX_pixels, y: centerY_pixels } = s.placementPoint;
        
        // Map absolute pixel coordinates from the SCALED cropped area
        // back to the UN-SCALED PDF coordinate system.
        const x = aiArea.x + (centerX_pixels / scale);
        const y = aiArea.y + (centerY_pixels / scale);
        
        const device = createDefaultDevice(s.deviceType, { 
            data: { 
                location: s.location, 
                notes: `AI Suggestion: ${s.reasoning}`,
                ...s.data,
                fieldOfViewRotation: s.fieldOfViewRotation,
            } 
        });
        
        device.x = x - (device.width / 2); // Center the device icon
        device.y = y - (device.height / 2);
        device.pageIndex = pageIndex;

        return device;
    }).filter((device): device is DeviceEdit => device !== null);

    dispatch({ type: 'ADD_PLACED_EDITS', payload: newDevicesToPlace });
    toast.success(`${newDevicesToPlace.length} AI suggestions placed on your floorplan!`);

    // Reset AI flow state
    setAiSuggestionState('idle');
    setAiArea(null);
    setAiSuggestions(null);
    setAiPromptConfig(null);
  };

  const handleAiRenameAreaDefined = useCallback(async (area: { x: number; y: number; width: number; height: number; }) => {
    if (!activePdfJsDoc || !import.meta.env.VITE_API_KEY) {
        setAiRenameError("Cannot rename equipment without a floorplan or API key.");
        setAiRenameState('error');
        return;
    }

    const itemsInArea = editorInventory.filter(edit => {
        if (edit.type !== 'device' && edit.type !== 'marker') return false;
        const centerX = edit.x + edit.width / 2;
        const centerY = edit.y + edit.height / 2;
        return centerX >= area.x && centerX <= area.x + area.width &&
               centerY >= area.y && centerY <= area.y + area.height;
    }) as (DeviceEdit | MarkerEdit)[];

    if (itemsInArea.length === 0) {
        toast.error("No equipment found in the selected area.");
        setAiRenameState('idle');
        return;
    }

    setAiRenameState('loading');
    
    try {
        const page = await activePdfJsDoc.getPage(currentPage);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = viewport.width;
        fullCanvas.height = viewport.height;
        const fullContext = fullCanvas.getContext('2d');
        if (!fullContext) throw new Error("Could not create canvas context");
        
        await page.render({ canvas: fullCanvas, canvasContext: fullContext, viewport }).promise;

        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = area.width * scale;
        croppedCanvas.height = area.height * scale;
        const croppedContext = croppedCanvas.getContext('2d');
        if (!croppedContext) throw new Error("Could not create cropped canvas context");

        croppedContext.drawImage(
            fullCanvas, area.x * scale, area.y * scale, area.width * scale, area.height * scale,
            0, 0, croppedCanvas.width, croppedCanvas.height
        );
        
        const base64Data = croppedCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        const itemsForPrompt = itemsInArea.map(item => ({
            id: item.id,
            type: item.type === 'device' ? item.deviceType : item.markerType,
            currentName: (item.data as any).location || (item.data as any).label,
            x: Math.round((item.x + item.width / 2 - area.x) * scale),
            y: Math.round((item.y + item.height / 2 - area.y) * scale),
        }));
        
        const imageWidth = Math.round(croppedCanvas.width);
        const imageHeight = Math.round(croppedCanvas.height);
        const prompt = `You are an AI assistant skilled at reading architectural floor plans. Analyze the provided image snippet which is ${imageWidth}px wide and ${imageHeight}px high. The coordinate system's origin (0,0) is the top-left corner of the image.

You will be given a JSON list of existing equipment items located within this image, with their pixel coordinates. Your task is to determine the most accurate location name for each item by reading the text labels (like room names or numbers) closest to its coordinates in the image. For example, if a camera's coordinates fall within an area labeled 'Office 101', its new name should be 'Office 101'.
        
Here is the list of equipment to rename:
${JSON.stringify(itemsForPrompt)}

Respond with a JSON object containing a 'renames' array. Each object in the array should have the 'id' of the equipment and the 'newName' you determined. If you cannot determine a good name, omit the item from your response. Do not include items if the new name is the same as the current name. Your response MUST be only the JSON object.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                renames: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            newName: { type: Type.STRING },
                        },
                        required: ['id', 'newName'],
                    },
                },
            },
        };

        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Data } }, { text: prompt }] }],
            config: { responseMimeType: 'application/json', responseSchema },
        });
        
        const result = JSON.parse(response.text.trim());

        if (result.renames && Array.isArray(result.renames)) {
            const renamesWithOldNames: AiRenameSuggestion[] = result.renames.map((rename: { id: string, newName: string }) => {
                const originalItem = itemsInArea.find(i => i.id === rename.id);
                const oldName = (originalItem?.data as any)?.location || (originalItem?.data as any)?.label || 'Unknown';
                return {
                    ...rename,
                    oldName,
                    type: originalItem!.type,
                    deviceType: originalItem!.type === 'device' ? (originalItem as DeviceEdit).deviceType : undefined,
                    markerType: originalItem!.type === 'marker' ? (originalItem as MarkerEdit).markerType : undefined,
                };
            }).filter((r: AiRenameSuggestion) => r.oldName !== r.newName);

            if (renamesWithOldNames.length === 0) {
                toast.success("AI didn't find any names to improve.");
                setAiRenameState('idle');
            } else {
                setAiRenames(renamesWithOldNames);
                setAiRenameState('reviewing');
            }
        } else {
            throw new Error("Invalid response format from AI.");
        }
    } catch (err: any) {
        console.error("AI Rename Error:", err);
        setAiRenameError(`Failed to generate names. ${err.message || ''}`);
        setAiRenameState('error');
    }
  }, [activePdfJsDoc, currentPage, editorInventory]);

  const handleAiAreaDefined = useCallback((area: { x: number, y: number, width: number, height: number }) => {
    if (aiSuggestionState === 'defining_area') {
      handleAiSuggestAreaDefined(area);
    } else if (aiRenameState === 'defining_area') {
      handleAiRenameAreaDefined(area);
    }
  }, [aiSuggestionState, aiRenameState, handleAiSuggestAreaDefined, handleAiRenameAreaDefined]);

  const handleAcceptRenames = (acceptedRenames: { id: string, newName: string }[]) => {
    const ids = new Set(acceptedRenames.map(r => r.id));
    const editsToUpdate = editorInventory.filter(e => ids.has(e.id)) as (DeviceEdit | MarkerEdit)[];

    const previousEdits = JSON.parse(JSON.stringify(editsToUpdate));
    // FIX: Re-structured the mapping to use explicit type guards, ensuring TypeScript correctly
    // preserves the discriminated union type of `AnyEdit` and resolves the type error.
    const currentEdits = editsToUpdate.map((edit): DeviceEdit | MarkerEdit => {
        const newName = acceptedRenames.find(r => r.id === edit.id)!.newName;
        if (edit.type === 'device') {
            return {
                ...edit,
                data: { ...edit.data, location: newName },
            };
        } else { // edit.type is 'marker'
            return {
                ...edit,
                data: { ...edit.data, label: newName },
            };
        }
    });

    if (previousEdits.length > 0) {
        dispatch({ type: 'UPDATE_EDITS_COMMAND', payload: { previous: previousEdits, current: currentEdits } });
    }

    toast.success(`${acceptedRenames.length} item(s) renamed.`);
    setAiRenameState('idle');
    setAiRenames(null);
  };

  const handleCopyToPages = (pageIndices: number[]) => {
    dispatch({
        type: 'COPY_EDITS_TO_PAGES',
        payload: {
            editIds: selectedEditIds,
            targetPageIndices: pageIndices,
        }
    });
    toast.success(`Copied ${selectedEditIds.length} item(s) to ${pageIndices.length} page(s).`);
    setIsCopyToPagesModalOpen(false);
  };

    const handleMoveItems = (editIds: string[], targetFloorplanId: string) => {
        dispatch({ type: 'MOVE_EDITS_TO_FLOORPLAN', payload: { editIds, targetFloorplanId } });
        toast.success(`${editIds.length} item(s) moved.`);
    };

  const isEditorViewDisabled = !activeFloorplan || !activeFloorplan.pdfFileName;

    // FIX: Add a handler for updating edits and pass it to the PdfViewer.
    const handleUpdateEdits = useCallback((previous: AnyEdit[], current: AnyEdit[]) => {
        dispatch({ type: 'UPDATE_EDITS_COMMAND', payload: { previous, current } });
    }, [dispatch]);

  if (!activeProject) {
    return (
        <div className="w-screen h-screen bg-background text-on-surface">
            <input type="file" ref={importProjectInputRef} onChange={handleImportFileChange} accept=".floorplan,.zip" className="hidden" />
            <WelcomeScreen onCreateProject={handleCreateProject} onImportProject={handleImportProject} />
        </div>
    );
  }

  return (
    <>
      <Toaster toastOptions={{
          className: 'bg-surface text-on-surface border border-white/10',
      }} />
      <div className="w-screen h-screen bg-background text-on-surface flex flex-col md:flex-row">
        
        <input type="file" ref={importProjectInputRef} onChange={handleImportFileChange} accept=".floorplan,.zip" className="hidden" />
        <input type="file" ref={restoreBackupInputRef} onChange={handleImportFileChange} accept=".zip" className="hidden" />
        
        <ProjectExplorer 
            isOpen={isExplorerOpen} 
            onClose={() => setIsExplorerOpen(false)}
            onTakePhotoRequest={() => setIsCameraCaptureOpen(true)}
        />
        
        <main className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${isExplorerOpen ? 'md:ml-72' : 'ml-0'}`}>
          <header className="flex-shrink-0 p-3 bg-surface border-b border-white/10 flex items-center z-50">
            <div className="flex items-center gap-3 min-w-0 flex-shrink">
                <button onClick={() => setIsExplorerOpen(p => !p)} className="p-2 rounded-lg hover:bg-white/10">
                    <MenuIcon className="w-5 h-5" />
                </button>
                <div className="hidden sm:flex items-center gap-3 min-w-0">
                  <Logo className="h-8 w-8 flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="font-bold text-lg leading-tight truncate">{activeProject.name}</h1>
                    <p className="text-sm text-on-surface-variant leading-tight truncate">{activeFloorplan?.name}</p>
                  </div>
                </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4 px-2 sm:px-4 overflow-x-auto">
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <button onClick={() => setView('editor')} disabled={isEditorViewDisabled} className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${view === 'editor' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'} disabled:opacity-50 min-h-[36px]`} title="Floor Plans">
                  <span className="hidden sm:inline">Floor Plans</span>
                  <span className="sm:hidden">Plans</span>
                </button>
                <button onClick={() => setView('list')} className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${view === 'list' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'} min-h-[36px]`} title="Equipment">
                  <span className="hidden sm:inline">Equipment</span>
                  <span className="sm:hidden">Equip</span>
                </button>
                <button onClick={() => { setView('tools'); setActiveCalculator(null); }} className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${view === 'tools' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'} min-h-[36px]`} title="Tools & Calculators">
                  <span className="hidden sm:inline">Tools</span>
                  <span className="sm:hidden">Tools</span>
                </button>
                <button onClick={() => setView('gallery')} className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${view === 'gallery' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'} min-h-[36px]`} title="Gallery">
                  <span className="hidden sm:inline">Gallery</span>
                  <span className="sm:hidden">Gallery</span>
                </button>
                <button onClick={() => setView('checklist')} className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${view === 'checklist' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'} min-h-[36px]`} title="Checklist">
                  <span className="hidden sm:inline">Checklist</span>
                  <span className="sm:hidden">Check</span>
                </button>
                <button onClick={() => setView('audit-log')} className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${view === 'audit-log' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'} min-h-[36px]`} title="Audit Log">
                  <span className="hidden sm:inline">Audit Log</span>
                  <span className="sm:hidden">Audit</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => setIsWhatsNewModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
                    title="What's New in v1.30"
                >
                    ✨ v1.30
                </button>
                <button
                    onClick={() => setIsDocumentationModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold"
                    title="Open Documentation"
                >
                    <DocumentationIcon className="w-4 h-4"/>
                    <span>Help & Docs</span>
                </button>
                <button 
                    onClick={() => setAiSuggestionState('configuring')}
                    className="p-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                    title="AI Layout Suggestions"
                    disabled={!hasPdf || activeFloorplanId === GENERAL_NOTES_ID}
                >
                    <AiSuggestIcon className="w-5 h-5"/>
                </button>
                <button 
                    onClick={() => {
                        setAiRenameState('defining_area');
                        toast('Please draw a rectangle on the floorplan to select equipment to rename.', {
                          icon: '✏️',
                          duration: 5000,
                        });
                    }}
                    className="p-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                    title="AI Rename Equipment"
                    disabled={!hasPdf || activeFloorplanId === GENERAL_NOTES_ID}
                >
                    <AiRenameIcon className="w-5 h-5"/>
                </button>
                <button onClick={() => setIsAssistantOpen(true)} className="p-2 rounded-lg bg-primary-700 hover:bg-primary-600 text-white" title="AI Assistant">
                    <SparklesIcon className="w-5 h-5"/>
                </button>
                <div className="hidden md:block" ref={desktopActionsMenuRef}>
                    <DesktopActionsMenu 
                        isActionsMenuOpen={isActionsMenuOpen}
                        onToggleMenu={() => setIsActionsMenuOpen(p => !p)}
                        onImportProject={handleImportProject}
                        onExportProject={handleExportProject}
                        onExportDeliverables={handleExportDeliverables}
                        hasActiveProject={!!activeProject}
                        onBackupAllData={handleBackupAllData}
                        hasProjects={projects.length > 0}
                        onRestoreBackup={handleRestoreBackup}
                        onConfigureAutoBackup={handleConfigureAutoBackup}
                        onDisableAutoBackup={handleDisableAutoBackup}
                        autoBackupStatus={autoBackupStatus}
                        onToggleAdminMode={() => setIsAdminMode(p => !p)}
                        isAdminMode={isAdminMode}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                        onExportFormConfig={()=>{}} // Placeholder
                        onSendToSharePoint={handleSendToSharePointRequest}
                        isSharePointConfigured={!!sharePointUrl}
                        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                        onResetAppRequest={handleResetAppRequest}
                    />
                </div>
                <div className="md:hidden" ref={mobileActionsMenuRef}>
                    <MobileActionsMenu
                        isActionsMenuOpen={isActionsMenuOpen}
                        onToggleMenu={() => setIsActionsMenuOpen(p => !p)}
                        onSetView={setView}
                        isEditorViewDisabled={isEditorViewDisabled}
                        onToggleAdminMode={() => setIsAdminMode(p => !p)}
                        isAdminMode={isAdminMode}
                        onImportProject={handleImportProject}
                        onExportProject={handleExportProject}
                        onExportDeliverables={handleExportDeliverables}
                        hasActiveProject={!!activeProject}
                        onBackupAllData={handleBackupAllData}
                        hasProjects={projects.length > 0}
                        onRestoreBackup={handleRestoreBackup}
                        onConfigureAutoBackup={handleConfigureAutoBackup}
                        onDisableAutoBackup={handleDisableAutoBackup}
                        autoBackupStatus={autoBackupStatus}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                        onSendToSharePoint={handleSendToSharePointRequest}
                        isSharePointConfigured={!!sharePointUrl}
                        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                        onResetAppRequest={handleResetAppRequest}
                    />
                </div>
            </div>
          </header>
          
          <div className="flex-1 min-h-0 relative">
            {view === 'editor' ? (
                isEditorViewDisabled ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <h2 className="text-xl font-semibold mb-2">No PDF for this floorplan</h2>
                    <p className="text-on-surface-variant text-center">Add devices in the Equipment view, or add a PDF to this floorplan.</p>
                  </div>
                ) : (
                <div className="w-full h-full flex">
                    <div className="hidden md:block">
                        <PageThumbnails 
                          pdfDoc={null} 
                          pdfJsDoc={activePdfJsDoc} 
                          currentPage={currentPage} 
                          setCurrentPage={setCurrentPage} 
                          onDeletePage={handleDeleteSinglePageRequest} 
                          onDeletePageRangeRequest={() => setIsDeleteRangeModalOpen(true)}
                        />
                    </div>
                    <div className="flex-1 relative">
                        <PdfViewer
                            ref={pdfViewerRef}
                            pdfJsDoc={activePdfJsDoc}
                            currentPage={currentPage}
                            edits={editorInventory}
                            updateEdits={handleUpdateEdits}
                            addPlacedEdit={(edit) => dispatch({ type: 'ADD_EDIT', payload: { edit, isPlaced: true } })}
                            selectedTool={selectedTool}
                            setSelectedTool={setSelectedTool}
                            selectedEditIds={selectedEditIds}
                            setSelectedEditIds={setSelectedEditIds}
                            pageDimensions={activePageDimensions}
                            onShowTooltip={handleShowTooltip}
                            onHideTooltip={handleHideTooltip}
                            onPlaceItem={handlePlaceItem}
                            onOpenDeviceFormOnDoubleClick={handleOpenDeviceFormOnDoubleClick}
                            onOpenMarkerFormOnDoubleClick={handleOpenMarkerFormOnDoubleClick}
                            startEditingTextId={editingTextId}
                            onStartEditingText={setEditingTextId}
                            onEndEditingText={() => setEditingTextId(null)}
                            onViewportChange={setViewport}
                            isDefiningAiArea={aiSuggestionState === 'defining_area' || aiRenameState === 'defining_area'}
                            onAiAreaDefined={handleAiAreaDefined}
                        />
                         <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                            <Legend edits={editorInventory} currentPage={currentPage} />
                            <LayersPanel />
                        </div>
                        <div className="md:hidden fixed bottom-20 left-4 z-40">
                             {activePdfJsDoc && <MobilePageNavigator currentPage={currentPage} totalPages={activePdfJsDoc.numPages} onPageChange={setCurrentPage} />}
                        </div>
                    </div>
                </div>
            )) : view === 'list' ? (
                <EquipmentList
                    inventory={equipmentListInventory}
                    viewContext={activeFloorplanId === GENERAL_NOTES_ID ? 'project' : 'floorplan'}
                    onAddDevice={handleAddDevice}
                    onAddMarker={handleAddMarker}
                    onEditDevices={handleOpenDeviceForm}
                    onEditMarker={handleOpenMarkerForm}
                    onPlaceDevice={handleSelectDeviceToPlace}
                    onPlaceMarker={handleSelectDeviceToPlace}
                    onDeleteItems={items => setDeletingItems(items)}
                    onDuplicateDevice={handleDuplicateDevice}
                    onDuplicateMarker={handleDuplicateMarker}
                    onViewImage={setViewingImageId}
                    onMoveItems={handleMoveItems}
                />
            ) : view === 'tools' ? (
                activeCalculator === 'gateway' ? (
                    <GatewayCalculator project={activeProject} onFinish={() => setActiveCalculator(null)} />
                ) : activeCalculator === 'conduit' ? (
                    <CalculatorWrapper title="Conduit Cost Estimator" onBack={() => setActiveCalculator(null)}>
                        <ConduitCalculator />
                    </CalculatorWrapper>
                ) : activeCalculator === 'labor' ? (
                    <CalculatorWrapper title="Labor Hour Estimator" onBack={() => setActiveCalculator(null)}>
                        <LaborCalculator />
                    </CalculatorWrapper>
                ) : activeCalculator === 'partner-budget' ? (
                    <PartnerBudgetCalculator project={activeProject} onFinish={() => setActiveCalculator(null)} />
                ) : activeCalculator === 'tee' ? (
                    <TEECalculator project={activeProject} onFinish={() => setActiveCalculator(null)} />
                ) : activeCalculator === 'subcontractors' ? (
                    <SubcontractorList onFinish={() => setActiveCalculator(null)} />
                ) : activeCalculator === 'elevator-letter' ? (
                    <ElevatorLetterDrafter project={activeProject} onFinish={() => setActiveCalculator(null)} />
                ) : (
                    <CalculatorSelectionScreen onSelect={(calc) => setActiveCalculator(calc)} />
                )
            ) : view === 'partner-directory' ? (
                <PartnerDirectory onFinish={() => setView('list')} />
            ) : view === 'gallery' ? (
                <GalleryView
                    images={preparedImages}
                    floorplans={activeProject?.floorplans || []}
                    onViewImage={setViewingImageId}
                    projectName={activeProject.name}
                />
            ) : view === 'checklist' ? (
                <Checklist project={activeProject} onRunAnalysis={handleRunAnalysis} isAnalyzing={isAnalyzing} />
            ) : view === 'audit-log' ? (
                <AuditLogViewer project={activeProject} />
            ) : view === 'subcontractors' ? (
                <SubcontractorList onFinish={() => setView('list')} />
            ) : null}
          </div>
        </main>
      </div>

      {view === 'editor' && !isEditorViewDisabled && (
        <Toolbar
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          onAddItem={() => setIsAddItemModalOpen(true)}
          onDownload={handleDownloadPdf}
          onZoomIn={() => pdfViewerRef.current?.zoomIn()}
          onZoomOut={() => pdfViewerRef.current?.zoomOut()}
          zoomLevel={viewport.zoom}
          isProcessing={isSaving}
          canUndo={canUndo}
          onUndo={() => dispatch({ type: 'UNDO' })}
          canRedo={canRedo}
          onRedo={() => dispatch({ type: 'REDO' })}
          selectedEditIds={selectedEditIds}
          onBringToFront={() => dispatch({ type: 'BRING_TO_FRONT', payload: selectedEditIds })}
          onSendToBack={() => dispatch({ type: 'SEND_TO_BACK', payload: selectedEditIds })}
          unplacedDevices={unplacedInventory.filter(i => i.type === 'device') as DeviceEdit[]}
          onSelectDeviceToPlace={handleSelectDeviceToPlace}
          activeFloorplanId={activeFloorplanId || ''}
        />
      )}
      
      {selectedEditIds.length > 0 && view === 'editor' && (
        <EditControls 
            selectedIds={selectedEditIds}
            onOpenDeviceForm={handleOpenDeviceForm}
            onOpenMarkerForm={handleOpenMarkerForm}
            onEditTextRequest={setEditingTextId}
            totalPages={activePdfJsDoc?.numPages || 0}
            onCopyToPagesRequest={() => setIsCopyToPagesModalOpen(true)}
        />
      )}

      {editingDevice && <DeviceForm devices={editingDevice} onClose={() => setEditingDevice(null)} isCreating={isCreatingDevice} onImagesAdded={(id, files) => handleAddImages(id, files, 'device')} onViewImage={setViewingImageId} isAdminMode={isAdminMode} />}
      {editingMarker && <MarkerForm marker={editingMarker} onSave={(id, data) => dispatch({type: 'UPDATE_MARKER_DATA', payload: {id, data}})} onClose={() => setEditingMarker(null)} onImagesAdded={(id, files) => handleAddImages(id, files, 'marker')} onViewImage={setViewingImageId} />}
      {deletingItems && (
        <ConfirmModal
          isOpen={!!deletingItems}
          title={`Delete ${deletingItems.length} Item(s)`}
          message={`Are you sure you want to permanently delete these items? This action cannot be undone.`}
          onConfirm={() => {
            dispatch({ type: 'DELETE_EDITS', payload: deletingItems.map(item => item.id) });
            setDeletingItems(null);
          }}
          onCancel={() => setDeletingItems(null)}
          confirmText="Delete"
        />
      )}
       {duplicatingDevice && (
        <DuplicateModal
            isOpen={!!duplicatingDevice}
            onClose={() => setDuplicatingDevice(null)}
            onConfirm={handleConfirmDuplicate}
            deviceName={(duplicatingDevice.data as any).location}
        />
      )}
      {deletingTarget && (
        <ConfirmModal
          isOpen={!!deletingTarget}
          title={`Delete ${deletingTarget.name}`}
          message={`Are you sure you want to permanently delete ${deletingTarget.name}? All associated annotations will be removed. This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTarget(null)}
          confirmText="Delete"
        />
      )}
      {isDeleteRangeModalOpen && activePdfJsDoc && (
        <DeleteRangeModal 
          isOpen={isDeleteRangeModalOpen}
          onClose={() => setIsDeleteRangeModalOpen(false)}
          onConfirm={handleConfirmDeleteRange}
          totalPages={activePdfJsDoc.numPages}
        />
      )}
      {isCopyToPagesModalOpen && activePdfJsDoc && (
        <CopyToPagesModal
          isOpen={isCopyToPagesModalOpen}
          onClose={() => setIsCopyToPagesModalOpen(false)}
          onConfirm={handleCopyToPages}
          totalPages={activePdfJsDoc.numPages}
          currentPage={currentPage}
        />
      )}
      {tooltipData && <Tooltip content={tooltipData.content} position={tooltipData.position} />}
      {viewingImageId && <ImageViewer imageLocalId={viewingImageId} onClose={() => setViewingImageId(null)} />}
      
      {isAnalysisModalOpen && <AnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} analysisResult={analysisResult} isLoading={isAnalyzing} />}
      {isAssistantOpen && <AiAssistant onClose={() => setIsAssistantOpen(false)} onAddDevice={(deviceInfo) => { dispatch({ type: 'ADD_EDIT', payload: { edit: createDefaultDevice(deviceInfo.deviceType, {data: deviceInfo.data}), isPlaced: false } }); toast.success(`${deviceInfo.data.location} added to inventory.`); }} activeProjectName={activeProject.name} />}
      {aiSuggestionState !== 'idle' && aiSuggestionState !== 'defining_area' && (
        <AiSuggestModal
          state={aiSuggestionState as 'configuring' | 'loading' | 'reviewing' | 'error'}
          suggestions={aiSuggestions}
          error={aiSuggestionError}
          onClose={() => setAiSuggestionState('idle')}
          onGenerateRequest={handleStartAiAreaDefinition}
          onAccept={handleAiSuggestions}
          pdfJsDoc={activePdfJsDoc}
          currentPage={currentPage}
        />
      )}
      {aiRenameState !== 'idle' && aiRenameState !== 'defining_area' && (
          <AiRenameModal
              state={aiRenameState as 'loading' | 'reviewing' | 'error'}
              renames={aiRenames}
              error={aiRenameError}
              onClose={() => setAiRenameState('idle')}
              onAccept={handleAcceptRenames}
          />
      )}
      
      {isAddItemModalOpen && <AddItemModal onClose={() => setIsAddItemModalOpen(false)} onSelectItem={handleSelectItemToPlace} />}
      {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} initialUrl={sharePointUrl} onSave={handleSaveSettings} />}
      {isSharePointSendModalOpen && <SharePointSendModal isOpen={isSharePointSendModalOpen} onClose={() => setIsSharePointSendModalOpen(false)} onSend={handleSendToSharePoint} projectName={activeProject.name} />}
      {isCameraCaptureOpen && <CameraCapture isOpen={isCameraCaptureOpen} onClose={() => setIsCameraCaptureOpen(false)} onPhotosTaken={(files) => handleFileSelect(files[0])} />}
      {isFeedbackModalOpen && <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />}
      {isResetConfirmOpen && (
        <ConfirmModal
            isOpen={isResetConfirmOpen}
            title="Reset Application"
            message="Are you sure? This will permanently delete all projects, floorplans, and images. This action cannot be undone."
            onConfirm={handleResetAppConfirm}
            onCancel={() => setIsResetConfirmOpen(false)}
            confirmText="Yes, delete everything"
            confirmVariant="danger"
        />
      )}
       {isDocumentationModalOpen && <DocumentationModal isOpen={isDocumentationModalOpen} onClose={() => setIsDocumentationModalOpen(false)} />}
      {isWhatsNewModalOpen && <WhatsNewModal isOpen={isWhatsNewModalOpen} onClose={() => setIsWhatsNewModalOpen(false)} />}
    </>
  );
};

export default App;