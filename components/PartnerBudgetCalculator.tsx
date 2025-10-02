import React, { useState, useMemo } from 'react';
import { Project, DeviceEdit, PartnerBudgetCalculation } from '../types';
import { useAppDispatch } from '../state/AppContext';
import { toast } from 'react-hot-toast';

interface PartnerBudgetCalculatorProps {
    project: Project | null | undefined;
    onFinish: () => void;
}

// Device types and their hours per device (matching Excel exactly)
const DEVICE_CONFIG = {
    'new_door': { label: 'New Door', hoursPerDevice: 10, cell: 'C8' },
    'takeover_door': { label: 'Takeover Door', hoursPerDevice: 8, cell: 'C9' },
    'door_contact_prop': { label: 'Door Contact/Prop', hoursPerDevice: 6, cell: 'C10' },
    'intercom': { label: 'Intercom', hoursPerDevice: 3, cell: 'C11' },
    'intercom_master_gw': { label: 'Intercom Master/GW', hoursPerDevice: 1, cell: 'C12' },
    'alarm_devices': { label: 'Alarm Devices', hoursPerDevice: 2, cell: 'C13' },
    'indoor_camera': { label: 'Indoor Camera', hoursPerDevice: 3, cell: 'C14' },
    'exterior_camera': { label: 'Exterior Camera', hoursPerDevice: 4, cell: 'C15' },
};

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const PartnerBudgetCalculator: React.FC<PartnerBudgetCalculatorProps> = ({ project, onFinish }) => {
    // Fill in $ Amounts Below section
    const [kastleLabor, setKastleLabor] = useState(0);
    const [kastleHourly, setKastleHourly] = useState(0);
    const [kastleProfit, setKastleProfit] = useState(0);
    const [partnerBudget, setPartnerBudget] = useState(0);

    // Partner Quote section
    const [partnerQuotePercent, setPartnerQuotePercent] = useState('15 percent');

    // Device quantities and hours per device
    const [deviceData, setDeviceData] = useState<Record<string, { quantity: number, hoursPerDevice: number }>>(() => {
        const initial: Record<string, { quantity: number, hoursPerDevice: number }> = {};
        Object.entries(DEVICE_CONFIG).forEach(([key, config]) => {
            initial[key] = { quantity: 0, hoursPerDevice: config.hoursPerDevice };
        });
        return initial;
    });

    // Partner Labor Budget section
    const [partnerLaborData, setPartnerLaborData] = useState({
        daysTeam: 0,
        weeksTech: 0,
        perHrRate: 0,
        totalHrsBudget: 0,
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

        // Update device data with loaded counts
        setDeviceData(prev => {
            const updated = { ...prev };
            Object.keys(DEVICE_CONFIG).forEach(key => {
                updated[key] = { ...updated[key], quantity: counts[key] || 0 };
            });
            return updated;
        });
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

    // Calculate device totals using Excel formulas
    const deviceCalculations = useMemo(() => {
        const calculations: Record<string, { totalHrs: number, formula: string }> = {};

        Object.entries(deviceData).forEach(([key, data]) => {
            const totalHrs = data.quantity * data.hoursPerDevice;
            calculations[key] = {
                totalHrs,
                formula: `=SUM(${DEVICE_CONFIG[key].cell}*D${parseInt(DEVICE_CONFIG[key].cell.slice(1)) + 7})`
            };
        });

        return calculations;
    }, [deviceData]);

    // Calculate totals using Excel formulas
    const totals = useMemo(() => {
        const totalKastleLabor = Object.values(deviceCalculations).reduce((sum, calc) => sum + calc.totalHrs, 0);

        // Excel formulas from the screenshot
        const calculatedKastleHourly = kastleLabor !== 0 ? kastleLabor / totalKastleLabor : 0;
        const calculatedKastleProfit = kastleLabor - (totalKastleLabor * (kastleHourly || 0));

        let calculatedPartnerBudget = 0;
        if (partnerQuotePercent === '15 percent') {
            calculatedPartnerBudget = kastleLabor * 0.85; // Partner gets 85%
        } else {
            // Handle other percentage cases if needed
            calculatedPartnerBudget = kastleLabor;
        }

        const partnerLaborBudget = partnerLaborData.totalHrsBudget * partnerLaborData.perHrRate;

        return {
            totalKastleLabor,
            kastleHourly: calculatedKastleHourly,
            kastleProfit: calculatedKastleProfit,
            partnerBudget: calculatedPartnerBudget,
            partnerLaborBudget,
        };
    }, [deviceCalculations, kastleLabor, kastleHourly, partnerQuotePercent, partnerLaborData]);

    const handleDeviceChange = (deviceKey: string, field: 'quantity' | 'hoursPerDevice', value: number) => {
        setDeviceData(prev => ({
            ...prev,
            [deviceKey]: { ...prev[deviceKey], [field]: Math.max(0, value) }
        }));
    };

    const handlePartnerLaborChange = (field: keyof typeof partnerLaborData, value: number) => {
        setPartnerLaborData(prev => ({ ...prev, [field]: value }));
    };

    const handleExportToProject = () => {
        if (!project) return;

        const partnerBudgetCalc: PartnerBudgetCalculation = {
            kastleLaborHours: totals.totalKastleLabor,
            partnerLaborHours: partnerLaborData.totalHrsBudget,
            kastleLaborCost: kastleLabor,
            partnerBudget: totals.partnerBudget,
            partnerGets: totals.partnerBudget, // Partner gets the budget amount
            lodgingNights: 0, // Not calculated in this component
            mealsNights: 0, // Not calculated in this component
            lodgingCost: 0, // Not calculated in this component
            mealsCost: 0, // Not calculated in this component
            totalTEE: 0, // Not calculated in this component
            deviceBreakdown: Object.fromEntries(
                Object.entries(deviceData).map(([key, data]) => [key, data.quantity])
            ),
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

                {/* Fill in $ Amounts Below Section */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Fill in $ Amounts Below</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kastle Labor</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={kastleLabor}
                                    onChange={(e) => setKastleLabor(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-background p-2 pl-8 rounded border border-white/20 text-right"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kastle Hourly</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={kastleHourly}
                                    onChange={(e) => setKastleHourly(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-background p-2 pl-8 rounded border border-white/20 text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="text-xs text-on-surface-variant">
                                Formula: =IFERROR(C3/D3, "")
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kastle Profit</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={kastleProfit}
                                    onChange={(e) => setKastleProfit(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-background p-2 pl-8 rounded border border-white/20 text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="text-xs text-on-surface-variant">
                                Formula: =IFERROR(C3-E5, "")
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Partner Budget</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={partnerBudget}
                                    onChange={(e) => setPartnerBudget(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-background p-2 pl-8 rounded border border-white/20 text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="text-xs text-on-surface-variant">
                                Formula: =IF(C5="15 percent", ".85", ...)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Partner Quote Section */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Partner Quote</h2>

                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium">Quote Type:</label>
                        <select
                            value={partnerQuotePercent}
                            onChange={(e) => setPartnerQuotePercent(e.target.value)}
                            className="bg-background p-2 rounded border border-white/20"
                        >
                            <option value="15 percent">15 percent</option>
                            <option value="other">Other</option>
                        </select>
                        <div className="text-sm text-on-surface-variant">
                            Partner gets 85% of Kastle Labor cost
                        </div>
                    </div>
                </div>

                {/* Device Section */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Device Calculations</h2>

                    <div className="space-y-3">
                        {Object.entries(DEVICE_CONFIG).map(([key, config]) => (
                            <div key={key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 bg-background rounded border border-white/10">
                                <div className="font-medium">{config.label}</div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-on-surface-variant w-8"># of Devices</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={deviceData[key].quantity}
                                        onChange={(e) => handleDeviceChange(key, 'quantity', parseInt(e.target.value) || 0)}
                                        className="w-20 bg-surface p-2 rounded border border-white/20 text-right"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-on-surface-variant w-8">Hrs. per Device</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={deviceData[key].hoursPerDevice}
                                        onChange={(e) => handleDeviceChange(key, 'hoursPerDevice', parseFloat(e.target.value) || 0)}
                                        className="w-20 bg-surface p-2 rounded border border-white/20 text-right"
                                    />
                                </div>

                                <div className="text-right">
                                    <span className="font-bold text-green-400">{deviceCalculations[key]?.totalHrs.toFixed(1) || '0.0'}</span>
                                    <div className="text-xs text-on-surface-variant">
                                        {config.cell}: {deviceCalculations[key]?.formula}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Partner Labor Budget Section */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Partner Labor Budget</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Days (Team)</label>
                            <input
                                type="number"
                                min="0"
                                value={partnerLaborData.daysTeam}
                                onChange={(e) => handlePartnerLaborChange('daysTeam', parseInt(e.target.value) || 0)}
                                className="w-full bg-background p-2 rounded border border-white/20 text-right"
                                placeholder="0"
                            />
                            <div className="text-xs text-on-surface-variant">=E18/16</div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Weeks (2-Tech)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={partnerLaborData.weeksTech}
                                onChange={(e) => handlePartnerLaborChange('weeksTech', parseFloat(e.target.value) || 0)}
                                className="w-full bg-background p-2 rounded border border-white/20 text-right"
                                placeholder="0.0"
                            />
                            <div className="text-xs text-on-surface-variant">=B19/5</div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">$ Per Hr. Rate</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={partnerLaborData.perHrRate}
                                    onChange={(e) => handlePartnerLaborChange('perHrRate', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-background p-2 pl-8 rounded border border-white/20 text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="text-xs text-on-surface-variant">=IFERROR(E19/E18, "")</div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Total Hrs. Budget</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={partnerLaborData.totalHrsBudget}
                                onChange={(e) => handlePartnerLaborChange('totalHrsBudget', parseFloat(e.target.value) || 0)}
                                className="w-full bg-background p-2 rounded border border-white/20 text-right"
                                placeholder="0.00"
                            />
                            <div className="text-xs text-on-surface-variant">=SUM(E8:E15)</div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-background rounded border border-white/10">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">Partner Labor Budget:</span>
                            <span className="font-bold text-lg text-green-400">
                                {currencyFormatter.format(totals.partnerLaborBudget)}
                            </span>
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1">
                            = {partnerLaborData.totalHrsBudget} hrs × ${partnerLaborData.perHrRate}/hr
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Project Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-2xl font-bold text-primary-400">{totals.totalKastleLabor.toFixed(1)}</div>
                            <div className="text-sm text-on-surface-variant">Total Kastle Hours</div>
                            <div className="text-xs text-on-surface-variant">=SUM(D8:D15)</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-400">{currencyFormatter.format(kastleLabor)}</div>
                            <div className="text-sm text-on-surface-variant">Kastle Labor</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-400">{currencyFormatter.format(totals.partnerBudget)}</div>
                            <div className="text-sm text-on-surface-variant">Partner Budget</div>
                            <div className="text-xs text-on-surface-variant">=85% of Kastle Labor</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-400">{currencyFormatter.format(totals.partnerLaborBudget)}</div>
                            <div className="text-sm text-on-surface-variant">Partner Labor Budget</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerBudgetCalculator;
