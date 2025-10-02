
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { AnyEdit, DeviceEdit, MarkerEdit } from '../types';
import { getEditIconKey } from '../utils';
import { EQUIPMENT_CONFIG } from '../services/equipmentConfig';


interface LegendProps {
    edits: AnyEdit[];
    currentPage: number;
}

const Legend: React.FC<LegendProps> = ({ edits, currentPage }) => {
    const [isOpen, setIsOpen] = useState(true);

    const pageIndex = currentPage - 1;
    const itemsOnPage = edits.filter(e => (e.type === 'device' || e.type === 'marker') && e.pageIndex === pageIndex) as (DeviceEdit | MarkerEdit)[];

    if (itemsOnPage.length === 0) {
        return null;
    }

    const counts = itemsOnPage.reduce<Record<string, number>>((acc, item) => {
        const key = getEditIconKey(item);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    
    const legendItems = Object.entries(EQUIPMENT_CONFIG)
        .filter(([key]) => counts[key] > 0)
        .map(([key, config]) => ({
            key,
            count: counts[key],
            ...config
        }));


    return (
        <div className="bg-surface/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg w-56">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-on-surface font-semibold"
            >
                <span>Legend</span>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {isOpen && (
                <div className="p-3 border-t border-white/10">
                    <ul className="space-y-2">
                        {legendItems.map(({ key, label, IconComponent, color, count }) => (
                            <li key={key} className="flex items-center gap-3">
                                <IconComponent className={`w-5 h-5 flex-shrink-0 ${color}`} />
                                <span className="text-sm text-on-surface-variant flex-1">{label}</span>
                                <span className="text-sm font-semibold text-on-surface">({count})</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Legend;