import React, { useState } from 'react';

interface PartnerDirectoryProps {
    onFinish: () => void;
}

// Partner data provided by user
const PARTNER_DATA = [
    { addresses: 'Atlanta, GA; Nashville, TN', partner: 'Time Out Systems - APVA00151', website: 'timeoutsystems.com', contact: '(615) 230-7401' },
    { addresses: 'Atlanta, GA; India', partner: 'IT&T - APVA05228 - Donald Ng', website: '', contact: '' },
    { addresses: 'Bellevue, WA; Seattle WA', partner: 'FirePower INC - APVA07197 - Nick Birr', website: 'firepower-inc.com', contact: '(425) 881-8884' },
    { addresses: 'Birmingham, AL 35244', partner: 'Atversatle llc. - Aaron Toth', website: 'at-versatile.com', contact: '(205) 545-0219' },
    { addresses: 'Boca, FL; Miami, FL; Tampa, FL', partner: 'Advanced Security Solutions - APVA01824 - Mark Ricciardi', website: 'advancedsecurity.solutions', contact: '(561) 995-1770' },
    { addresses: 'Bogota, Colombia', partner: 'SDS SOLUTIONS LLC', website: 'sds.com.co', contact: '+57 (1) 743 05 05' },
    { addresses: 'Boston, MA', partner: 'Sonet Electrical Systems - APVA01137 - Brian Souza', website: 'sonetelectrical.com', contact: '(781) 331-5058' },
    { addresses: 'Calabasas, CA; Los Angeles, CA; Santa Ana, CA', partner: 'Primestar Integration - APVA06817', website: 'primestar.net', contact: '(818) 222-1370' },
    { addresses: 'Cary, NC; Charlotte, NC; Overland Park, KS', partner: 'Network Design LLC - APVA14137', website: '', contact: '' },
    { addresses: 'Charleston, WV; Guadalajara, MX; Monterrey, Mexico', partner: 'Caliber Security Solutions - APVA00181', website: 'caliber-security.com', contact: '(304) 926-0044' },
    { addresses: 'Charlotte, NC; Raleigh, NC', partner: 'Site Security - APVA00456 - Michael Lorino', website: 'sitesecurityllc.com', contact: '(704) 504-9496' },
    { addresses: 'Chesapeake, VA; Elkridge, MD; Richmond, VA', partner: 'Advantex INC - APVA04597 - Michael Suranno', website: 'advantex-inc.com', contact: '(804) 794-2839' },
    { addresses: 'Cincinnati, OH', partner: 'Matronic Installations - APVA00832', website: 'matronic.com', contact: '(513) 791-4200' },
    { addresses: 'Detroit, MI', partner: 'JMC Electrical - APVA04327', website: 'jmcelectrical.com', contact: '(313) 894-3300' },
    { addresses: 'Elkhart, IN', partner: 'Vermillion Systems Inc - APVA01691', website: 'vermillionsystems.com', contact: '(574) 293-6633' },
    { addresses: 'Indianapolis, IN', partner: 'The Flying Locksmith - Indianapo - APVA14617 - Doug Hayden', website: 'flyinglocksmiths.com/indianapolis-metro', contact: '(317) 489-4886' },
    { addresses: 'Jacksonville, FL', partner: 'Cook Electric - APVA15407', website: 'cookelectric.net', contact: '(904) 693-4888' },
    { addresses: 'Lake Oswego, OR', partner: 'AROCK Technologies - APVA17877', website: 'arocktech.com', contact: '(503) 620-0501' },
    { addresses: 'Lewisville, TX', partner: 'Castle Security - APVA19207 - Larry Stevenson', website: 'castlesecurity.com', contact: '(972) 335-0899' },
    { addresses: 'Milwaukee, WI', partner: 'Staff Electric- APVA06847', website: 'staff-electric.com', contact: '(262) 781-9060' },
    { addresses: 'New Orleans', partner: 'VEC Solutions - APVA01997', website: 'vec-solutions.com', contact: '(504) 233-0789' },
    { addresses: 'New York, NY; Washington, DC', partner: 'JM Sound & Integration - APVA02540', website: 'jmsound.com', contact: '(212) 695-1990' },
    { addresses: 'Palo Alto, CA; Sacramento, CA; San Francisco', partner: 'Segen Security, Inc. - APVA06408', website: 'segensecurity.com', contact: '(650) 843-0400' },
    { addresses: 'Panama City, Panama', partner: 'STS de Panama - APVA18417 - Nina Vaprio', website: 'sts.com.pa', contact: '+507 265-6515' },
    { addresses: 'Saint Louis, MO', partner: 'Guarantee Electrical - APVA01720', website: 'geco.com', contact: '(314) 772-5400' },
    { addresses: 'San Juan, Puerto Rico', partner: 'Bonneville Contracting - APVA16377', website: 'bonnevillepr.com', contact: '(787) 720-2020' },
    { addresses: 'Serbia; Stamford, CT', partner: 'BeInControl - APVA14187 - Sigmond Rosa/Martijn', website: 'beincontrol.com', contact: '+31 (0)88 64 64 200' },
    { addresses: 'Stamford, CT', partner: 'Elite Guard Networks - APVA18523', website: 'eliteguardnetworks.com', contact: '(203) 914-8141' },
    { addresses: 'Tampa, FL', partner: 'Capital Security Solutions - APVA03325', website: 'capitalsecurityfl.com', contact: '(813) 540-1681' },
    { addresses: 'Toronto, Canada', partner: 'SydeWire Technologies - APVA18357', website: 'sydewire.com', contact: '(888) 793-3947' },
    { addresses: 'Vancouver, BC', partner: 'LPS - APVA18057', website: 'lps-cctv.com', contact: '(604) 270-1377' },
    { addresses: 'Victoria, TX', partner: 'SolTyr Technologies - APVA17400', website: 'soltyr.com', contact: '(361) 572-8929' },
    { addresses: 'Zurich, Switzerland', partner: 'West LP LTD - APVA03417 - Mohammed Barakat', website: '', contact: '' }
];

