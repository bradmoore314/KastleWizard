import React, { useEffect } from 'react';
import { FileUp, Camera } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { CloseIcon } from './Icons';

interface AddFloorplanSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadClick: () => void;
    onTakePhotoClick: () => void;
}

const AddFloorplanSourceModal: React.FC<AddFloorplanSourceModalProps> = ({ isOpen, onClose, onUploadClick, onTakePhotoClick }) => {
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

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

    const handleUpload = () => {
        onUploadClick();
        onClose();
    };

    const handleTakePhoto = () => {
        onTakePhotoClick();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4"
            onClick={onClose}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-floorplan-source-title"
        >
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 id="add-floorplan-source-title" className="text-xl font-bold text-on-surface">Add Floorplan</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={handleUpload}
                        className="flex flex-col items-center justify-center text-center p-6 bg-background rounded-lg border border-white/10 hover:bg-primary-700 hover:border-primary-500 transition-all duration-200 aspect-square"
                    >
                        <FileUp className="w-12 h-12 mb-3 text-primary-400" />
                        <span className="text-lg font-semibold text-on-surface">Upload PDF</span>
                        <span className="text-sm text-on-surface-variant">From your device files</span>
                    </button>
                    <button
                        onClick={handleTakePhoto}
                        className="flex flex-col items-center justify-center text-center p-6 bg-background rounded-lg border border-white/10 hover:bg-primary-700 hover:border-primary-500 transition-all duration-200 aspect-square"
                    >
                        <Camera className="w-12 h-12 mb-3 text-primary-400" />
                        <span className="text-lg font-semibold text-on-surface">Take Photo</span>
                        <span className="text-sm text-on-surface-variant">Use your device camera</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddFloorplanSourceModal;