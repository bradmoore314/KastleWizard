import React from 'react';

interface SubcontractorListProps {
    onFinish: () => void;
}

// Sample subcontractor data (this would typically come from a database or API)
const SUBCONTRACTOR_DATA = [
    { partner: 'West LP LTD - APVA03417', contact: 'Mohammed Barakat', phone: 'T&T - APVA03226 - Donald Ng', address: 'Time Out Systems - APVA00151 - Nick Birt' },
    { partner: 'Behrends - APVA03187', contact: 'Sghandi Nosa/Matigh', phone: 'Advanced Security Solutions - APVA01824 - Mark Ricciardi' },
    { partner: 'Atlanta, GA', contact: 'SDS SOLUTIONS LLC', phone: 'Sonet Electrical Systems - APVA00137 - Brian Sousa' },
    { partner: 'Birmingham, AL 35244', contact: 'Primestar Integration - APVA06817', phone: 'Network Design LLC - APVA04137' },
    { partner: 'Boca, FL', contact: 'Caliber Security Solutions - APVA00181', phone: 'Site Security - APVA00456 - Michael Lorino' },
    { partner: 'Bogota, Colombia', contact: 'Network Design LLC - APVA04137', phone: 'Advantex INC - APVA04597 - Michael Suranno' },
    { partner: 'Boston, MA', contact: 'Matonic Installations - APVA00832', phone: 'JMC Electrical - APVA00427' },
    { partner: 'Calabasas, CA', contact: 'Vermillion Systems Inc - APVA01691', phone: 'Advantex INC - APVA04597 - Michael Suranno' },
    { partner: 'Cary, NC', contact: 'Caliber Security Solutions - APVA00181', phone: 'T&T - APVA03226 - Donald Ng' },
    { partner: 'Charleston, WV', contact: 'Time Out Systems - APVA00151 - Nick Birt' },
    { partner: 'Charlotte, NC', contact: 'Network Design LLC - APVA04137' },
    { partner: 'Chesapeake, VA', contact: 'Advantex INC - APVA04597 - Michael Suranno' },
    { partner: 'Cincinnati, OH', contact: 'Matonic Installations - APVA00832' },
    { partner: 'Detroit, MI', contact: 'JMC Electrical - APVA00427' },
    { partner: 'Elkhart, IN', contact: 'Vermillion Systems Inc - APVA01691' },
    { partner: 'Elkridge, MD', contact: 'Advantex INC - APVA04597 - Michael Suranno' },
    { partner: 'Guadalajara, MX', contact: 'Caliber Security Solutions - APVA00181' },
    { partner: 'India', contact: 'T&T - APVA03226 - Donald Ng' },
    { partner: 'Jacksonville, FL', contact: 'Time Out Systems - APVA00151 - Nick Birt' },
    { partner: 'Lake Oswego, OR', contact: 'Network Design LLC - APVA04137' },
    { partner: 'Lewisville, TX', contact: 'Advantex INC - APVA04597 - Michael Suranno' },
    { partner: 'Los Angeles, CA', contact: 'Matonic Installations - APVA00832' },
    { partner: 'Miami, FL', contact: 'JMC Electrical - APVA00427' },
    { partner: 'Milwaukee, WI', contact: 'Vermillion Systems Inc - APVA01691' },
    { partner: 'Nashville, TN', contact: 'Caliber Security Solutions - APVA00181' },
    { partner: 'New Orleans', contact: 'T&T - APVA03226 - Donald Ng' },
    { partner: 'New York, NY', contact: 'Time Out Systems - APVA00151 - Nick Birt' },
    { partner: 'Overland Park, KS', contact: 'Network Design LLC - APVA04137' },
    { partner: 'Palo Alto, CA', contact: 'Advantex INC - APVA04597 - Michael Suranno' },
    { partner: 'Panama City, Panama', contact: 'Matonic Installations - APVA00832' },
    { partner: 'Raleigh, NC', contact: 'JMC Electrical - APVA00427' },
    { partner: 'Richmond, VA', contact: 'Vermillion Systems Inc - APVA01691' },
    { partner: 'Sacramento, CA', contact: 'Caliber Security Solutions - APVA00181' },
    { partner: 'Saint Louis, MO', contact: 'T&T - APVA03226 - Donald Ng' },
    { partner: 'San Francisco', contact: 'Time Out Systems - APVA00151 - Nick Birt' },
    { partner: 'San Juan, Puerto Rico', contact: 'Network Design LLC - APVA04137' },
    { partner: 'Santa Ana, CA', contact: 'Advantex INC - APVA04597 - Michael Suranno' },
    { partner: 'Seattle WA', contact: 'Matonic Installations - APVA00832' },
    { partner: 'Serbia', contact: 'JMC Electrical - APVA00427' },
    { partner: 'Stamford, CT', contact: 'Vermillion Systems Inc - APVA01691' },
    { partner: 'Tampa, FL', contact: 'Caliber Security Solutions - APVA00181' },
    { partner: 'Toronto, Canada', contact: 'T&T - APVA03226 - Donald Ng' },
    { partner: 'Vancouver, BC', contact: 'Time Out Systems - APVA00151 - Nick Birt' },
    { partner: 'Victoria, TX', contact: 'Network Design LLC - APVA04137' },
    { partner: 'Washington, DC', contact: 'Advantex INC - APVA04597 - Michael Suranno' },
    { partner: 'Zurich, Switzerland', contact: 'Matonic Installations - APVA00832' },
    { partner: 'Indianapolis, IN', contact: 'JMC Electrical - APVA00427' },
];

const SubcontractorList: React.FC<SubcontractorListProps> = ({ onFinish }) => {
    return (
        <div className="w-full h-full flex flex-col bg-background text-on-surface">
            <header className="p-4 md:p-6 border-b border-white/10 flex-shrink-0 flex justify-between items-center bg-surface">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    Subcontractor Reference List
                </h1>
                <button onClick={onFinish} className="p-2 rounded-full hover:bg-white/10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="bg-gradient-to-br from-surface to-surface/80 p-8 rounded-xl border border-white/10 shadow-lg">
                    <h2 className="text-2xl font-bold mb-8 text-primary-400 flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary-400 rounded-full"></div>
                        Approved Partner Network
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {SUBCONTRACTOR_DATA.map((subcontractor, index) => (
                            <div key={index} className="bg-background/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-primary-400/30 hover:bg-background/50 transition-all duration-200">
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-semibold text-primary-400 uppercase tracking-wide">Partner Company</span>
                                        <div className="font-bold text-on-surface mt-1">{subcontractor.partner}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-primary-400 uppercase tracking-wide">Primary Contact</span>
                                        <div className="text-on-surface mt-1">{subcontractor.contact}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-primary-400 uppercase tracking-wide">Contact Details</span>
                                        <div className="text-sm text-on-surface-variant mt-1">{subcontractor.phone}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-lg border border-yellow-400/20">
                        <div className="flex items-start gap-3">
                            <div className="text-yellow-400 text-xl">⚠️</div>
                            <div>
                                <p className="font-semibold text-on-surface mb-2">Important Notice</p>
                                <p className="text-sm text-on-surface-variant">
                                    This directory contains approved partners with verified capabilities.
                                    Contact information and availability may change over time.
                                    Always verify current details and partner status before engaging for projects.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubcontractorList;
