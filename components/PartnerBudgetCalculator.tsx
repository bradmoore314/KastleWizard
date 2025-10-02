import React, { useState, useMemo } from 'react';
import { Project, DeviceEdit, PartnerBudgetCalculation } from '../types';
import { useAppDispatch } from '../state/AppContext';
import { toast } from 'react-hot-toast';

interface PartnerBudgetCalculatorProps {
    project: Project | null | undefined;
    onFinish: () => void;
}

// Device types and their hours per device (matching Excel)
const DEVICE_HOURS: Record<string, number> = {
    'new_door': 10,
    'takeover_door': 8,
    'door_contact_prop': 6,
    'intercom': 3,
    'intercom_master_gw': 1,
    'alarm_devices': 2,
    'indoor_camera': 3,
    'exterior_camera': 4,
};

const DEVICE_LABELS: Record<string, string> = {
    'new_door': 'New Door',
    'takeover_door': 'Takeover Door',
    'door_contact_prop': 'Door Contact/Prop',
    'intercom': 'Intercom',
    'intercom_master_gw': 'Intercom Master/GW',
    'alarm_devices': 'Alarm Devices',
    'indoor_camera': 'Indoor Camera',
    'exterior_camera': 'Exterior Camera',
};

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const PartnerBudgetCalculator: React.FC<PartnerBudgetCalculatorProps> = ({ project, onFinish }) => {
    const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({});
    const [hourlyRates, setHourlyRates] = useState({
        kastle_hourly: 120,
        partner_markup_percent: 15,
        lodging_per_diem: 210,
        meals_per_diem: 74,
    });
    const [projectDuration, setProjectDuration] = useState({
        totalLaborHours: 295, // From CPQ
        lodgingNights: 0,
        mealsNights: 0,
    });

    const dispatch = useAppDispatch();

    // Load device counts from project inventory
    React.useEffect(() => {
        if (!project) return;

        const counts: Record<string, number> = {};

        // Count devices from project inventory
        const allInventory = [
            ...project.projectLevelInventory,
            ...project.floorplans.flatMap(fp => fp.inventory)
        ];

        allInventory.forEach(item => {
            if (item.type === 'device') {
                const device = item as DeviceEdit;
                const deviceTypeKey = getDeviceTypeKey(device.deviceType);
                if (deviceTypeKey) {
                    counts[deviceTypeKey] = (counts[deviceTypeKey] || 0) + 1;
                }
            }
        });

        setDeviceCounts(counts);
    }, [project]);

    const getDeviceTypeKey = (deviceType: string): string | null => {
        const typeMap: Record<string, string> = {
            'door_new': 'new_door',
            'door_takeover': 'takeover_door',
            'door_contact': 'door_contact_prop',
            'door_prop': 'door_contact_prop',
            'intercom': 'intercom',
            'intercom_master': 'intercom_master_gw',
            'alarm_device': 'alarm_devices',
            'camera_indoor': 'indoor_camera',
            'camera_exterior': 'exterior_camera',
        };
        return typeMap[deviceType] || null;
    };

    // Calculate totals
    const calculations = useMemo(() => {
        let kastleLaborHours = 0;
        let partnerLaborHours = 0;

        Object.entries(deviceCounts).forEach(([deviceType, count]) => {
            const hoursPerDevice = DEVICE_HOURS[deviceType] || 0;
            const totalHours = count * hoursPerDevice;
            kastleLaborHours += totalHours;
            partnerLaborHours += totalHours; // Same hours, different rate
        });

        const kastleLaborCost = kastleLaborHours * hourlyRates.kastle_hourly;
        const partnerBudget = kastleLaborCost * (1 + hourlyRates.partner_markup_percent / 100);
        const partnerGets = kastleLaborCost * 0.85; // Partner gets 85%

        // T&E Calculations
        const totalWeeks = Math.ceil(projectDuration.totalLaborHours / 40);
        const lodgingNights = Math.max(totalWeeks, projectDuration.lodgingNights || totalWeeks);
        const mealsNights = Math.max(totalWeeks, projectDuration.mealsNights || totalWeeks);
        const lodgingCost = lodgingNights * hourlyRates.lodging_per_diem;
        const mealsCost = mealsNights * hourlyRates.meals_per_diem;

        return {
            kastleLaborHours,
            partnerLaborHours,
            kastleLaborCost,
            partnerBudget,
            partnerGets,
            lodgingNights,
            mealsNights,
            lodgingCost,
            mealsCost,
            totalTEE: lodgingCost + mealsCost,
        };
    }, [deviceCounts, hourlyRates, projectDuration]);

    const handleDeviceCountChange = (deviceType: string, count: number) => {
        setDeviceCounts(prev => ({ ...prev, [deviceType]: Math.max(0, count) }));
    };

    const handleRateChange = (field: keyof typeof hourlyRates, value: number) => {
        setHourlyRates(prev => ({ ...prev, [field]: value }));
    };

    const handleDurationChange = (field: keyof typeof projectDuration, value: number) => {
        setProjectDuration(prev => ({ ...prev, [field]: value }));
    };

    const handleAutoCalculateTEE = () => {
        const totalWeeks = Math.ceil(calculations.kastleLaborHours / 40);
        setProjectDuration(prev => ({
            ...prev,
            lodgingNights: totalWeeks,
            mealsNights: totalWeeks,
        }));
        toast.success('T&E automatically calculated based on labor hours');
    };

    const handleExportToProject = () => {
        if (!project) return;

        // Update project with partner budget calculations
        const partnerBudgetCalc: PartnerBudgetCalculation = {
            kastleLaborHours: calculations.kastleLaborHours,
            partnerLaborHours: calculations.partnerLaborHours,
            kastleLaborCost: calculations.kastleLaborCost,
            partnerBudget: calculations.partnerBudget,
            partnerGets: calculations.partnerGets,
            lodgingNights: calculations.lodgingNights,
            mealsNights: calculations.mealsNights,
            lodgingCost: calculations.lodgingCost,
            mealsCost: calculations.mealsCost,
            totalTEE: calculations.totalTEE,
            deviceBreakdown: deviceCounts,
            calculatedAt: new Date().toISOString(),
        };

        dispatch({
            type: 'UPDATE_PROJECT',
            payload: {
                ...project,
                partnerBudget: partnerBudgetCalc,
            }
        });

        toast.success('Partner budget calculations saved to project!');
    };

    return (
        <div className="w-full h-full flex flex-col bg-background text-on-surface">
            <header className="p-4 md:p-6 border-b border-white/10 flex-shrink-0 flex justify-between items-center bg-surface">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    Partner Budget Calculator
                </h1>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportToProject} className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                        Save to Project
                    </button>
                    <button onClick={onFinish} className="p-2 rounded-full hover:bg-white/10">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

                {/* Device Input Section */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Device Quantities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(DEVICE_LABELS).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-background rounded-md border border-white/10">
                                <span className="text-sm font-medium">{label}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={deviceCounts[key] || 0}
                                        onChange={(e) => handleDeviceCountChange(key, parseInt(e.target.value) || 0)}
                                        className="w-20 bg-surface p-2 rounded border border-white/20 text-right"
                                    />
                                    <span className="text-xs text-on-surface-variant w-12 text-right">
                                        × {DEVICE_HOURS[key]}h
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kastle Labor Calculations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left Column - Kastle & Partner Calculations */}
                    <div className="bg-surface p-6 rounded-lg border border-white/10">
                        <h2 className="text-xl font-semibold mb-4 text-primary-400">Kastle Labor</h2>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span>Total Kastle Hours:</span>
                                <span className="font-mono font-bold">{calculations.kastleLaborHours.toFixed(2)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="flex-shrink-0">Kastle Hourly Rate:</label>
                                <span className="text-primary-400">$</span>
                                <input
                                    type="number"
                                    value={hourlyRates.kastle_hourly}
                                    onChange={(e) => handleRateChange('kastle_hourly', parseInt(e.target.value) || 0)}
                                    className="w-20 bg-background p-2 rounded border border-white/20 text-right"
                                />
                                <span className="text-on-surface-variant">/hr</span>
                            </div>

                            <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-2">
                                <span>Kastle Labor Cost:</span>
                                <span className="text-green-400">{currencyFormatter.format(calculations.kastleLaborCost)}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/20">
                            <h3 className="font-semibold mb-3 text-primary-400">Partner Budget</h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <label className="flex-shrink-0">Partner Markup:</label>
                                    <input
                                        type="number"
                                        value={hourlyRates.partner_markup_percent}
                                        onChange={(e) => handleRateChange('partner_markup_percent', parseInt(e.target.value) || 0)}
                                        className="w-16 bg-background p-2 rounded border border-white/20 text-right"
                                    />
                                    <span className="text-on-surface-variant">%</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Partner Budget (Kastle + 15%):</span>
                                    <span className="font-mono font-bold">{currencyFormatter.format(calculations.partnerBudget)}</span>
                                </div>

                                <div className="flex justify-between text-sm text-on-surface-variant">
                                    <span>Partner Gets (85%):</span>
                                    <span className="font-mono">{currencyFormatter.format(calculations.partnerGets)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - T&E Calculations */}
                    <div className="bg-surface p-6 rounded-lg border border-white/10">
                        <h2 className="text-xl font-semibold mb-4 text-primary-400">T&E Calculator</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Total Labor Hours from CPQ</label>
                                <input
                                    type="number"
                                    value={projectDuration.totalLaborHours}
                                    onChange={(e) => handleDurationChange('totalLaborHours', parseInt(e.target.value) || 0)}
                                    className="w-full bg-background p-2 rounded border border-white/20"
                                />
                            </div>

                            <button
                                onClick={handleAutoCalculateTEE}
                                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
                            >
                                Auto-Calculate T&E from Labor Hours
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Lodging Nights</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={projectDuration.lodgingNights || calculations.lodgingNights}
                                        onChange={(e) => handleDurationChange('lodgingNights', parseInt(e.target.value) || 0)}
                                        className="w-full bg-background p-2 rounded border border-white/20 text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Meals Nights</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={projectDuration.mealsNights || calculations.mealsNights}
                                        onChange={(e) => handleDurationChange('mealsNights', parseInt(e.target.value) || 0)}
                                        className="w-full bg-background p-2 rounded border border-white/20 text-right"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/20">
                                <div className="flex items-center gap-2">
                                    <label className="flex-shrink-0">Lodging Per Diem:</label>
                                    <span className="text-primary-400">$</span>
                                    <input
                                        type="number"
                                        value={hourlyRates.lodging_per_diem}
                                        onChange={(e) => handleRateChange('lodging_per_diem', parseInt(e.target.value) || 0)}
                                        className="w-24 bg-background p-2 rounded border border-white/20 text-right"
                                    />
                                    <span className="text-on-surface-variant">/night</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="flex-shrink-0">Meals Per Diem (GSA):</label>
                                    <span className="text-primary-400">$</span>
                                    <input
                                        type="number"
                                        value={hourlyRates.meals_per_diem}
                                        onChange={(e) => handleRateChange('meals_per_diem', parseInt(e.target.value) || 0)}
                                        className="w-24 bg-background p-2 rounded border border-white/20 text-right"
                                    />
                                    <span className="text-on-surface-variant">/night</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/20">
                                <div className="flex justify-between font-bold">
                                    <span>Lodging Cost:</span>
                                    <span className="text-green-400">{currencyFormatter.format(calculations.lodgingCost)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Meals Cost:</span>
                                    <span className="text-green-400">{currencyFormatter.format(calculations.mealsCost)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-2 mt-2">
                                    <span>Total T&E:</span>
                                    <span className="text-yellow-400">{currencyFormatter.format(calculations.totalTEE)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Project Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div>
                            <div className="text-2xl font-bold text-primary-400">{calculations.kastleLaborHours.toFixed(1)}</div>
                            <div className="text-sm text-on-surface-variant">Total Kastle Hours</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-400">{currencyFormatter.format(calculations.partnerBudget)}</div>
                            <div className="text-sm text-on-surface-variant">Partner Budget</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-400">{currencyFormatter.format(calculations.totalTEE)}</div>
                            <div className="text-sm text-on-surface-variant">Total T&E</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerBudgetCalculator;
