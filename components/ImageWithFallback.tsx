import React, { useState, useEffect } from 'react';
import { getFile } from '../services/fileStorage';
import { ImageIcon } from './Icons';

interface ImageWithFallbackProps {
  localId: string;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ localId, alt, className, onClick }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isActive = true;
    let url: string | null = null;

    const loadImage = async () => {
      try {
        const file = await getFile(localId);
        if (isActive && file) {
          url = URL.createObjectURL(file);
          setObjectUrl(url);
        } else if (isActive) {
          setError(true);
        }
      } catch (err) {
        console.error(`Failed to load image with localId ${localId}:`, err);
        if (isActive) {
          setError(true);
        }
      }
    };

    loadImage();

    return () => {
      isActive = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [localId]);

  if (error) {
    return (
      <div className={`${className} bg-background flex items-center justify-center text-red-500/50`} title={`Error loading image ${localId}`}>
        <ImageIcon className="w-1/2 h-1/2" />
      </div>
    );
  }

  if (!objectUrl) {
    return (
       <div className={`${className} bg-background flex items-center justify-center`}>
         <div className="animate-spin rounded-full h-1/3 w-1/3 border-b-2 border-primary-500"></div>
       </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} onClick={onClick} />;
};

export default ImageWithFallback;