const PartnerDirectory: React.FC<PartnerDirectoryProps> = ({ onFinish }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'partner' | 'addresses'>('partner');

    // Filter partners based on search term
    const filteredPartners = PARTNER_DATA.filter(partner =>
        partner.partner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.addresses.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (partner.contact && partner.contact.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort partners
    const sortedPartners = [...filteredPartners].sort((a, b) => {
        if (sortBy === 'partner') {
            return a.partner.localeCompare(b.partner);
        } else {
            return a.addresses.localeCompare(b.addresses);
        }
    });

    return (
        <div className="w-full h-full flex flex-col bg-background text-on-surface">
            <header className="p-2 sm:p-4 md:p-6 border-b border-white/10 flex-shrink-0 flex justify-between items-center bg-surface">
                <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                    <div className="w-1.5 h-6 sm:w-2 sm:h-8 bg-primary-400 rounded-full"></div>
                    Partners Directory
                </h1>
                <button onClick={onFinish} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
                <div className="bg-gradient-to-br from-surface to-surface/80 p-4 sm:p-6 md:p-8 rounded-xl border border-white/10 shadow-lg">

                    {/* Search and Filter Controls */}
                    <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
                        <div className="relative flex-1 max-w-md">
                            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search partners, locations, or contacts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-background/50 backdrop-blur-sm p-2 pl-10 sm:p-4 sm:pl-12 rounded-lg border border-white/20 text-xs sm:text-sm text-on-surface focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
                            />
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <label className="text-xs sm:text-sm font-semibold text-on-surface">Sort by:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'partner' | 'addresses')}
                                className="bg-background/50 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-white/20 text-xs sm:text-sm text-on-surface focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-200"
                            >
                                <option value="partner">Partner Name</option>
                                <option value="addresses">Location</option>
                            </select>
                        </div>
                    </div>

                    {/* Partner Count */}
                    <div className="mb-6 text-center">
                        <p className="text-on-surface-variant">
                            Showing <span className="font-bold text-primary-400">{sortedPartners.length}</span> of <span className="font-bold text-primary-400">{PARTNER_DATA.length}</span> partners
                        </p>
                    </div>

                    {/* Partners Table */}
                    <div className="bg-background/20 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                            Service Areas
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                            Partner Company
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                            Website
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                            Contact Information
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {sortedPartners.map((partner, index) => (
                                        <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-on-surface">
                                                    {partner.addresses.split(';').map((address, i) => (
                                                        <div key={i} className="mb-1">
                                                            {address.trim()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-on-surface">
                                                    {partner.partner}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {partner.website ? (
                                                    <a
                                                        href={`https://${partner.website}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-primary-400 hover:text-primary-300 underline transition-colors"
                                                    >
                                                        {partner.website}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-on-surface-variant">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-on-surface">
                                                    {partner.contact || '—'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {sortedPartners.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold text-on-surface mb-2">No partners found</h3>
                            <p className="text-on-surface-variant">
                                Try adjusting your search terms or filters
                            </p>
                        </div>
                    )}

                    {/* Footer Information */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-lg border border-blue-400/20">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-400 text-xl">ℹ️</div>
                            <div>
                                <p className="font-semibold text-on-surface mb-2">Partner Network Information</p>
                                <p className="text-sm text-on-surface-variant">
                                    This directory contains our verified partner network with coverage across multiple regions and countries.
                                    All partners have been pre-qualified and maintain active agreements.
                                    Contact information is regularly updated, but please verify current details before project engagement.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerDirectory;
