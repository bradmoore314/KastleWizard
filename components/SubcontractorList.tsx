import React, { useState, useMemo } from 'react';

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
    const [searchTerm, setSearchTerm] = useState('');

    // Filter partners based on search term
    const filteredPartners = useMemo(() =>
        SUBCONTRACTOR_DATA.filter(partner =>
            partner.partner.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (partner.contact && partner.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (partner.phone && partner.phone.toLowerCase().includes(searchTerm.toLowerCase()))
        ), [searchTerm]
    );

    return (
        <div className="w-full h-full flex flex-col bg-background text-on-surface">
            <header className="p-3 md:p-4 border-b border-white/10 flex-shrink-0 flex justify-between items-center bg-surface">
                <h1 className="text-lg md:text-xl font-bold">Subcontractor Reference List</h1>
                <button onClick={onFinish} className="p-2 rounded-full hover:bg-white/10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="flex-1 overflow-hidden p-3 md:p-4">
                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative max-w-md mx-auto">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search partners..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background/50 backdrop-blur-sm p-3 pl-10 rounded-lg border border-white/20 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Partner Count */}
                <div className="text-center mb-3 text-sm text-on-surface-variant">
                    Showing <span className="font-semibold text-primary-400">{filteredPartners.length}</span> of <span className="font-semibold text-primary-400">{SUBCONTRACTOR_DATA.length}</span> partners
                </div>

                {/* Compact Partner List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-1">
                        {filteredPartners.map((subcontractor, index) => (
                            <div key={index} className="bg-surface/50 p-3 rounded border border-white/10 hover:border-primary-400/30 hover:bg-surface/70 transition-all duration-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-primary-400 truncate">{subcontractor.partner}</div>
                                        <div className="text-xs text-on-surface-variant">Company</div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate">{subcontractor.contact}</div>
                                        <div className="text-xs text-on-surface-variant">Contact</div>
                                    </div>
                                    <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                                        <div className="text-xs text-on-surface-variant truncate">{subcontractor.phone}</div>
                                        <div className="text-xs text-on-surface-variant">Details</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredPartners.length === 0 && (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-3">🔍</div>
                            <h3 className="text-lg font-semibold text-on-surface mb-2">No partners found</h3>
                            <p className="text-on-surface-variant text-sm">
                                Try adjusting your search terms
                            </p>
                        </div>
                    )}
                </div>

                {/* Important Notice - Compact */}
                <div className="mt-4 p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
                    <div className="flex items-start gap-2">
                        <div className="text-yellow-400 text-sm mt-0.5">⚠️</div>
                        <div className="text-xs text-on-surface-variant">
                            <strong>Important:</strong> Verify current details and partner status before engaging for projects.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubcontractorList;
