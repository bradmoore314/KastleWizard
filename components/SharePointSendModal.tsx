

import React, { useState, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { CloseIcon } from './Icons';
import { salesEngineerEmails } from '../services/schemaOptions';

interface SharePointSendModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (email: string | null) => void;
    projectName: string;
}

const SharePointSendModal: React.FC<SharePointSendModalProps> = ({ isOpen, onClose, onSend, projectName }) => {
    const [selectedEmail, setSelectedEmail] = useState('');
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    const titleId = "sp-send-modal-title";

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
    
    useEffect(() => {
        if(isOpen) {
            setSelectedEmail('');
        }
    }, [isOpen]);

    const handleSend = () => {
        onSend(selectedEmail || null);
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
                    <h2 id={titleId} className="text-xl font-bold text-on-surface">Send Project to SharePoint</h2>
                     <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div 
                    className="p-6 space-y-6"
                >
                    <p className="text-sm text-on-surface-variant">
                        This will upload the deliverables and project file for <strong className="text-on-surface">{projectName}</strong>.
                    </p>
                    <div>
                        <label htmlFor="recipient-email" className="block text-sm font-medium text-on-surface-variant mb-2">
                           Notify Sales Engineer (Optional)
                        </label>
                         <select
                            id="recipient-email"
                            value={selectedEmail}
                            onChange={e => setSelectedEmail(e.target.value)}
                            className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                         >
                            <option value="">No, just upload file</option>
                            {salesEngineerEmails.map(email => (
                                <option key={email} value={email}>{email}</option>
                            ))}
                         </select>
                        <p className="text-xs text-on-surface-variant/70 mt-2">
                            If selected, an email with a link to the project file will be sent to the engineer.
                        </p>
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
                        className="px-6 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
                        onClick={handleSend}
                    >
                        {selectedEmail ? 'Send & Notify' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePointSendModal;