import React, { useState, useEffect, useRef } from 'react';
import { MarkerEdit, MarkerData, EquipmentImage } from '../types';
import { EQUIPMENT_CONFIG } from '../services/equipmentConfig';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { toast } from 'react-hot-toast';
import { useAppDispatch } from '../state/AppContext';
import { Trash2, Camera as CameraIcon, UploadCloud, Palette } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import CameraCapture from './CameraCapture';

interface MarkerFormProps {
    marker: MarkerEdit;
    onSave: (id: string, data: MarkerData) => void;
    onClose: () => void;
    onImagesAdded: (markerId: string, files: FileList) => void;
    onViewImage: (imageLocalId: string) => void;
}

const MarkerForm: React.FC<MarkerFormProps> = ({ marker, onSave, onClose, onImagesAdded, onViewImage }) => {
    const [label, setLabel] = useState(marker.data.label);
    const [notes, setNotes] = useState(marker.data.notes || '');
    const [images, setImages] = useState(marker.data.images || []);
    const [color, setColor] = useState(marker.data.color);
    const [floor, setFloor] = useState(marker.data.floor);
    const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
    
    const modalRef = useFocusTrap<HTMLDivElement>(!isCameraCaptureOpen);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useAppDispatch();

    useEffect(() => {
        setLabel(marker.data.label);
        setNotes(marker.data.notes || '');
        setImages(marker.data.images || []);
        setColor(marker.data.color);
        setFloor(marker.data.floor);
    }, [marker.id, marker.data.label, marker.data.notes, marker.data.images, marker.data.color, marker.data.floor]);
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(marker.id, { label, notes, images, color, floor });
        toast.success("Marker details saved!");
        onClose();
    };

    const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onImagesAdded(marker.id, e.target.files);
        }
        e.target.value = ''; // Reset input
    };
    
    const handlePhotosTaken = (files: File[]) => {
        setIsCameraCaptureOpen(false);
        if (files.length > 0) {
            const dataTransfer = new DataTransfer();
            files.forEach(file => dataTransfer.items.add(file));
            onImagesAdded(marker.id, dataTransfer.files);
        }
    };

    const onImageDeleted = (imageLocalId: string) => {
        dispatch({ type: 'DELETE_IMAGE_FROM_MARKER', payload: { markerId: marker.id, imageLocalId } });
        setImages(prev => prev.filter(img => img.localId !== imageLocalId));
    };

    const config = EQUIPMENT_CONFIG[marker.markerType];
    const title = `Edit ${config?.label || 'Marker'}`;
    const Icon = config?.IconComponent || React.Fragment;
    const titleId = "marker-form-title";
    const modalContainerClasses = `bg-black/60 z-[100] flex justify-center fixed inset-0 items-end sm:items-center`;


    return (
      <>
        <div 
            className={modalContainerClasses}
            onClick={onClose} 
            ref={modalRef} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby={titleId}
        >
            <div className="bg-background rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-lg sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <form 
                    onSubmit={handleSubmit}
                    className="flex flex-col h-full"
                >
                    <div className="p-6 border-b border-white/10 flex-shrink-0">
                        <h2 id={titleId} className="text-2xl font-bold text-on-surface flex items-center gap-3">
                           <Icon className={`w-7 h-7 ${config?.color || ''}`} />
                           {title}
                        </h2>
                    </div>
                    <div className="p-6 bg-surface space-y-4 overflow-y-auto flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="marker-label" className="block text-sm font-medium text-on-surface-variant mb-2">
                                    Label
                                </label>
                                <input
                                    id="marker-label"
                                    type="text"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                />
                            </div>
                             <div>
                                <label htmlFor="marker-floor" className="block text-sm font-medium text-on-surface-variant mb-2">
                                    Floor
                                </label>
                                <input
                                    id="marker-floor"
                                    type="number"
                                    value={floor ?? ''}
                                    onChange={(e) => setFloor(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                    className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                />
                            </div>
                        </div>
                        <div className="my-4">
                            <label htmlFor="marker-color" className="flex items-center gap-2 text-sm font-medium text-on-surface-variant mb-2">
                                <Palette className="w-4 h-4" /> Custom Color
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="marker-color"
                                    type="color"
                                    value={color || '#ffffff'}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-12 h-10 p-1 bg-background border border-white/20 rounded-md cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={color || ''}
                                    onChange={(e) => setColor(e.target.value)}
                                    placeholder="#RRGGBB"
                                    className="flex-1 bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                />
                                <button type="button" onClick={() => setColor(undefined)} className="text-xs text-on-surface-variant hover:text-white underline">
                                    Reset
                                </button>
                            </div>
                            <p className="text-xs text-on-surface-variant/70 mt-1">Overrides the default icon color on PDF exports and in the editor.</p>
                        </div>
                        <div>
                            <label htmlFor="marker-notes" className="block text-sm font-medium text-on-surface-variant mb-2">
                                Notes
                            </label>
                            <textarea
                                id="marker-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                            />
                        </div>

                         <div className="md:col-span-full pt-4 border-t border-white/20">
                            <h3 className="text-lg font-semibold text-on-surface mb-4">📷 Images</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-4">
                                {images.map(image => (
                                   <div key={image.localId} className="relative group aspect-square">
                                       <ImageWithFallback
                                            localId={image.localId}
                                            alt="Marker attachment"
                                            className="w-full h-full object-cover rounded-md cursor-pointer"
                                            onClick={() => onViewImage(image.localId)}
                                       />
                                       <button type="button" onClick={() => onImageDeleted(image.localId)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Image">
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   </div>
                                ))}
                                <div className="aspect-square border-2 border-dashed border-white/30 rounded-md p-2 flex flex-col items-center justify-center text-on-surface-variant">
                                    <p className="text-sm font-semibold text-center mb-2">Add Photos</p>
                                    <div className="flex flex-col items-stretch justify-center gap-2 w-full px-4">
                                      <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-background hover:bg-white/10 border border-white/20 transition-colors text-sm">
                                          <UploadCloud className="w-4 h-4" />
                                          <span>Upload</span>
                                      </button>
                                      <button type="button" onClick={() => setIsCameraCaptureOpen(true)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-background hover:bg-white/10 border border-white/20 transition-colors text-sm">
                                          <CameraIcon className="w-4 h-4" />
                                          <span>Camera</span>
                                      </button>
                                    </div>
                                </div>
                                <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageInputChange} multiple />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-white/10 flex justify-end gap-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
        {isCameraCaptureOpen && (
            <CameraCapture
                isOpen={isCameraCaptureOpen}
                onClose={() => setIsCameraCaptureOpen(false)}
                onPhotosTaken={handlePhotosTaken}
            />
        )}
      </>
    );
};

export default MarkerForm;