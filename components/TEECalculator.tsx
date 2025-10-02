import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { useAppDispatch } from '../state/AppContext';
import { toast } from 'react-hot-toast';

interface TEECalculatorProps {
    project: Project | null | undefined;
    onFinish: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const TEECalculator: React.FC<TEECalculatorProps> = ({ project, onFinish }) => {
    const [totalLaborHours, setTotalLaborHours] = useState(295);
    const [lodgingPerDiem, setLodgingPerDiem] = useState(210);
    const [mealsPerDiem, setMealsPerDiem] = useState(74);
    const [customWeeks, setCustomWeeks] = useState<number | null>(null);
    const [customNights, setCustomNights] = useState<number | null>(null);

    const dispatch = useAppDispatch();

    // Calculate T&E based on Excel formulas
    const calculations = useMemo(() => {
        // Total Weeks = Total Labor Hours / 40 (rounded up)
        const totalWeeksFromHours = Math.ceil(totalLaborHours / 40);

        // Use custom weeks if provided, otherwise use calculated
        const totalWeeks = customWeeks || totalWeeksFromHours;

        // Total Nights of T&E = Total Weeks * 4 (this seems to be a multiplier in the Excel)
        const totalNightsTEE = totalWeeks * 4;

        // Override with custom nights if provided
        const lodgingNights = customNights || totalNightsTEE;
        const mealsNights = customNights || totalNightsTEE;

        const lodgingCost = lodgingNights * lodgingPerDiem;
        const mealsCost = mealsNights * mealsPerDiem;
        const totalTEE = lodgingCost + mealsCost;

        return {
            totalWeeks,
            totalNightsTEE,
            lodgingNights,
            mealsNights,
            lodgingCost,
            mealsCost,
            totalTEE,
            totalWeeksFromHours,
        };
    }, [totalLaborHours, lodgingPerDiem, mealsPerDiem, customWeeks, customNights]);

    const handleAutoCalculate = () => {
        const calculatedWeeks = Math.ceil(totalLaborHours / 40);
        setCustomWeeks(calculatedWeeks);
        setCustomNights(calculatedWeeks * 4);
        toast.success('T&E automatically calculated from labor hours');
    };

    const handleSaveToProject = () => {
        if (!project) return;

        dispatch({
            type: 'UPDATE_PROJECT',
            payload: {
                ...project,
                teeCalculations: {
                    totalLaborHours,
                    lodgingPerDiem,
                    mealsPerDiem,
                    totalWeeks: calculations.totalWeeks,
                    totalNightsTEE: calculations.totalNightsTEE,
                    lodgingNights: calculations.lodgingNights,
                    mealsNights: calculations.mealsNights,
                    lodgingCost: calculations.lodgingCost,
                    mealsCost: calculations.mealsCost,
                    totalTEE: calculations.totalTEE,
                    calculatedAt: new Date().toISOString(),
                }
            }
        });

        toast.success('T&E calculations saved to project!');
    };

    return (
        <div className="w-full h-full flex flex-col bg-background text-on-surface">
            <header className="p-4 md:p-6 border-b border-white/10 flex-shrink-0 flex justify-between items-center bg-surface">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    Remote Job Calculator for T&E
                </h1>
                <div className="flex items-center gap-2">
                    <button onClick={handleSaveToProject} className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
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

                {/* Labor Hours Input */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Total Labor Hours from CPQ</h2>
                    <div className="flex items-center gap-4">
                        <label className="flex-shrink-0">Total Install Hours from CPQ:</label>
                        <input
                            type="number"
                            min="0"
                            value={totalLaborHours}
                            onChange={(e) => setTotalLaborHours(parseInt(e.target.value) || 0)}
                            className="w-32 bg-background p-2 rounded border border-white/20 text-right"
                        />
                        <span className="text-on-surface-variant">hours</span>
                    </div>
                </div>

                {/* Calculations Display */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">T&E Calculations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Left Column - Weeks Calculation */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-on-surface">Duration Calculation</h3>
                            <div className="flex justify-between">
                                <span>Total Weeks:</span>
                                <span className="font-mono font-bold">{calculations.totalWeeks}</span>
                            </div>
                            <div className="text-xs text-on-surface-variant">
                                Formula: {totalLaborHours} ÷ 40 = {calculations.totalWeeksFromHours} weeks
                                {customWeeks ? ` (overridden to ${customWeeks})` : ''}
                            </div>
                        </div>

                        {/* Middle Column - Nights Calculation */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-on-surface">Nights Calculation</h3>
                            <div className="flex justify-between">
                                <span>Total Nights of T&E:</span>
                                <span className="font-mono font-bold">{calculations.totalNightsTEE}</span>
                            </div>
                            <div className="text-xs text-on-surface-variant">
                                Formula: {calculations.totalWeeks} weeks × 4 = {calculations.totalNightsTEE} nights
                                {customNights ? ` (overridden to ${customNights})` : ''}
                            </div>
                        </div>

                        {/* Right Column - Final T&E */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-on-surface">T&E to Enter into CPQ</h3>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total T&E:</span>
                                <span className="text-green-400">{currencyFormatter.format(calculations.totalTEE)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Per Diem Rates */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Per Diem Rates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="space-y-3">
                            <h3 className="font-semibold text-on-surface">Lodging</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-primary-400">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={lodgingPerDiem}
                                    onChange={(e) => setLodgingPerDiem(parseInt(e.target.value) || 0)}
                                    className="w-24 bg-background p-2 rounded border border-white/20 text-right"
                                />
                                <span className="text-on-surface-variant">per night</span>
                            </div>
                            <div className="text-sm text-on-surface-variant">
                                Lodging Cost: {currencyFormatter.format(calculations.lodgingCost)}
                                ({calculations.lodgingNights} nights × ${lodgingPerDiem})
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-on-surface">Meals (GSA)</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-primary-400">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={mealsPerDiem}
                                    onChange={(e) => setMealsPerDiem(parseInt(e.target.value) || 0)}
                                    className="w-24 bg-background p-2 rounded border border-white/20 text-right"
                                />
                                <span className="text-on-surface-variant">per night</span>
                            </div>
                            <div className="text-sm text-on-surface-variant">
                                Meals Cost: {currencyFormatter.format(calculations.mealsCost)}
                                ({calculations.mealsNights} nights × ${mealsPerDiem})
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manual Override Section */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Manual Adjustments</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium">Override Total Weeks</label>
                            <input
                                type="number"
                                min="0"
                                value={customWeeks || ''}
                                onChange={(e) => setCustomWeeks(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder={`Auto: ${calculations.totalWeeksFromHours}`}
                                className="w-full bg-background p-2 rounded border border-white/20 text-right"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium">Override Total Nights</label>
                            <input
                                type="number"
                                min="0"
                                value={customNights || ''}
                                onChange={(e) => setCustomNights(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder={`Auto: ${calculations.totalNightsTEE}`}
                                className="w-full bg-background p-2 rounded border border-white/20 text-right"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={handleAutoCalculate}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
                        >
                            Auto-Calculate from Labor Hours
                        </button>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Instructions</h2>
                    <div className="space-y-2 text-on-surface-variant">
                        <p>• Enter the <strong>Total Install Hours from CPQ</strong> above</p>
                        <p>• The calculator will automatically compute <strong>Total Weeks</strong> (hours ÷ 40)</p>
                        <p>• <strong>Total Nights of T&E</strong> is calculated as weeks × 4</p>
                        <p>• Adjust <strong>Per Diem Rates</strong> for lodging and meals as needed</p>
                        <p>• Use <strong>Manual Adjustments</strong> to override calculations if needed</p>
                        <p>• <strong>Total T&E</strong> amount should be entered into CPQ for project costing</p>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-surface p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 text-primary-400">Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                        <div>
                            <div className="text-2xl font-bold text-primary-400">{calculations.totalWeeks}</div>
                            <div className="text-sm text-on-surface-variant">Total Weeks</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary-400">{calculations.totalNightsTEE}</div>
                            <div className="text-sm text-on-surface-variant">Total Nights</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-400">{currencyFormatter.format(calculations.lodgingCost)}</div>
                            <div className="text-sm text-on-surface-variant">Lodging Cost</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-400">{currencyFormatter.format(calculations.mealsCost)}</div>
                            <div className="text-sm text-on-surface-variant">Meals Cost</div>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/20 text-center">
                        <div className="text-3xl font-bold text-yellow-400">{currencyFormatter.format(calculations.totalTEE)}</div>
                        <div className="text-sm text-on-surface-variant">Total T&E to Enter into CPQ</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TEECalculator;
