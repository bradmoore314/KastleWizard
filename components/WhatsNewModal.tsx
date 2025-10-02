import React, { useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface WhatsNewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useFocusTrap<HTMLDivElement>(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[140] flex items-center justify-center p-4" onClick={onClose}>
            <div ref={modalRef} className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-primary-400">✨ What's New in v1.30</h2>
                        <p className="text-on-surface-variant mt-1">Major updates and improvements across the platform</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-8">

                        {/* New Calculator Suite */}
                        <section>
                            <h3 className="text-xl font-bold text-primary-400 mb-4 flex items-center gap-3">
                                <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                                🧮 Complete Calculator Suite
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-background/30 p-4 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-green-400 mb-2">T&E Calculator</h4>
                                    <p className="text-sm text-on-surface-variant mb-3">
                                        Calculate travel & expense costs for remote jobs with automatic calculations based on labor hours.
                                    </p>
                                    <ul className="text-xs text-on-surface-variant space-y-1">
                                        <li>• Automatic calculation: Hours ÷ 40 = weeks</li>
                                        <li>• T&E nights: weeks × 4</li>
                                        <li>• Per diem rates for lodging & meals</li>
                                        <li>• Manual overrides for custom scenarios</li>
                                    </ul>
                                </div>
                                <div className="bg-background/30 p-4 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-green-400 mb-2">Partner Budget Calculator</h4>
                                    <p className="text-sm text-on-surface-variant mb-3">
                                        Professional partner budget calculations matching Excel formulas exactly.
                                    </p>
                                    <ul className="text-xs text-on-surface-variant space-y-1">
                                        <li>• Device-based calculations with fixed hours</li>
                                        <li>• 15% markup with 85% partner allocation</li>
                                        <li>• Partner labor budget calculations</li>
                                        <li>• Excel formula transparency</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Partner Directory */}
                        <section>
                            <h3 className="text-xl font-bold text-primary-400 mb-4 flex items-center gap-3">
                                <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                                📞 Partner Directory
                            </h3>
                            <div className="bg-background/30 p-4 rounded-lg border border-white/10">
                                <p className="text-sm text-on-surface-variant mb-4">
                                    Comprehensive partner network database with 33+ verified partners across multiple regions and countries.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <h5 className="font-semibold text-primary-400 mb-2">Features:</h5>
                                        <ul className="text-on-surface-variant space-y-1">
                                            <li>• 🔍 Search by name, location, or contact</li>
                                            <li>• 📊 Sort by partner name or location</li>
                                            <li>• 🌐 Clickable websites for partner research</li>
                                            <li>• 📱 Responsive design for all devices</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-primary-400 mb-2">Coverage:</h5>
                                        <ul className="text-on-surface-variant space-y-1">
                                            <li>• 🇺🇸 20+ US states</li>
                                            <li>• 🌎 International partners</li>
                                            <li>• 📍 Service areas clearly defined</li>
                                            <li>• ☎️ Complete contact information</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-primary-400 mb-2">Data:</h5>
                                        <ul className="text-on-surface-variant space-y-1">
                                            <li>• 33 verified partners</li>
                                            <li>• Service areas & locations</li>
                                            <li>• Company websites</li>
                                            <li>• Contact information</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Navigation Improvements */}
                        <section>
                            <h3 className="text-xl font-bold text-primary-400 mb-4 flex items-center gap-3">
                                <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                                🧭 Enhanced Navigation
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-background/30 p-4 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-blue-400 mb-3">Navigation Restructure</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span className="text-sm">Renamed "Calculators" → "Tools" for better UX</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span className="text-sm">Added dedicated "Partner Directory" tab</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span className="text-sm">Better organization of features</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-background/30 p-4 rounded-lg border border-white/10">
                                    <h4 className="font-semibold text-purple-400 mb-3">Mobile Optimization</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span className="text-sm">Smaller navigation buttons on mobile</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span className="text-sm">Better touch targets for mobile users</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">✓</span>
                                            <span className="text-sm">Responsive design improvements</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Interface Enhancements */}
                        <section>
                            <h3 className="text-xl font-bold text-primary-400 mb-4 flex items-center gap-3">
                                <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                                🎨 Professional Interface
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-background/30 p-4 rounded-lg border border-white/10 text-center">
                                    <div className="text-2xl mb-2">🎨</div>
                                    <h4 className="font-semibold text-green-400 mb-2">Elegant Design</h4>
                                    <p className="text-xs text-on-surface-variant">
                                        Removed technical clutter, added gradient backgrounds, glassmorphism effects
                                    </p>
                                </div>
                                <div className="bg-background/30 p-4 rounded-lg border border-white/10 text-center">
                                    <div className="text-2xl mb-2">📱</div>
                                    <h4 className="font-semibold text-green-400 mb-2">Mobile Friendly</h4>
                                    <p className="text-xs text-on-surface-variant">
                                        Optimized navigation and layouts for mobile devices
                                    </p>
                                </div>
                                <div className="bg-background/30 p-4 rounded-lg border border-white/10 text-center">
                                    <div className="text-2xl mb-2">⚡</div>
                                    <h4 className="font-semibold text-green-400 mb-2">Enhanced UX</h4>
                                    <p className="text-xs text-on-surface-variant">
                                        Smooth animations, hover effects, and intuitive interactions
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Technical Improvements */}
                        <section>
                            <h3 className="text-xl font-bold text-primary-400 mb-4 flex items-center gap-3">
                                <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                                🔧 Technical Enhancements
                            </h3>
                            <div className="bg-background/30 p-4 rounded-lg border border-white/10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-blue-400 mb-3">Bug Fixes:</h4>
                                        <ul className="text-sm text-on-surface-variant space-y-1">
                                            <li>• Fixed Gateway Calculator race condition</li>
                                            <li>• Resolved Excel export array format errors</li>
                                            <li>• Fixed useEffect circular dependencies</li>
                                            <li>• Improved error handling throughout</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-purple-400 mb-3">Performance:</h4>
                                        <ul className="text-sm text-on-surface-variant space-y-1">
                                            <li>• Optimized component rendering</li>
                                            <li>• Reduced bundle size where possible</li>
                                            <li>• Improved state management efficiency</li>
                                            <li>• Enhanced mobile performance</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="pt-6 border-t border-white/10 text-center">
                            <p className="text-on-surface-variant">
                                🚀 <strong>Kastle Wizard v1.30</strong> - Now more powerful, professional, and user-friendly than ever!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsNewModal;
