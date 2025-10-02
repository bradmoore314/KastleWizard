

import React, { useEffect, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { getFile } from '../services/fileStorage';
import { CloseIcon } from './Icons';

interface ImageViewerProps {
  imageLocalId: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageLocalId, onClose }) => {
  const modalRef = useFocusTrap<HTMLDivElement>(true);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  useEffect(() => {
      let url: string | null = null;
      const loadImage = async () => {
          try {
              const file = await getFile(imageLocalId);
              if (file) {
                  url = URL.createObjectURL(file);
                  setObjectUrl(url);
              }
          } catch (e) {
              console.error("Failed to load image for viewer", e);
          }
      }
      loadImage();
      return () => {
          if (url) {
              URL.revokeObjectURL(url);
          }
      }
  }, [imageLocalId]);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4"
      onClick={onClose}
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
    >
      <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
        {objectUrl ? (
          <img src={objectUrl} alt="Device attachment preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        ) : (
          <div className="w-96 h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-surface rounded-full p-2 text-on-surface hover:bg-white/20 transition-colors"
          title="Close (Esc)"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ImageViewer;