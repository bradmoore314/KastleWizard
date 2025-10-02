import React, { useState, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { CloseIcon } from './Icons';

interface SharePointInstructionsModalProps {
    onClose: () => void;
}

const SharePointInstructionsModal: React.FC<SharePointInstructionsModalProps> = ({ onClose }) => {
    const modalRef = useFocusTrap<HTMLDivElement>(true);
    const titleId = "sp-instructions-title";

    return (
        <div className="fixed inset-0 bg-black/80 z-[130] flex items-center justify-center p-4" onClick={onClose}>
            <div ref={modalRef} onClick={e => e.stopPropagation()} className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 id={titleId} className="text-xl font-bold text-on-surface">Setup SharePoint Flow via Power Automate</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-4 text-on-surface-variant">
                    <p>Follow these steps to create a Power Automate flow that saves exported project files to a SharePoint folder and optionally sends a notification email.</p>
                    
                    <section>
                        <h3 className="font-bold text-lg text-on-surface mt-4 mb-2">How It Works</h3>
                        <p>When you "Send to SharePoint", the app makes two separate uploads to your Power Automate URL:</p>
                        <ol className="list-decimal list-inside ml-4 my-2 space-y-1">
                            <li>First, it sends the <strong>Deliverables Package (.zip)</strong>.</li>
                            <li>Second, it sends the <strong>Project File (.floorplan)</strong>.</li>
                        </ol>
                        <p>Your flow will run twice. The second run (for the project file) contains extra information (the recipient's email and the deliverables filename) needed to send a complete notification email.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-on-surface mt-4 mb-2">Step 1: Create the Flow Trigger</h3>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>In Power Automate, create an <strong>Instant cloud flow</strong>.</li>
                            <li>Select the <strong>"When an HTTP request is received"</strong> trigger.</li>
                            <li>Leave the "Request Body JSON Schema" field empty. When you save, a URL will be generated here.</li>
                        </ol>
                    </section>
                    
                    <section>
                        <h3 className="font-bold text-lg text-on-surface mt-4 mb-2">Step 2: Create the SharePoint File</h3>
                         <ol className="list-decimal list-inside space-y-1">
                            <li>Add a new step: SharePoint <strong>"Create file"</strong>.</li>
                            <li>Configure the fields using expressions from the "Dynamic content" panel:
                                <ul className="list-disc list-inside ml-6 mt-2 space-y-2 bg-background p-3 rounded-md">
                                    <li><strong>Site Address:</strong> Select your target SharePoint site.</li>
                                    <li><strong>Folder Path:</strong> Select your target folder (e.g., `/Shared Documents/Floorplans`).</li>
                                    <li>
                                        <strong>File Name:</strong> Use the expression <code>{"triggerOutputs()['headers']?['X-File-Name']"}</code>
                                    </li>
                                    <li>
                                        <strong>File Content:</strong> Use the expression <code>{"triggerBody()"}</code>
                                    </li>
                                </ul>
                            </li>
                        </ol>
                    </section>

                     <section>
                        <h3 className="font-bold text-lg text-on-surface mt-4 mb-2">Step 3: Check for Email Notification</h3>
                         <ol className="list-decimal list-inside space-y-1">
                            <li>Add a new step: <strong>Condition</strong> control.</li>
                            <li>This will check if it's the second upload (the one that should trigger an email).</li>
                            <li>
                                Set the condition to: <code>{"triggerOutputs()['headers']?['X-Recipient-Email']"}</code>
                            </li>
                            <li>
                                Choose the operator: <code>is not equal to</code>
                            </li>
                            <li>
                                Leave the second value blank. This checks if the `X-Recipient-Email` header exists and is not empty.
                            </li>
                        </ol>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-on-surface mt-4 mb-2">Step 4: Send the Email (in the "If yes" branch)</h3>
                        <ol className="list-decimal list-inside space-y-1">
                             <li>Inside the "If yes" branch of your condition, add an action: <strong>"Send an email (V2)"</strong>.</li>
                            <li>
                                Configure the email fields:
                                <ul className="list-disc list-inside ml-6 mt-2 space-y-2 bg-background p-3 rounded-md">
                                    <li><strong>To:</strong> Use the expression <code>{"triggerOutputs()['headers']?['X-Recipient-Email']"}</code></li>
                                    <li><strong>Subject:</strong> Example: <code>{"Project Files Ready: @{triggerOutputs()['headers']?['X-File-Name']}"}</code></li>
                                    <li>
                                        <strong>Body:</strong> You can use HTML. Here is a template to create links to both files. Replace the bold parts with your SharePoint site details.
                                        <div className="text-xs font-mono bg-black/50 p-2 mt-2 rounded">
                                            {`<p>A new project has been uploaded.</p>
<p><a href="https://<strong>YOUR_TENANT</strong>.sharepoint.com/sites/<strong>YOUR_SITE/YOUR_FOLDER</strong>/@{replace(triggerOutputs()['headers']?['X-File-Name'], ' ', '%20')}">Download Project File (.floorplan)</a></p>
<p><a href="https://<strong>YOUR_TENANT</strong>.sharepoint.com/sites/<strong>YOUR_SITE/YOUR_FOLDER</strong>/@{replace(triggerOutputs()['headers']?['X-Deliverables-File-Name'], ' ', '%20')}">Download Deliverables Package (.zip)</a></p>`}
                                        </div>
                                    </li>
                                </ul>
                            </li>
                        </ol>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg text-on-surface mt-4 mb-2">Step 5: Get the URL</h3>
                        <ol className="list-decimal list-inside space-y-1">
                            <li><strong>Save</strong> your completed flow.</li>
                            <li>Go back to the trigger step (Step 1) and copy the generated "HTTP POST URL".</li>
                            <li>Paste this URL into the settings in the Kastle Wizard app.</li>
                        </ol>
                    </section>
                </main>
                <footer className="p-4 border-t border-white/10 text-right flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Close</button>
                </footer>
            </div>
        </div>
    );
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialUrl: string;
    onSave: (url: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialUrl, onSave }) => {
    const [url, setUrl] = useState(initialUrl);
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    const titleId = "settings-modal-title";

    useEffect(() => {
        setUrl(initialUrl);
    }, [initialUrl, isOpen]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleSave = () => {
        onSave(url);
    };

    if (!isOpen) return null;

    return (
        <>
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
                        <h2 id={titleId} className="text-xl font-bold text-on-surface">Settings</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </header>
                    <div 
                        className="p-6 space-y-6"
                    >
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="sharepoint-url" className="block text-sm font-medium text-on-surface-variant">
                                    SharePoint Webhook URL
                                </label>
                                <div className="flex items-center gap-4">
                                     <a 
                                        href="https://kastle.sharepoint.com/:f:/s/SalesEngineers/El2RlsFG01tNluzYOCq6YgUBt4kbK8tOmwahK08qlKNRVg?e=UpbC6l" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary-400 hover:underline"
                                    >
                                        SharePoint Link
                                    </a>
                                    <button type="button" onClick={() => setIsInstructionsOpen(true)} className="text-xs text-primary-400 hover:underline">
                                        Instructions
                                    </button>
                                </div>
                            </div>
                            <input
                                id="sharepoint-url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://prod.powerautomate.com/..."
                                className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                autoFocus
                            />
                            <p className="text-xs text-on-surface-variant/70 mt-2">
                                This URL triggers a Power Automate flow to send project files to SharePoint.
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
                            className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
            {isInstructionsOpen && <SharePointInstructionsModal onClose={() => setIsInstructionsOpen(false)} />}
        </>
    );
};

export default SettingsModal;