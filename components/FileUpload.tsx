

import React, { useCallback, useState } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8">
      <div
        className={`w-full max-w-lg h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors duration-300 ${isDragging ? 'border-primary-500 bg-surface' : 'border-on-surface-variant/30'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-lg text-on-surface-variant">Processing PDF...</p>
          </>
        ) : (
          <>
            <UploadIcon className="w-16 h-16 text-on-surface-variant" />
            {/* FIX: Update prompt to include images, as the application can convert them to PDF. */}
            <p className="mt-4 text-xl font-semibold text-center px-2">Drag & drop your PDF or Image here</p>
            <p className="text-on-surface-variant">or</p>
            <label htmlFor="file-upload" className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md cursor-pointer hover:bg-primary-700 transition-colors">
              Browse Files
            </label>
            {/* FIX: Update accept attribute to allow JPEG and PNG images. */}
            <input id="file-upload" type="file" className="hidden" accept=".pdf,image/jpeg,image/png" onChange={handleFileChange} />
            <p className="mt-4 text-sm text-on-surface-variant/50">Max file size: 50MB</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;