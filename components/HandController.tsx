import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { HandControls, GestureType } from '../types';
import { detectGesture } from '../utils/gesture';

interface HandControllerProps {
  controlsRef: React.MutableRefObject<HandControls>;
}

const HandController: React.FC<HandControllerProps> = ({ controlsRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [gesture, setGesture] = useState<GestureType>('NONE');
  
  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startWebcam();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startWebcam = async () => {
      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480
            }
          });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        } catch (err) {
          console.error("Error accessing webcam:", err);
        }
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      // Check if video has enough data
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        requestAnimationFrame(predictWebcam);
        return;
      }

      setLoading(false);

      const startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(video, startTimeMs);

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Mirror the context for drawing so it matches the mirrored video
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);

      const drawingUtils = new DrawingUtils(ctx);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // Draw landmarks
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 3
          });
          drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1, radius: 3 });
        }

        // Detect Gesture
        const detectedGesture = detectGesture(landmarks);
        setGesture(detectedGesture);

        // Update Controls Ref (No React Render)
        // MediaPipe coords: x [0,1], y [0,1]. 0,0 is top-left.
        // We want 0,0 center. x [-1, 1], y [-1, 1].
        // IMPORTANT: Because we mirrored the drawing, we intuitively want moving hand right to move plane right.
        // But the raw coordinate x=0 is left, x=1 is right.
        // If I move my hand to the right of the screen (my right), x is close to 0 (because camera mirrors).
        // Let's rely on standard: x increases left to right in the image data.
        
        const wrist = landmarks[0];
        
        // Map 0..1 to -1..1
        // We invert X because it's a selfie camera
        const cx = (wrist.x - 0.5) * 2 * -1; 
        const cy = (wrist.y - 0.5) * 2; // Y increases downward, so +1 is bottom. Canvas coords.

        controlsRef.current = {
          x: cx, 
          y: cy, 
          isFlying: detectedGesture !== 'NONE',
          isDetected: true
        };

      } else {
        controlsRef.current.isDetected = false;
        controlsRef.current.isFlying = false;
        setGesture('NONE');
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (handLandmarker) handLandmarker.close();
      cancelAnimationFrame(animationFrameId);
    };
  }, [controlsRef]);

  return (
    <div className="absolute bottom-4 right-4 z-50 w-48 h-36 bg-black/50 rounded-xl overflow-hidden border border-white/20 shadow-lg">
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100 opacity-50"
        autoPlay
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        width={640}
        height={480}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-xs">
          Init Vision...
        </div>
      )}
      {!loading && (
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <span className={`text-xs font-bold px-2 py-1 rounded ${gesture !== 'NONE' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
            {gesture === 'NONE' ? 'HOVER' : `FLY: ${gesture}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default HandController;