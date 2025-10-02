import React from 'react';
import { ChevronDownIcon, FileUpIcon, FileDownIcon, PackageIcon, DatabaseBackupIcon, DatabaseIcon, SettingsIcon, CheckIcon, FileJsonIcon, SendIcon, FeedbackIcon, DeleteIcon as ResetIcon } from './Icons';

interface DesktopActionsMenuProps {
    isActionsMenuOpen: boolean;
    onToggleMenu: () => void;
    onImportProject: () => void;
    onExportProject: () => void;
    onExportDeliverables: () => void;
    onBackupAllData: () => void;
    onRestoreBackup: () => void;
    onConfigureAutoBackup: () => void;
    onDisableAutoBackup: () => void;
    autoBackupStatus: 'unconfigured' | 'configured' | 'error';
    onToggleAdminMode: () => void;
    onExportFormConfig: () => void;
    isAdminMode: boolean;
    hasActiveProject: boolean;
    hasProjects: boolean;
    onOpenSettings: () => void;
    onSendToSharePoint: () => void;
    isSharePointConfigured: boolean;
    onOpenFeedback: () => void;
    onResetAppRequest: () => void;
}

const DesktopActionsMenu: React.FC<DesktopActionsMenuProps> = ({
    isActionsMenuOpen,
    onToggleMenu,
    onImportProject,
    onExportProject,
    onExportDeliverables,
    onBackupAllData,
    onRestoreBackup,
    onConfigureAutoBackup,
    onDisableAutoBackup,
    autoBackupStatus,
    onToggleAdminMode,
    onExportFormConfig,
    isAdminMode,
    hasActiveProject,
    hasProjects,
    onOpenSettings,
    onSendToSharePoint,
    isSharePointConfigured,
    onOpenFeedback,
    onResetAppRequest,
}) => {
    return (
        <div className="relative">
            <button onClick={onToggleMenu} className="flex items-center gap-2 p-2 px-3 bg-surface text-on-surface rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                Menu <ChevronDownIcon className={`w-4 h-4 transition-transform ${isActionsMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isActionsMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-surface rounded-lg shadow-xl border border-white/10 z-[100] py-1">
                    <button onClick={onImportProject} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-sm text-on-surface-variant" title="Import Project (.floorplan)">
                        <FileUpIcon className="w-5 h-5" /> <span>Import Project...</span>
                    </button>
                    <button onClick={onExportProject} disabled={!hasActiveProject} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 disabled:opacity-50 text-sm text-on-surface-variant" title="Export Project (.floorplan)">
                        <FileDownIcon className="w-5 h-5" /> <span>Export Current Project</span>
                    </button>
                    <button onClick={onExportDeliverables} disabled={!hasActiveProject} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 disabled:opacity-50 text-sm text-on-surface-variant" title="Export all deliverables for the current project">
                        <PackageIcon className="w-5 h-5" /> <span>Export Deliverables</span>
                    </button>
                     <button onClick={onSendToSharePoint} disabled={!hasActiveProject || !isSharePointConfigured} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 disabled:opacity-50 text-sm text-on-surface-variant" title={!isSharePointConfigured ? "Configure SharePoint URL in Settings" : "Send project files to SharePoint"}>
                        <SendIcon className="w-5 h-5" /> <span>Send to SharePoint</span>
                    </button>
                    <div className="border-t border-white/10 my-1 mx-2"></div>
                    <button onClick={onBackupAllData} disabled={!hasProjects} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 disabled:opacity-50 text-sm text-on-surface-variant" title="Backup all projects to a single file">
                        <DatabaseBackupIcon className="w-5 h-5" /> <span>Backup All Data</span>
                    </button>
                    <button onClick={onRestoreBackup} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-sm text-on-surface-variant" title="Restore all projects from a backup file">
                        <DatabaseIcon className="w-5 h-5" /> <span>Restore from Backup...</span>
                    </button>
                    <div className="border-t border-white/10 my-1 mx-2"></div>
                    {autoBackupStatus === 'configured' ? (
                        <button onClick={onDisableAutoBackup} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-sm text-red-400" title="Stop automatic backups">
                           <DatabaseBackupIcon className="w-5 h-5" /> <span>Disable Auto-Backup</span>
                       </button>
                    ) : (
                       <button onClick={onConfigureAutoBackup} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-sm text-on-surface-variant" title="Automatically save backups to a local folder">
                           <DatabaseBackupIcon className="w-5 h-5" /> <span>Configure Auto-Backup...</span>
                       </button>
                    )}
                    <div className="border-t border-white/10 my-1 mx-2"></div>
                     <button onClick={onOpenFeedback} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-sm text-on-surface-variant">
                        <FeedbackIcon className="w-5 h-5" />
                        <span>Submit Feedback</span>
                    </button>
                     <button onClick={onOpenSettings} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-sm text-on-surface-variant">
                        <SettingsIcon className="w-5 h-5" />
                        <span>Settings</span>
                    </button>
                    <button onClick={onToggleAdminMode} className={`w-full text-left flex items-center justify-between gap-3 p-3 hover:bg-white/10 text-sm ${isAdminMode ? 'text-primary-400' : 'text-on-surface-variant'}`}>
                        <div className="flex items-center gap-3">
                            <SettingsIcon className="w-5 h-5" />
                            <span>Admin Mode</span>
                        </div>
                        {isAdminMode && <CheckIcon className="w-5 h-5" />}
                    </button>
                    {isAdminMode && (
                        <>
                            <button onClick={onExportFormConfig} className="w-full text-left flex items-center gap-3 p-3 hover:bg-white/10 text-sm text-on-surface-variant" title="Export Form Config">
                                <FileJsonIcon className="w-5 h-5" /> <span>Export Form Config</span>
                            </button>
                             <div className="border-t border-white/10 my-1 mx-2"></div>
                            <button onClick={onResetAppRequest} className="w-full text-left flex items-center gap-3 p-3 hover:bg-red-500/20 text-sm text-red-400">
                                <ResetIcon className="w-5 h-5" /> <span>Reset Application</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default DesktopActionsMenu;