import React from 'react';
import { AddIcon, DeleteIcon, EditDataIcon } from './Icons';

interface Calculation {
    id: string;
    name: string;
    [key: string]: any; 
}

interface CalculationListProps {
    title: string;
    calculations: Calculation[];
    onCreate: () => void;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onBack: () => void;
}

const CalculationList: React.FC<CalculationListProps> = ({ title, calculations, onCreate, onSelect, onDelete, onBack }) => {
    return (
        <div className="w-full h-full p-4 md:p-8 flex flex-col items-center bg-background">
            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <button onClick={onBack} className="text-sm text-on-surface-variant hover:text-white mb-2">
                            &larr; Back to Calculators
                        </button>
                        <h1 className="text-3xl font-bold">{title}</h1>
                    </div>
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        <AddIcon className="w-5 h-5" />
                        New Calculation
                    </button>
                </div>
                
                {calculations.length === 0 ? (
                    <div className="text-center py-16 bg-surface rounded-xl border border-white/10">
                        <p className="text-lg text-on-surface-variant">No calculations saved yet.</p>
                        <p className="text-sm text-on-surface-variant/70 mt-2">Click "New Calculation" to get started.</p>
                    </div>
                ) : (
                    <div className="bg-surface rounded-xl border border-white/10">
                        <ul className="divide-y divide-white/10">
                            {calculations.map(calc => (
                                <li key={calc.id} className="p-4 flex justify-between items-center group">
                                    <span className="font-semibold text-lg">{calc.name}</span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onSelect(calc.id)} className="p-2 text-on-surface-variant hover:text-primary-400" title="Edit">
                                            <EditDataIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => onDelete(calc.id)} className="p-2 text-on-surface-variant hover:text-red-400" title="Delete">
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalculationList;
