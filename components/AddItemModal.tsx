

import React, { useEffect } from 'react';
import { CloseIcon } from './Icons';
import { EQUIPMENT_CONFIG } from '../services/equipmentConfig';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface AddItemModalProps {
    onClose: () => void;
    onSelectItem: (itemKey: string) => void;
}

const deviceTypes = Object.entries(EQUIPMENT_CONFIG).filter(([, conf]) => conf.type === 'device');
const markerTypes = Object.entries(EQUIPMENT_CONFIG).filter(([, conf]) => conf.type === 'marker');

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onSelectItem }) => {
    const modalRef = useFocusTrap<HTMLDivElement>(true);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleSelect = (itemKey: string) => {
        onSelectItem(itemKey);
        onClose();
    };

    const renderGrid = (title: string, items: [string, any][]) => (
        <div>
            <h2 className="text-xl font-bold text-on-surface mb-4">{title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {items.map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => handleSelect(key)}
                        className="flex flex-col items-center justify-center text-center p-2 bg-surface rounded-lg border border-white/10 hover:bg-primary-700 hover:border-primary-500 transition-all duration-200 aspect-square"
                    >
                        <config.IconComponent className={`w-6 h-6 mb-1.5 ${config.color}`} />
                        <span className="text-xs text-on-surface-variant font-medium">{config.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-background w-full h-full sm:max-w-3xl sm:max-h-[80vh] sm:rounded-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-item-title"
            >
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-white/10">
                    <h1 id="add-item-title" className="text-2xl font-bold">Add to Inventory</h1>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-8">
                    {renderGrid('Devices', deviceTypes)}
                    {renderGrid('Markers', markerTypes)}
                </main>
            </div>
        </div>
    );
};

export default AddItemModal;