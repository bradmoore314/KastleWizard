import React, { useState, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface CopyToPagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pageIndices: number[]) => void;
    totalPages: number;
    currentPage: number;
}

// FIX: Changed to a named export
export const CopyToPagesModal: React.FC<CopyToPagesModalProps> = ({ isOpen, onClose, onConfirm, totalPages, currentPage }) => {
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    const titleId = "copy-to-pages-modal-title";

    const handleTogglePage = (pageNumber: number) => {
        setSelectedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pageNumber)) {
                newSet.delete(pageNumber);
            } else {
                newSet.add(pageNumber);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const allPageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p !== currentPage);
        setSelectedPages(new Set(allPageNumbers));
    };
    
    const handleDeselectAll = () => {
        setSelectedPages(new Set());
    };

    const handleConfirm = () => {
        if (selectedPages.size > 0) {
            // FIX: Explicitly type `p` as a number to resolve potential arithmetic error in TypeScript.
            onConfirm(Array.from(selectedPages).map((p: number) => p - 1)); // Convert to 0-based index
        }
    };
    
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

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
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10">
                    <h3 id={titleId} className="text-lg leading-6 font-bold text-on-surface">
                        Copy Items to Pages
                    </h3>
                </header>
                <main className="p-6 flex-1 overflow-y-auto">
                    <p className="text-sm text-on-surface-variant mb-4">
                        Select the destination page(s) to copy the selected items to. The items will be placed at the same coordinates on each selected page.
                    </p>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Pages</span>
                        <div className="flex gap-2">
                            <button onClick={handleSelectAll} className="text-xs text-primary-400 hover:underline">Select All</button>
                            <button onClick={handleDeselectAll} className="text-xs text-primary-400 hover:underline">Deselect All</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 border border-white/10 p-2 rounded-md max-h-60 overflow-y-auto">
                        {pageNumbers.map(page => (
                            <label key={page} className={`flex items-center gap-2 p-2 rounded-md transition-colors ${page === currentPage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/10'}`}>
                                <input
                                    type="checkbox"
                                    disabled={page === currentPage}
                                    checked={selectedPages.has(page)}
                                    onChange={() => handleTogglePage(page)}
                                    className="h-4 w-4 rounded text-primary-600 bg-surface border-gray-500 focus:ring-primary-500"
                                />
                                <span className="text-sm">{page}</span>
                            </label>
                        ))}
                    </div>
                </main>
                <div className="bg-background/50 px-4 py-3 sm:px-6 flex flex-row-reverse rounded-b-xl">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        onClick={handleConfirm}
                        disabled={selectedPages.size === 0}
                    >
                        Copy to {selectedPages.size} Page(s)
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