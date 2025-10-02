


import React, { useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    confirmVariant?: 'primary' | 'danger';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', confirmVariant = 'danger' }) => {
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    const titleId = "confirm-modal-title";

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onCancel();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onCancel]);

    if (!isOpen) {
        return null;
    }

    const confirmButtonClass = confirmVariant === 'danger'
        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500';

    return (
        <div
            className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4"
            onClick={onCancel}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${confirmVariant === 'danger' ? 'bg-red-900' : 'bg-primary-900'} sm:mx-0 sm:h-10 sm:w-10`}>
                            <AlertTriangle className={`h-6 w-6 ${confirmVariant === 'danger' ? 'text-red-400' : 'text-primary-400'}`} aria-hidden="true" />
                        </div>
                        <div className="mt-0 text-left">
                            <h3 id={titleId} className="text-lg leading-6 font-bold text-on-surface">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-on-surface-variant">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-background/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl">
                    <button
                        type="button"
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background sm:ml-3 sm:w-auto sm:text-sm ${confirmButtonClass}`}
                        onClick={() => { onConfirm(); onCancel(); }}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-surface text-base font-medium text-on-surface hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-background sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;