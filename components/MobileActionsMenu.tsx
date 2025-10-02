import React from 'react';
import { MoreVerticalIcon, EditorViewIcon, ListViewIcon, SettingsIcon, CheckIcon, ImportIcon, ExportProjectIcon, PackageIcon, DatabaseBackupIcon, DatabaseIcon, GalleryHorizontalIcon, SendIcon, CalculatorIcon, FeedbackIcon, DeleteIcon as ResetIcon } from './Icons';

interface MobileActionsMenuProps {
    isActionsMenuOpen: boolean;
    onToggleMenu: () => void;
    onSetView: (view: 'editor' | 'list' | 'calculators' | 'checklist' | 'gallery') => void;
    isEditorViewDisabled: boolean;
    onToggleAdminMode: () => void;
    isAdminMode: boolean;
    onImportProject: () => void;
    onExportProject: () => void;
    onExportDeliverables: () => void;
    hasActiveProject: boolean;
    onBackupAllData: () => void;
    hasProjects: boolean;
    onRestoreBackup: () => void;
    onConfigureAutoBackup: () => void;
    onDisableAutoBackup: () => void;
    autoBackupStatus: 'unconfigured' | 'configured' | 'error';
    onOpenSettings: () => void;
    onSendToSharePoint: () => void;
    isSharePointConfigured: boolean;
    onOpenFeedback: () => void;
    onResetAppRequest: () => void;
}

const MobileActionsMenu: React.FC<MobileActionsMenuProps> = ({
    isActionsMenuOpen,
    onToggleMenu,
    onSetView,
    isEditorViewDisabled,
    onToggleAdminMode,
    isAdminMode,
    onImportProject,
    onExportProject,
    onExportDeliverables,
    hasActiveProject,
    onBackupAllData,
    hasProjects,
    onRestoreBackup,
    onConfigureAutoBackup,
    onDisableAutoBackup,
    autoBackupStatus,
    onOpenSettings,
    onSendToSharePoint,
    isSharePointConfigured,
    onOpenFeedback,
    onResetAppRequest,
}) => {
    const handleAction = (action: () => void) => {
        action();
        onToggleMenu();
    };

    const handleSetView = (view: 'editor' | 'list' | 'calculators' | 'checklist' | 'gallery') => {
        onSetView(view);
        onToggleMenu();
    };

    return (
        <div className="relative">
            <button onClick={onToggleMenu} className="p-2 rounded-lg hover:bg-white/10">
                <MoreVerticalIcon className="w-5 h-5" />
            </button>
            {isActionsMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-surface rounded-lg shadow-xl border border-white/10 z-[100] py-1">
                    <button onClick={() => handleSetView('editor')} disabled={isEditorViewDisabled} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-on-surface-variant disabled:opacity-50"><EditorViewIcon className="w-5 h-5" /><span>Floor Plans</span></button>
                    <button onClick={() => handleSetView('list')} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-on-surface-variant"><ListViewIcon className="w-5 h-5" /><span>Equipment</span></button>
                    <button onClick={() => handleSetView('calculators')} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-on-surface-variant"><CalculatorIcon className="w-5 h-5" /><span>Calculators</span></button>
                    <button onClick={() => handleSetView('gallery')} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-on-surface-variant"><GalleryHorizontalIcon className="w-5 h-5" /><span>Gallery</span></button>
                    <button onClick={() => handleSetView('checklist')} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-on-surface-variant"><ListViewIcon className="w-5 h-5" /><span>Checklist</span></button>
                    <div className="border-t border-white/10 my-1 mx-2"></div>
                    <button onClick={() => handleAction(onImportProject)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-on-surface-variant" title="Import Project (.floorplan)">
                        <ImportIcon className="w-5 h-5" /> <span>Import Project...</span>
                    </button>
                    <button onClick={() => handleAction(onExportProject)} disabled={!hasActiveProject} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 disabled:opacity-50 text-on-surface-variant" title="Export Project (.floorplan)">
                        <ExportProjectIcon className="w-5 h-5" /> <span>Export Project</span>
                    </button>
                    <button onClick={() => handleAction(onExportDeliverables)} disabled={!hasActiveProject} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 disabled:opacity-50 text-on-surface-variant" title="Export all deliverables for the current project">
                        <PackageIcon className="w-5 h-5" /> <span>Export Deliverables</span>
                    </button>
                    <button onClick={() => handleAction(onSendToSharePoint)} disabled={!hasActiveProject || !isSharePointConfigured} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 disabled:opacity-50 text-sm text-on-surface-variant" title={!isSharePointConfigured ? "Configure SharePoint URL in Settings" : "Send project files to SharePoint"}>
                        <SendIcon className="w-5 h-5" /> <span>Send to SharePoint</span>
                    </button>
                    <div className="border-t border-white/10 my-1 mx-2"></div>
                    <button onClick={() => handleAction(onBackupAllData)} disabled={!hasProjects} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 disabled:opacity-50 text-on-surface-variant" title="Backup all projects to a single file">
                        <DatabaseBackupIcon className="w-5 h-5" /> <span>Backup All Data</span>
                    </button>
                    <button onClick={() => handleAction(onRestoreBackup)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-on-surface-variant" title="Restore all projects from a backup file">
                        <DatabaseIcon className="w-5 h-5" /> <span>Restore from Backup...</span>
                    </button>
                    <div className="border-t border-white/10 my-1 mx-2"></div>
                    {autoBackupStatus === 'configured' ? (
                        <button onClick={() => handleAction(onDisableAutoBackup)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-sm text-red-400" title="Stop automatic backups">
                           <DatabaseBackupIcon className="w-5 h-5" /> <span>Disable Auto-Backup</span>
                       </button>
                    ) : (
                       <button onClick={() => handleAction(onConfigureAutoBackup)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-sm text-on-surface-variant" title="Automatically save backups to a local folder">
                           <DatabaseBackupIcon className="w-5 h-5" /> <span>Configure Auto-Backup...</span>
                       </button>
                    )}
                    <div className="border-t border-white/10 my-1 mx-2"></div>
                    <button onClick={() => handleAction(onOpenFeedback)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-on-surface-variant">
                        <FeedbackIcon className="w-5 h-5" />
                        <span>Submit Feedback</span>
                    </button>
                    <button onClick={() => handleAction(onOpenSettings)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-on-surface-variant">
                        <SettingsIcon className="w-5 h-5" />
                        <span>Settings</span>
                    </button>
                    <button onClick={() => handleAction(onToggleAdminMode)} className={`w-full text-left flex items-center justify-between gap-3 p-3 hover:bg-white/10 ${isAdminMode ? 'text-primary-400' : 'text-on-surface-variant'}`}>
                        <div className="flex items-center gap-3">
                            <SettingsIcon className="w-5 h-5" />
                            <span>Admin Mode</span>
                        </div>
                        {isAdminMode && <CheckIcon className="w-5 h-5" />}
                    </button>
                    {isAdminMode && (
                        <>
                            <div className="border-t border-white/10 my-1 mx-2"></div>
                            <button onClick={() => handleAction(onResetAppRequest)} className="w-full text-left flex items-center gap-3 p-3 hover:bg-red-500/20 text-sm text-red-400">
                                <ResetIcon className="w-5 h-5" /> <span>Reset Application</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileActionsMenu;