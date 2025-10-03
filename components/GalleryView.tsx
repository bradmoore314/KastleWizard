import React, { useState, useMemo } from 'react';
import { Floorplan, EquipmentType, DeviceType } from '../types';
import { ImageIcon } from './Icons';
import ImageWithFallback from './ImageWithFallback';
import { DEVICE_TYPE_TITLES, EQUIPMENT_CONFIG } from '../services/equipmentConfig';

type GroupByOption = 'date' | 'floorplan' | 'type';

interface PreparedImage {
  localId: string;
  createdAt: string;
  equipmentId: string;
  equipmentLocation: string;
  equipmentType: EquipmentType;
  floorplanId: string | null;
  floorplanName: string;
}

interface GalleryViewProps {
  images: PreparedImage[];
  floorplans: Floorplan[];
  onViewImage: (localId: string) => void;
  projectName: string;
}

const getEquipmentTitle = (type: EquipmentType) => {
    return DEVICE_TYPE_TITLES[type as DeviceType] || EQUIPMENT_CONFIG[type]?.label || 'Unknown Type';
};

const GalleryView: React.FC<GalleryViewProps> = ({ images, floorplans, onViewImage, projectName }) => {
    const [groupBy, setGroupBy] = useState<GroupByOption>('type');
    
    const floorplanNameMap = useMemo(() => {
        const map = new Map<string | null, string>();
        map.set(null, 'Project Level');
        floorplans.forEach(fp => map.set(fp.id, fp.name));
        return map;
    }, [floorplans]);

    const groupedImages = useMemo(() => {
        if (images.length === 0) return {};

        return images.reduce((acc, image) => {
            let key: string;
            switch(groupBy) {
                case 'date':
                    key = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date(image.createdAt));
                    break;
                case 'floorplan':
                    key = floorplanNameMap.get(image.floorplanId) || 'Unknown Floorplan';
                    break;
                case 'type':
                    key = getEquipmentTitle(image.equipmentType);
                    break;
            }
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(image);
            return acc;
        }, {} as Record<string, PreparedImage[]>);
    }, [images, groupBy, floorplanNameMap]);
    
    const sortedGroupKeys = useMemo(() => {
       const keys = Object.keys(groupedImages);
       if (groupBy === 'date') {
           return keys.sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
       }
       return keys.sort((a,b) => a.localeCompare(b));
    }, [groupedImages, groupBy]);

    const GroupButton: React.FC<{ value: GroupByOption; children: React.ReactNode }> = ({ value, children }) => (
        <button
            onClick={() => setGroupBy(value)}
            className={`flex-1 py-1 px-2 sm:py-1.5 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${groupBy === value ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="w-full h-full flex flex-col text-on-surface">
            <header className="p-2 sm:p-4 md:px-8 md:py-6 border-b border-white/10 flex-shrink-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">Image Gallery</h1>
                <p className="text-sm sm:text-md text-on-surface-variant">All photos for project: {projectName}</p>
            </header>

            <div className="p-2 sm:p-4 md:px-8 flex-shrink-0 bg-surface/50 border-b border-white/10">
                <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">Group by:</span>
                     <div className="flex items-center gap-1 bg-background rounded-lg p-1 max-w-sm">
                        <GroupButton value="date">Date</GroupButton>
                        <GroupButton value="floorplan">Floorplan</GroupButton>
                        <GroupButton value="type">Type</GroupButton>
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto">
                {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-on-surface-variant p-4">
                        <ImageIcon className="w-24 h-24 mb-4 opacity-20" />
                        <h2 className="text-2xl font-semibold mb-2">No Photos Yet</h2>
                        <p>Add images to your devices to see them in the gallery.</p>
                    </div>
                ) : (
                    <div className="p-4 md:p-8">
                        {sortedGroupKeys.map(groupKey => (
                            <section key={groupKey} className="mb-10">
                                <h2 className="text-xl font-bold border-b-2 border-primary-500 pb-2 mb-6 sticky top-0 bg-background py-2 z-10">
                                    {groupKey}
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {groupedImages[groupKey].map(image => (
                                        <div 
                                            key={image.localId}
                                            onClick={() => onViewImage(image.localId)}
                                            className="bg-surface rounded-lg overflow-hidden border border-white/10 group cursor-pointer shadow-md hover:shadow-primary-500/20 hover:border-primary-600 transition-all duration-300"
                                        >
                                            <div className="aspect-square bg-background">
                                                <ImageWithFallback
                                                    localId={image.localId}
                                                    alt={image.equipmentLocation}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="p-3 text-xs">
                                                <p className="font-bold text-on-surface truncate" title={image.equipmentLocation}>{image.equipmentLocation}</p>
                                                <p className="text-on-surface-variant truncate">{getEquipmentTitle(image.equipmentType)}</p>
                                                <p className="text-on-surface-variant/70 truncate">{image.floorplanName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default GalleryView;