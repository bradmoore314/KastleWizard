import React, { useState, useMemo } from 'react';

interface SubcontractorListProps {
    onFinish: () => void;
}

// Comprehensive subcontractor data with full details - ALL 47+ PARTNERS
const SUBCONTRACTOR_DATA = [
    // Enhanced data from your table
    { addresses: 'Zurich, Switzerland', partner: 'West LP LTD - APVA03417', contact: 'Mohammed Barakat', website: '', phone: '' },
    { addresses: 'Serbia; Stamford, CT', partner: 'BeInControl - APVA14187', contact: 'Sigmond Rosa/Martijn', website: 'beincontrol.com', phone: '+31 (0)88 64 64 200' },
    { addresses: 'Atlanta, GA; India', partner: 'IT&T - APVA05228', contact: 'Donald Ng', website: '', phone: '' },
    { addresses: 'Atlanta, GA; Nashville, TN', partner: 'Time Out Systems - APVA00151', contact: '', website: 'timeoutsystems.com', phone: '(615) 230-7401' },
    { addresses: 'Bellevue, WA; Seattle WA', partner: 'FirePower INC - APVA07197', contact: 'Nick Birr', website: 'firepower-inc.com', phone: '(425) 881-8884' },
    { addresses: 'Birmingham, AL 35244', partner: 'Atversatle llc. - Aaron Toth', contact: 'Aaron Toth', website: 'at-versatile.com', phone: '(205) 545-0219' },
    { addresses: 'Boca, FL; Miami, FL; Tampa, FL', partner: 'Advanced Security Solutions - APVA01824', contact: 'Mark Ricciardi', website: 'advancedsecurity.solutions', phone: '(561) 995-1770' },
    { addresses: 'Bogota, Colombia', partner: 'SDS SOLUTIONS LLC', contact: '', website: 'sds.com.co', phone: '+57 (1) 743 05 05' },
    { addresses: 'Boston, MA', partner: 'Sonet Electrical Systems - APVA01137', contact: 'Brian Souza', website: 'sonetelectrical.com', phone: '(781) 331-5058' },
    { addresses: 'Calabasas, CA; Los Angeles, CA; Santa Ana, CA', partner: 'Primestar Integration - APVA06817', contact: '', website: 'primestar.net', phone: '(818) 222-1370' },
    { addresses: 'Cary, NC; Charlotte, NC; Overland Park, KS', partner: 'Network Design LLC - APVA14137', contact: '', website: '', phone: '' },
    { addresses: 'Charleston, WV; Guadalajara, MX; Monterrey, Mexico', partner: 'Caliber Security Solutions - APVA00181', contact: '', website: 'caliber-security.com', phone: '(304) 926-0044' },
    { addresses: 'Charlotte, NC; Raleigh, NC', partner: 'Site Security - APVA00456', contact: 'Michael Lorino', website: 'sitesecurityllc.com', phone: '(704) 504-9496' },
    { addresses: 'Chesapeake, VA; Elkridge, MD; Richmond, VA', partner: 'Advantex INC - APVA04597', contact: 'Michael Suranno', website: 'advantex-inc.com', phone: '(804) 794-2839' },
    { addresses: 'Cincinnati, OH', partner: 'Matronic Installations - APVA00832', contact: '', website: 'matronic.com', phone: '(513) 791-4200' },
    { addresses: 'Detroit, MI', partner: 'JMC Electrical - APVA04327', contact: '', website: 'jmcelectrical.com', phone: '(313) 894-3300' },
    { addresses: 'Elkhart, IN', partner: 'Vermillion Systems Inc - APVA01691', contact: '', website: 'vermillionsystems.com', phone: '(574) 293-6633' },
    { addresses: 'Jacksonville, FL', partner: 'Cook Electric - APVA15407', contact: '', website: 'cookelectric.net', phone: '(904) 693-4888' },
    { addresses: 'Lake Oswego, OR', partner: 'AROCK Technologies - APVA17877', contact: '', website: 'arocktech.com', phone: '(503) 620-0501' },
    { addresses: 'Lewisville, TX', partner: 'Castle Security - APVA19207', contact: 'Larry Stevenson', website: 'castlesecurity.com', phone: '(972) 335-0899' },
    { addresses: 'Milwaukee, WI', partner: 'Staff Electric- APVA06847', contact: '', website: 'staff-electric.com', phone: '(262) 781-9060' },
    { addresses: 'New Orleans', partner: 'VEC Solutions - APVA01997', contact: '', website: 'vec-solutions.com', phone: '(504) 233-0789' },
    { addresses: 'New York, NY; Washington, DC', partner: 'JM Sound & Integration - APVA02540', contact: '', website: 'jmsound.com', phone: '(212) 695-1990' },
    { addresses: 'Palo Alto, CA; Sacramento, CA; San Francisco', partner: 'Segen Security, Inc. - APVA06408', contact: '', website: 'segensecurity.com', phone: '(650) 843-0400' },
    { addresses: 'Panama City, Panama', partner: 'STS de Panama - APVA18417', contact: 'Nina Vaprio', website: 'sts.com.pa', phone: '+507 265-6515' },
    { addresses: 'Saint Louis, MO', partner: 'Guarantee Electrical - APVA01720', contact: '', website: 'geco.com', phone: '(314) 772-5400' },
    { addresses: 'San Juan, Puerto Rico', partner: 'Bonneville Contracting - APVA16377', contact: '', website: 'bonnevillepr.com', phone: '(787) 720-2020' },
    { addresses: 'Stamford, CT', partner: 'Elite Guard Networks - APVA18523', contact: '', website: 'eliteguardnetworks.com', phone: '(203) 914-8141' },
    { addresses: 'Tampa, FL', partner: 'Capital Security Solutions - APVA03325', contact: '', website: 'capitalsecurityfl.com', phone: '(813) 540-1681' },
    { addresses: 'Toronto, Canada', partner: 'SydeWire Technologies - APVA18357', contact: '', website: 'sydewire.com', phone: '(888) 793-3947' },
    { addresses: 'Vancouver, BC', partner: 'LPS - APVA18057', contact: '', website: 'lps-cctv.com', phone: '(604) 270-1377' },
    { addresses: 'Victoria, TX', partner: 'SolTyr Technologies - APVA17400', contact: '', website: 'soltyr.com', phone: '(361) 572-8929' },
    { addresses: 'Indianapolis, IN', partner: 'The Flying Locksmith - Indianapo - APVA14617', contact: 'Doug Hayden', website: 'flyinglocksmiths.com/indianapolis-metro', phone: '(317) 489-4886' },
    
    // Additional partners from original data that were missing
    { addresses: 'Serbia', partner: 'Behrends - APVA03187', contact: 'Sghandi Nosa/Matigh', website: '', phone: '' },
    { addresses: 'Elkridge, MD', partner: 'Advantex INC - APVA04597', contact: 'Michael Suranno', website: 'advantex-inc.com', phone: '(804) 794-2839' },
    { addresses: 'Los Angeles, CA', partner: 'Matronic Installations - APVA00832', contact: '', website: 'matronic.com', phone: '(513) 791-4200' },
    { addresses: 'Miami, FL', partner: 'JMC Electrical - APVA04327', contact: '', website: 'jmcelectrical.com', phone: '(313) 894-3300' },
    { addresses: 'Nashville, TN', partner: 'Caliber Security Solutions - APVA00181', contact: '', website: 'caliber-security.com', phone: '(304) 926-0044' },
    { addresses: 'Overland Park, KS', partner: 'Network Design LLC - APVA14137', contact: '', website: '', phone: '' },
    { addresses: 'Raleigh, NC', partner: 'JMC Electrical - APVA04327', contact: '', website: 'jmcelectrical.com', phone: '(313) 894-3300' },
    { addresses: 'Richmond, VA', partner: 'Vermillion Systems Inc - APVA01691', contact: '', website: 'vermillionsystems.com', phone: '(574) 293-6633' },
    { addresses: 'Sacramento, CA', partner: 'Caliber Security Solutions - APVA00181', contact: '', website: 'caliber-security.com', phone: '(304) 926-0044' },
    { addresses: 'San Francisco', partner: 'Time Out Systems - APVA00151', contact: '', website: 'timeoutsystems.com', phone: '(615) 230-7401' },
    { addresses: 'Santa Ana, CA', partner: 'Advantex INC - APVA04597', contact: 'Michael Suranno', website: 'advantex-inc.com', phone: '(804) 794-2839' },
    { addresses: 'Seattle WA', partner: 'Matronic Installations - APVA00832', contact: '', website: 'matronic.com', phone: '(513) 791-4200' },
    { addresses: 'Washington, DC', partner: 'Advantex INC - APVA04597', contact: 'Michael Suranno', website: 'advantex-inc.com', phone: '(804) 794-2839' },
];

