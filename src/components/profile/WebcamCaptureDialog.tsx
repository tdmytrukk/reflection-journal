import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, X } from 'lucide-react';

interface WebcamCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (blob: Blob) => void;
}

export function WebcamCaptureDialog({
  open,
  onOpenChange,
  onCapture,
}: WebcamCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop the video to a square
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);
    
    const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageUrl);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (!canvasRef.current) return;
    
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
          onOpenChange(false);
        }
      },
      'image/jpeg',
      0.95
    );
  }, [onCapture, onOpenChange]);

  useEffect(() => {
    if (open) {
      setCapturedImage(null);
      setError(null);
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Take a Photo</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full aspect-square max-w-[400px] bg-muted rounded-lg overflow-hidden">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            ) : capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}
            
            {!isStreaming && !capturedImage && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={retakePhoto} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button onClick={confirmPhoto} className="flex-1">
                Use Photo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={capturePhoto} 
                disabled={!isStreaming}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
