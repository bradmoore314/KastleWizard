import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { CloseIcon } from './Icons';
import { toast } from 'react-hot-toast';

interface CameraCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    onPhotosTaken: (files: File[]) => void;
}

function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isOpen, onClose, onPhotosTaken }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let mediaStream: MediaStream | null = null;

        const startCamera = async () => {
            setError(null);
            setCapturedImages([]);
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                setStream(mediaStream);
            } catch (err) {
                console.error("Camera access error:", err);
                setError("Could not access camera. Check permissions.");
                toast.error("Camera access denied.");
                onClose();
            }
        };

        startCamera();

        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            setStream(null);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => {
                console.error("Video play failed:", err);
                setError("Could not start video stream.");
            });
        }
    }, [stream]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current || !stream) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setCapturedImages(prev => [...prev, canvas.toDataURL('image/jpeg', 0.9)]);
        }
    };

    const handleDelete = (indexToDelete: number) => {
        setCapturedImages(prev => prev.filter((_, index) => index !== indexToDelete));
    };

    const handleDone = () => {
        if (capturedImages.length > 0) {
            const files = capturedImages.map((dataUrl, i) => dataURLtoFile(dataUrl, `capture-${Date.now()}-${i}.jpg`));
            onPhotosTaken(files);
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div ref={modalRef} className="fixed inset-0 bg-black z-[120] flex flex-col items-center justify-center text-white" role="dialog" aria-modal="true">
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute top-4 right-4 z-20">
                <button onClick={onClose} className="p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="w-full h-full flex items-center justify-center bg-black">
                {stream ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                        <p>Starting camera...</p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end z-10 h-1/3">
                 {capturedImages.length > 0 && (
                    <div className="w-full overflow-x-auto flex gap-2 pb-4">
                        {capturedImages.map((src, index) => (
                            <div key={index} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-white">
                                <img src={src} alt={`Capture ${index + 1}`} className="w-full h-full object-cover" />
                                <button onClick={() => handleDelete(index)} className="absolute top-0 right-0 p-0.5 bg-red-600/80 rounded-bl-md">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="w-full flex items-center justify-center relative">
                    {capturedImages.length > 0 && (
                         <button onClick={handleDone} className="absolute right-0 px-4 py-2 rounded-full bg-primary-600 hover:bg-primary-700 text-sm font-bold">
                            Use {capturedImages.length} Photo(s)
                        </button>
                    )}
                    <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50" aria-label="Capture photo" disabled={!stream}>
                        <div className="w-16 h-16 rounded-full border-4 border-black"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraCapture;