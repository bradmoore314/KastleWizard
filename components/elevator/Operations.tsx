import React, { useState } from 'react';
import { ElevatorLetterFormData, CarEntry } from '../../types';
import { AddIcon, DeleteIcon, HelpCircleIcon } from '../Icons';

interface OperationsProps {
    formData: ElevatorLetterFormData;
    onUpdate: (data: ElevatorLetterFormData) => void;
}

const InfoTooltip: React.FC<{ text: React.ReactNode }> = ({ text }) => (
    <div className="group relative inline-flex ml-2">
        <HelpCircleIcon className="w-4 h-4 text-on-surface-variant cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
            {text}
        </div>
    </div>
);

const FormField: React.FC<{ label: string, children: React.ReactNode, tooltip?: React.ReactNode }> = ({ label, children, tooltip }) => (
    <div>
        <label className="block text-sm font-medium text-on-surface-variant mb-2">
            {label}
            {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        {children}
    </div>
);

const commonInputClass = "w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition";

const Operations: React.FC<OperationsProps> = ({ formData, onUpdate }) => {
    const [carCount, setCarCount] = useState(() => formData.cars.reduce((max, car) => Math.max(max, car.id), 0));

    const handleChange = (field: keyof ElevatorLetterFormData, value: any) => {
        onUpdate({ ...formData, [field]: value });
    };
    
    const handleCarChange = (id: number, field: keyof Omit<CarEntry, 'id'>, value: any) => {
        const newFormData = {
            ...formData,
            cars: formData.cars.map(c => {
                if (c.id === id) {
                    const updatedCar = { ...c };
                    if (field === 'hasReader') {
                        updatedCar.hasReader = value as 'Yes' | 'No';
                    } else if (field === 'name') {
                        updatedCar.name = value;
                    } else if (field === 'floorsServed') {
                        updatedCar.floorsServed = value;
                    } else if (field === 'securedFloors') {
                        updatedCar.securedFloors = value;
                    }
                    return updatedCar;
                }
                return c;
            })
        };
        onUpdate(newFormData);
    };

    const addCarEntry = () => {
        const newId = carCount + 1;
        setCarCount(newId);
        const newCarEntry: CarEntry = {
            id: newId, name: `Car ${newId}`, hasReader: 'Yes', floorsServed: '', securedFloors: ''
        };
        const newFormData = {
            ...formData,
            cars: [...formData.cars, newCarEntry]
        };
        onUpdate(newFormData);
    };

    const removeCarEntry = (id: number) => {
        const newFormData = { ...formData, cars: formData.cars.filter(c => c.id !== id) };
        onUpdate(newFormData);
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface p-6 rounded-xl border border-white/10">
                <h2 className="text-xl font-bold mb-4">Car Details</h2>
                <div className="space-y-4">
                    {formData.cars.map((car, index) => (
                        <div key={car.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-background rounded-lg border border-white/10 items-end">
                            <FormField label={`Car ${index+1} Name`}><input type="text" value={car.name} onChange={e => handleCarChange(car.id, 'name', e.target.value)} className={commonInputClass} /></FormField>
                            <FormField label="Floors Served"><input type="text" value={car.floorsServed} onChange={e => handleCarChange(car.id, 'floorsServed', e.target.value)} placeholder="e.g., 1-10, P1, P2" className={commonInputClass} /></FormField>
                            <FormField label="Secured Floors" tooltip="Comma-separated list of floors to be secured by card reader."><input type="text" value={car.securedFloors} onChange={e => handleCarChange(car.id, 'securedFloors', e.target.value)} placeholder="e.g., 2, 5, 8-10" className={commonInputClass} /></FormField>
                            <button onClick={() => removeCarEntry(car.id)} className="mb-2 p-2 text-on-surface-variant hover:text-red-400"><DeleteIcon className="w-5 h-5" /></button>
                        </div>
                    ))}
                </div>
                <button onClick={addCarEntry} className="mt-4 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-semibold"><AddIcon className="w-5 h-5" /> Add Car</button>
            </div>
            <div className="bg-surface p-6 rounded-xl border border-white/10">
                <h2 className="text-xl font-bold mb-4">Freight Operations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Does Freight car operate in the main group?"><select value={formData.freightOperatesInGroup} onChange={e => handleChange('freightOperatesInGroup', e.target.value)} className={commonInputClass}><option value="No">No</option><option value="Yes">Yes</option></select></FormField>
                    <FormField label="Freight Car Number"><input type="text" value={formData.freightCarNumber} onChange={e => handleChange('freightCarNumber', e.target.value)} placeholder="e.g., 5" className={commonInputClass} /></FormField>
                    <FormField label="Freight Car Home Floor"><input type="text" value={formData.freightHomeFloor} onChange={e => handleChange('freightHomeFloor', e.target.value)} placeholder="e.g., Lobby" className={commonInputClass} /></FormField>
                    <FormField label="Freight Car Secure Options">
                        <select value={formData.freightSecure} onChange={e => handleChange('freightSecure', e.target.value)} className={commonInputClass}>
                            <option value="None">None</option>
                            <option value="KeyOnly">Keyswitch Only</option>
                            <option value="ReaderKey">Reader & Keyswitch</option>
                            <option value="Shutdown">Shutdown</option>
                        </select>
                    </FormField>
                </div>
            </div>
        </div>
    );
};

export default Operations;