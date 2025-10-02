

import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import MarkdownRenderer from './MarkdownRenderer';
import { CloseIcon } from './Icons';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysisResult: string | null;
    isLoading: boolean;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, analysisResult, isLoading }) => {
    const modalContainerRef = useFocusTrap<HTMLDivElement>(isOpen);
    const titleId = 'analysis-modal-title';

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" 
            onClick={onClose}
            ref={modalContainerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div
                className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 id={titleId} className="text-xl font-bold text-on-surface">AI Quote Analysis</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-surface">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                            <p className="text-lg text-on-surface-variant">Analyzing project data...</p>
                            <p className="text-sm text-on-surface-variant/60">This may take a moment.</p>
                        </div>
                    ) : analysisResult ? (
                        <MarkdownRenderer content={analysisResult} />
                    ) : (
                        <div className="text-center text-on-surface-variant">
                            <p>No analysis result available.</p>
                            <p>An error may have occurred.</p>
                        </div>
                    )}
                </div>
                 <div className="p-4 border-t border-white/10 text-right">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisModal;