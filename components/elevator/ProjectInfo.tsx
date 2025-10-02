import React from 'react';
import { ElevatorLetterFormData } from '../../types';
import { HelpCircleIcon } from '../Icons';

interface ProjectInfoProps {
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

const ProjectInfo: React.FC<ProjectInfoProps> = ({ formData, onUpdate }) => {
    const handleChange = (field: keyof ElevatorLetterFormData, value: any) => {
        onUpdate({ ...formData, [field]: value });
    };

    return (
        <div className="bg-surface p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-bold mb-4">Project & Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Date"><input type="date" value={formData.date} onChange={e => handleChange('date', e.target.value)} className={commonInputClass} /></FormField>
                <FormField label="Building Number"><input type="text" value={formData.bldgNumber} onChange={e => handleChange('bldgNumber', e.target.value)} placeholder="e.g., 1775" className={commonInputClass} /></FormField>
                <FormField label="Project Address & City" tooltip="Full street address, city, and state."><input type="text" value={formData.projectAddress} onChange={e => handleChange('projectAddress', e.target.value)} placeholder="e.g., 1775 Tysons Blvd, McLean, VA" className={commonInputClass + " md:col-span-2"} /></FormField>
                <FormField label="Account/Project Manager"><input type="text" value={formData.projManager} onChange={e => handleChange('projManager', e.target.value)} placeholder="Your Name" className={commonInputClass} /></FormField>
                <FormField label="Name of This Bank of Elevators"><input type="text" value={formData.thisBankName} onChange={e => handleChange('thisBankName', e.target.value)} placeholder="e.g., Main Lobby" className={commonInputClass} /></FormField>
                <FormField label="All Elevator Banks in Building" tooltip="Comma-separated list of all banks."><input type="text" value={formData.bankNames} onChange={e => handleChange('bankNames', e.target.value)} placeholder="e.g., Main Lobby, Service" className={commonInputClass + " md:col-span-2"} /></FormField>
            </div>
            <hr className="my-6 border-white/10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="font-bold">Management Company</h4>
                    <FormField label="Company Name"><input type="text" value={formData.mgmtCo} onChange={e => handleChange('mgmtCo', e.target.value)} className={commonInputClass}/></FormField>
                    <FormField label="Contact Person"><input type="text" value={formData.mgmtContact} onChange={e => handleChange('mgmtContact', e.target.value)} className={commonInputClass}/></FormField>
                    <FormField label="Phone #"><input type="tel" value={formData.mgmtPhone} onChange={e => handleChange('mgmtPhone', e.target.value)} className={commonInputClass}/></FormField>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold">Elevator Company</h4>
                    <FormField label="Company Name"><input type="text" value={formData.elevCo} onChange={e => handleChange('elevCo', e.target.value)} className={commonInputClass}/></FormField>
                    <FormField label="Contact Person"><input type="text" value={formData.elevContact} onChange={e => handleChange('elevContact', e.target.value)} className={commonInputClass}/></FormField>
                    <FormField label="Phone #"><input type="tel" value={formData.elevPhone} onChange={e => handleChange('elevPhone', e.target.value)} className={commonInputClass}/></FormField>
                </div>
            </div>
        </div>
    );
};

export default ProjectInfo;