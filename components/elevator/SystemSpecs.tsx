import React from 'react';
import { ElevatorLetterFormData } from '../../types';
import { HelpCircleIcon } from '../Icons';

interface SystemSpecsProps {
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

const SystemSpecs: React.FC<SystemSpecsProps> = ({ formData, onUpdate }) => {
    const handleChange = (field: keyof ElevatorLetterFormData, value: any) => {
        onUpdate({ ...formData, [field]: value });
    };

    const isSystemA = formData.systemType === 'A';
    const isSystemCD = ['C', 'D', 'CI'].includes(formData.systemType);

    return (
        <div className="space-y-6">
            <div className="bg-surface p-6 rounded-xl border border-white/10">
                <h2 className="text-xl font-bold mb-4">System Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Primary System Type" tooltip={<><b>Type A:</b> Secures hall call buttons.<br/><b>Types C, CI, D:</b> Secures in-cab floor buttons (most common).</>}>
                        <select value={formData.systemType} onChange={e => handleChange('systemType', e.target.value)} className={commonInputClass}>
                            <option value="">-- Choose a type --</option>
                            <option value="A">Type A - Access Control (Hall Call)</option>
                            <option value="D">Type D - Travel Control (Standard In-Cab)</option>
                            <option value="C">Type C - Floor Control (Night Time Only)</option>
                            <option value="CI">Type CI - Floor Control (Independent Schedule)</option>
                        </select>
                    </FormField>
                    <FormField label="Add Takeover Functionality?" tooltip="A special mode for in-cab floor control systems (C, CI, or D).">
                        <div className="h-full flex items-center"><input type="checkbox" checked={formData.takeover} onChange={e => handleChange('takeover', e.target.checked)} className="h-5 w-5 rounded text-primary-600 bg-surface border-gray-500 focus:ring-primary-500" /> <span className="ml-2">Yes</span></div>
                    </FormField>
                </div>
            </div>
            {isSystemA && <div className="bg-surface p-6 rounded-xl border border-white/10">
                <h2 className="text-xl font-bold mb-4">System 'A' Details (Hall Call)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Floor level(s) to be secured"><input type="text" value={formData.securedFloorsA} onChange={e => handleChange('securedFloorsA', e.target.value)} placeholder="e.g., Lobby, Garage Level 1" className={commonInputClass} /></FormField>
                    <FormField label="Are there rear hall calls on these floors?"><select value={formData.rearHallCalls} onChange={e => handleChange('rearHallCalls', e.target.value)} className={commonInputClass}><option value="No">No</option><option value="Yes">Yes</option></select></FormField>
                    <FormField label="Will there be phones next to the readers?"><select value={formData.phonesNextToReaders} onChange={e => handleChange('phonesNextToReaders', e.target.value)} className={commonInputClass}><option value="No">No</option><option value="Yes">Yes</option></select></FormField>
                </div>
            </div>}
            {isSystemCD && <div className="bg-surface p-6 rounded-xl border border-white/10">
                <h2 className="text-xl font-bold mb-4">In-Cab System Details ('C', 'D', 'CI')</h2>
                <h3 className="text-lg font-semibold mb-2">Reader Technology</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField label="Reader Type?">
                        <select value={formData.readerType} onChange={e => handleChange('readerType', e.target.value)} className={commonInputClass}>
                            <option value="Prox">Proximity (Prox)</option>
                            <option value="Swipe">Swipe</option>
                            <option value="IK">iKlass</option>
                            <option value="IC">iCity</option>
                        </select>
                    </FormField>
                    <FormField label="Reader Mounting?"><select value={formData.flushMount} onChange={e => handleChange('flushMount', e.target.value)} className={commonInputClass}><option value="Surface">Surface</option><option value="Recessed">Recessed</option></select></FormField>
                    <FormField label="Is the mounting surface ferrous (magnetic)?"><select value={formData.ferrousSurface} onChange={e => handleChange('ferrousSurface', e.target.value)} className={commonInputClass}><option value="No">No</option><option value="Yes">Yes</option></select></FormField>
                </div>
                <h3 className="text-lg font-semibold mb-2">Visitor Processing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Visitor Processing Method">
                        <select value={formData.visitorProcessing} onChange={e => handleChange('visitorProcessing', e.target.value)} className={commonInputClass}>
                            <option value="None">None</option>
                            <option value="KFO">Kastle Front Office (KFO)</option>
                            <option value="KOC">Kastle Occupant Courtesy (KOC)</option>
                        </select>
                    </FormField>
                    <FormField label="EOR Location (Fire Panel)" tooltip="Where is the Engineer's Override (EOR) key switch located?"><input type="text" value={formData.eorLocation} onChange={e => handleChange('eorLocation', e.target.value)} placeholder="e.g., Fire Control Room" className={commonInputClass} /></FormField>
                </div>
            </div>}
        </div>
    );
};

export default SystemSpecs;