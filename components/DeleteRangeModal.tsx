
import React, { useState, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { AlertTriangle } from 'lucide-react';

interface DeleteRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (from: number, to: number) => void;
    totalPages: number;
}

const DeleteRangeModal: React.FC<DeleteRangeModalProps> = ({ isOpen, onClose, onConfirm, totalPages }) => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    const titleId = "delete-range-modal-title";

    useEffect(() => {
        if (isOpen) {
            setFrom('');
            setTo('');
            setError(null);
        }
    }, [isOpen]);

    const validateAndConfirm = () => {
        const fromNum = parseInt(from, 10);
        const toNum = parseInt(to, 10);

        if (isNaN(fromNum) || isNaN(toNum)) {
            setError("Please enter valid page numbers.");
            return;
        }
        if (fromNum < 1 || toNum < 1 || fromNum > totalPages || toNum > totalPages) {
            setError(`Page numbers must be between 1 and ${totalPages}.`);
            return;
        }
        if (fromNum > toNum) {
            setError("'From' page cannot be greater than 'To' page.");
            return;
        }
        if (toNum - fromNum + 1 >= totalPages) {
            setError("You cannot delete all pages of the document.");
            return;
        }

        setError(null);
        onConfirm(fromNum, toNum);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4"
            onClick={onClose}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 id={titleId} className="text-lg leading-6 font-bold text-on-surface">
                        Delete Page Range
                    </h3>
                    <div className="mt-4 space-y-4">
                        <p className="text-sm text-on-surface-variant">
                            Enter the range of pages you wish to permanently delete. This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <div>
                                <label htmlFor="from-page" className="block text-sm font-medium text-on-surface-variant">From</label>
                                <input
                                    id="from-page"
                                    type="number"
                                    value={from}
                                    onChange={e => setFrom(e.target.value)}
                                    min="1"
                                    max={totalPages}
                                    className="mt-1 w-24 bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-center"
                                    autoFocus
                                />
                            </div>
                             <div>
                                <label htmlFor="to-page" className="block text-sm font-medium text-on-surface-variant">To</label>
                                <input
                                    id="to-page"
                                    type="number"
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    min="1"
                                    max={totalPages}
                                    className="mt-1 w-24 bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-center"
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/50 p-2 rounded-md">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-background/50 px-4 py-3 sm:px-6 flex flex-row-reverse rounded-b-xl">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={validateAndConfirm}
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-surface text-base font-medium text-on-surface hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-background sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteRangeModal;
