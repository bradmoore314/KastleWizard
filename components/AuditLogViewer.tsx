import React from 'react';
import { Project, AuditLogEntry } from '../types';
import { History, User, FileDownIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import saveAs from 'file-saver';
import { sanitizeFilename } from '../utils';

interface AuditLogViewerProps {
    project: Project | null | undefined;
}

const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

const getCoordinateString = (details: Record<string, any> | undefined): string | null => {
    if (!details) return null;
    if (details.coordinates) {
        return `at (${details.coordinates.x}, ${details.coordinates.y})`;
    }
    if (details.from && details.to) {
        return `from (${details.from.x}, ${details.from.y}) to (${details.to.x}, ${details.to.y})`;
    }
    return null;
};

const LogEntry: React.FC<{ entry: AuditLogEntry }> = ({ entry }) => {
    const coordinateString = getCoordinateString(entry.details);

    return (
        <li className="flex items-center gap-4 py-2 px-2 hover:bg-white/5 rounded-md text-sm">
            <span className="w-44 flex-shrink-0 text-on-surface-variant font-mono text-xs">
                {formatTimestamp(entry.timestamp)}
            </span>
            <div className="flex-1 flex items-baseline gap-2 truncate" title={entry.description}>
                <p className="text-on-surface truncate">
                    {entry.description}
                </p>
                {coordinateString && (
                    <p className="text-primary-400 font-mono text-xs flex-shrink-0">{coordinateString}</p>
                )}
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant font-mono text-xs" title={entry.userId}>
                <User className="w-3 h-3" />
                <span>{entry.userId.substring(0, 8)}</span>
            </div>
        </li>
    );
};

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ project }) => {
    if (!project) {
        return (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                Select a project to view its audit log.
            </div>
        );
    }

    const logs = project.auditLog || [];

    const handleExport = () => {
        if (!logs || logs.length === 0) {
            toast.error("No log entries to export.");
            return;
        }
    
        const headers = ['Timestamp', 'Action', 'Description', 'UserID', 'Details'];
        const csvRows = [headers.join(',')];
    
        logs.forEach(entry => {
            const row = [
                `"${entry.timestamp}"`,
                `"${entry.action}"`,
                `"${entry.description}"`,
                `"${entry.userId}"`,
                `"${entry.details ? JSON.stringify(entry.details).replace(/"/g, '""') : ''}"`
            ];
            csvRows.push(row.join(','));
        });
    
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${sanitizeFilename(project.name)}_AuditLog.csv`);
        toast.success("Audit log exported!");
    };

    return (
        <div className="w-full h-full p-4 md:p-8 overflow-y-auto text-on-surface bg-background">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                            <History className="w-8 h-8 text-primary-400" />
                            Project Audit Log
                        </h1>
                        <p className="text-md md:text-lg text-on-surface-variant mt-2">
                            Showing history for: <strong className="text-on-surface">{project.name}</strong>
                        </p>
                    </div>
                    <button onClick={handleExport} disabled={logs.length === 0} className="flex items-center gap-2 px-4 py-2 bg-surface text-on-surface rounded-lg hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed">
                        <FileDownIcon className="w-5 h-5" />
                        Export Log
                    </button>
                </header>

                {logs.length === 0 ? (
                    <div className="text-center py-16 bg-surface rounded-xl border border-white/10">
                        <p className="text-lg text-on-surface-variant">No history recorded for this project yet.</p>
                        <p className="text-sm text-on-surface-variant/70 mt-2">Any changes made will be logged here.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-white/10">
                        {logs.map(entry => (
                            <LogEntry key={entry.id} entry={entry} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default AuditLogViewer;
