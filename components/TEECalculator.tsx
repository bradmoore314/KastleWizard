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
                <div className="bg-gradient-to-br from-surface to-surface/80 p-8 rounded-xl border border-white/10 shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-primary-400 flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary-400 rounded-full"></div>
                        Project Duration Input
                    </h2>

                    <div className="max-w-md">
                        <label className="block text-sm font-semibold text-on-surface mb-3">Total Installation Hours from CPQ</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                value={totalLaborHours}
                                onChange={(e) => setTotalLaborHours(parseInt(e.target.value) || 0)}
                                className="w-full bg-background/50 backdrop-blur-sm p-4 pr-20 rounded-lg border border-white/20 text-right text-xl font-semibold focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">hours</span>
                        </div>
                        <p className="text-sm text-on-surface-variant mt-2">
                            Enter the total installation hours from your CPQ system
                        </p>
                    </div>
                </div>

                {/* Calculations Display */}
                <div className="bg-gradient-to-br from-surface to-surface/80 p-8 rounded-xl border border-white/10 shadow-lg">
                    <h2 className="text-2xl font-bold mb-8 text-primary-400 flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary-400 rounded-full"></div>
                        Travel & Expense Calculations
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Left Column - Weeks Calculation */}
                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                            <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                Project Duration
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant">Total Weeks:</span>
                                    <span className="font-bold text-xl text-primary-400">{calculations.totalWeeks}</span>
                                </div>
                                <div className="text-sm text-on-surface-variant bg-blue-400/10 p-2 rounded border border-blue-400/20">
                                    Based on {totalLaborHours} hours ÷ 40 hours/week
                                    {customWeeks ? ` (custom: ${customWeeks} weeks)` : ''}
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Nights Calculation */}
                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                            <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                                Travel Duration
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant">Nights Required:</span>
                                    <span className="font-bold text-xl text-primary-400">{calculations.totalNightsTEE}</span>
                                </div>
                                <div className="text-sm text-on-surface-variant bg-purple-400/10 p-2 rounded border border-purple-400/20">
                                    {calculations.totalWeeks} weeks × 4 nights per week
                                    {customNights ? ` (custom: ${customNights} nights)` : ''}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Final T&E */}
                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                            <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                Total T&E Cost
                            </h3>
                            <div className="space-y-3">
                                <div className="text-center">
                                    <span className="font-bold text-3xl text-green-400">{currencyFormatter.format(calculations.totalTEE)}</span>
                                </div>
                                <div className="text-sm text-on-surface-variant bg-green-400/10 p-2 rounded border border-green-400/20">
                                    Ready to enter into CPQ system
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Per Diem Rates */}
                <div className="bg-gradient-to-br from-surface to-surface/80 p-6 rounded-xl border border-white/10 shadow-lg">
                    <h2 className="text-xl font-bold mb-6 text-primary-400 flex items-center gap-3">
                        <div className="w-2 h-6 bg-primary-400 rounded-full"></div>
                        Daily Allowance Rates
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                            <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                                Hotel Accommodation
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-primary-400 text-2xl">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={lodgingPerDiem}
                                        onChange={(e) => setLodgingPerDiem(parseInt(e.target.value) || 0)}
                                        className="flex-1 bg-background/50 p-4 rounded-lg border border-white/20 text-right text-xl font-semibold focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
                                    />
                                    <span className="text-on-surface-variant font-medium">per night</span>
                                </div>
                                <div className="bg-orange-400/10 p-3 rounded-lg border border-orange-400/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-on-surface-variant">Total Lodging:</span>
                                        <span className="font-bold text-orange-400">{currencyFormatter.format(calculations.lodgingCost)}</span>
                                    </div>
                                    <div className="text-xs text-on-surface-variant mt-1">
                                        {calculations.lodgingNights} nights × ${lodgingPerDiem}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                            <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                Meals & Incidentals
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-primary-400 text-2xl">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={mealsPerDiem}
                                        onChange={(e) => setMealsPerDiem(parseInt(e.target.value) || 0)}
                                        className="flex-1 bg-background/50 p-4 rounded-lg border border-white/20 text-right text-xl font-semibold focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
                                    />
                                    <span className="text-on-surface-variant font-medium">per night</span>
                                </div>
                                <div className="bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-on-surface-variant">Total Meals:</span>
                                        <span className="font-bold text-yellow-400">{currencyFormatter.format(calculations.mealsCost)}</span>
                                    </div>
                                    <div className="text-xs text-on-surface-variant mt-1">
                                        {calculations.mealsNights} nights × ${mealsPerDiem}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manual Override Section */}
                <div className="bg-gradient-to-br from-surface to-surface/80 p-6 rounded-xl border border-white/10 shadow-lg">
                    <h2 className="text-xl font-bold mb-6 text-primary-400 flex items-center gap-3">
                        <div className="w-2 h-6 bg-primary-400 rounded-full"></div>
                        Custom Adjustments
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                            <label className="block text-sm font-semibold text-on-surface mb-3">Override Project Duration</label>
                            <input
                                type="number"
                                min="0"
                                value={customWeeks || ''}
                                onChange={(e) => setCustomWeeks(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder={`Auto-calculated: ${calculations.totalWeeksFromHours} weeks`}
                                className="w-full bg-background/50 p-4 rounded-lg border border-white/20 text-right text-lg font-semibold focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
                            />
                            <p className="text-xs text-on-surface-variant mt-2">
                                Manually adjust if project timeline differs from standard calculation
                            </p>
                        </div>

                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                            <label className="block text-sm font-semibold text-on-surface mb-3">Override Travel Nights</label>
                            <input
                                type="number"
                                min="0"
                                value={customNights || ''}
                                onChange={(e) => setCustomNights(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder={`Auto-calculated: ${calculations.totalNightsTEE} nights`}
                                className="w-full bg-background/50 p-4 rounded-lg border border-white/20 text-right text-lg font-semibold focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
                            />
                            <p className="text-xs text-on-surface-variant mt-2">
                                Adjust if actual travel requirements differ from standard 4 nights/week
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleAutoCalculate}
                            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            🔄 Reset to Auto-Calculation
                        </button>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-br from-surface to-surface/80 p-6 rounded-xl border border-white/10 shadow-lg">
                    <h2 className="text-xl font-bold mb-6 text-primary-400 flex items-center gap-3">
                        <div className="w-2 h-6 bg-primary-400 rounded-full"></div>
                        How to Use This Calculator
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                            <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                Getting Started
                            </h3>
                            <div className="space-y-3 text-on-surface-variant">
                                <p className="flex items-start gap-2">
                                    <span className="text-primary-400 mt-1">1.</span>
                                    Enter your <strong>total installation hours</strong> from CPQ
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-primary-400 mt-1">2.</span>
                                    Review the <strong>automatic calculations</strong> for duration and nights
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-primary-400 mt-1">3.</span>
                                    Adjust <strong>per diem rates</strong> if they differ from standard rates
                                </p>
                            </div>
                        </div>

                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                            <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                Customization Options
                            </h3>
                            <div className="space-y-3 text-on-surface-variant">
                                <p className="flex items-start gap-2">
                                    <span className="text-primary-400 mt-1">•</span>
                                    Use <strong>manual overrides</strong> for unique project requirements
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-primary-400 mt-1">•</span>
                                    Click <strong>Reset to Auto-Calculation</strong> to return to standard formulas
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-primary-400 mt-1">•</span>
                                    <strong>Save calculations</strong> to your project for future reference
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-primary-400/10 rounded-lg border border-primary-400/20">
                        <p className="text-center text-on-surface-variant">
                            💡 <strong>Final Step:</strong> Enter the <span className="font-bold text-green-400">{currencyFormatter.format(calculations.totalTEE)}</span> total into your CPQ system for accurate project pricing
                        </p>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-surface to-surface/80 p-8 rounded-xl border border-white/10 shadow-lg">
                    <h2 className="text-2xl font-bold mb-8 text-primary-400 flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary-400 rounded-full"></div>
                        Project Cost Breakdown
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-2">{calculations.totalWeeks}</div>
                            <div className="text-sm font-medium text-on-surface">Project Duration</div>
                            <div className="text-xs text-on-surface-variant mt-1">weeks required</div>
                        </div>

                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 text-center">
                            <div className="text-3xl font-bold text-purple-400 mb-2">{calculations.totalNightsTEE}</div>
                            <div className="text-sm font-medium text-on-surface">Travel Nights</div>
                            <div className="text-xs text-on-surface-variant mt-1">nights away from home</div>
                        </div>

                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 text-center">
                            <div className="text-3xl font-bold text-orange-400 mb-2">{currencyFormatter.format(calculations.lodgingCost)}</div>
                            <div className="text-sm font-medium text-on-surface">Hotel Costs</div>
                            <div className="text-xs text-on-surface-variant mt-1">{calculations.lodgingNights} nights lodging</div>
                        </div>

                        <div className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 text-center">
                            <div className="text-3xl font-bold text-yellow-400 mb-2">{currencyFormatter.format(calculations.mealsCost)}</div>
                            <div className="text-sm font-medium text-on-surface">Meal Allowance</div>
                            <div className="text-xs text-on-surface-variant mt-1">{calculations.mealsNights} nights meals</div>
                        </div>
                    </div>

                    <div className="mt-8 p-8 bg-gradient-to-r from-green-400/10 to-primary-400/10 rounded-xl border border-green-400/20">
                        <div className="text-center">
                            <div className="text-sm font-medium text-on-surface-variant mb-3">Total Travel & Expense Cost</div>
                            <div className="text-5xl font-bold text-green-400 mb-2">
                                {currencyFormatter.format(calculations.totalTEE)}
                            </div>
                            <div className="text-sm text-on-surface-variant">
                                Ready to enter into CPQ system for accurate project pricing
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TEECalculator;