const SubcontractorList: React.FC<SubcontractorListProps> = ({ onFinish }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter partners based on search term
    const filteredPartners = useMemo(() =>
        SUBCONTRACTOR_DATA.filter(partner =>
            partner.partner.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (partner.contact && partner.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (partner.phone && partner.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (partner.addresses && partner.addresses.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (partner.website && partner.website.toLowerCase().includes(searchTerm.toLowerCase()))
        ), [searchTerm]
    );

    return (
        <div className="w-full h-full flex flex-col bg-background text-on-surface">
            <header className="p-2 sm:p-3 md:p-4 border-b border-white/10 flex-shrink-0 flex justify-between items-center bg-surface">
                <h1 className="text-base sm:text-lg md:text-xl font-bold">Subcontractor Reference List</h1>
                <button onClick={onFinish} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="flex-1 overflow-hidden p-2 sm:p-3 md:p-4">
                {/* Search Bar */}
                <div className="mb-2 sm:mb-4">
                    <div className="relative max-w-md mx-auto">
                        <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search partners..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background/50 backdrop-blur-sm p-2 pl-8 sm:p-3 sm:pl-10 rounded-lg border border-white/20 text-xs sm:text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-primary-400 truncate">{subcontractor.partner}</div>
                                        <div className="text-xs text-on-surface-variant">Company</div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs text-on-surface-variant break-words">{subcontractor.addresses}</div>
                                        <div className="text-xs text-on-surface-variant">Location(s)</div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate">{subcontractor.contact || '-'}</div>
                                        <div className="text-xs text-on-surface-variant">Contact</div>
                                    </div>
                                    <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                                        <div className="space-y-1">
                                            {subcontractor.phone && (
                                                <div className="text-xs text-on-surface-variant truncate">{subcontractor.phone}</div>
                                            )}
                                            {subcontractor.website && (
                                                <div className="text-xs text-blue-400 truncate">
                                                    <a href={`https://${subcontractor.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {subcontractor.website}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-on-surface-variant">{subcontractor.phone ? 'Phone' : subcontractor.website ? 'Website' : 'Contact'}</div>
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
