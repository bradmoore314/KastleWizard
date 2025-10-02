

import React, { useState, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface DuplicateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (count: number) => void;
    deviceName: string;
}

const DuplicateModal: React.FC<DuplicateModalProps> = ({ isOpen, onClose, onConfirm, deviceName }) => {
    const [count, setCount] = useState(1);
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    const titleId = "duplicate-modal-title";

    useEffect(() => {
        if (isOpen) {
            setCount(1); // Reset on open
        }
    }, [isOpen]);

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

    const handleConfirm = () => {
        if (count > 0) {
            onConfirm(count);
        }
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
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 id={titleId} className="text-lg leading-6 font-bold text-on-surface">
                        Duplicate Device
                    </h3>
                    <div 
                        className="mt-4 space-y-4"
                    >
                        <p className="text-sm text-on-surface-variant">
                            How many duplicates of <strong className="text-on-surface">{deviceName}</strong> would you like to create?
                        </p>
                        <div>
                            <label htmlFor="duplicate-count" className="sr-only">Number of duplicates</label>
                            <input
                                id="duplicate-count"
                                type="number"
                                value={count}
                                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                min="1"
                                className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-center text-lg"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
                <div className="bg-background/50 px-4 py-3 sm:px-6 flex flex-row-reverse rounded-b-xl">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleConfirm}
                    >
                        Duplicate
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

export default DuplicateModal;