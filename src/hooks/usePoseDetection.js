import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

function usePoseDetection(videoRef, cameraReady) {
  const [landmarks, setLandmarks] = useState(null);
  const poseLandmarkerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!cameraReady) return;

    let cancelled = false;

    const initializePose = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
        );

        const poseLandmarker =
          await PoseLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              },

              runningMode: "VIDEO",

              numPoses: 1,

              minPoseDetectionConfidence: 0.5,
              minPosePresenceConfidence: 0.5,
              minTrackingConfidence: 0.5,
            }
          );

        if (cancelled) {
          poseLandmarker.close();
          return;
        }

        poseLandmarkerRef.current = poseLandmarker;

        detectPose();
      } catch (error) {
        console.error(
          "Error iniciando Pose Landmarker:",
          error
        );
      }
    };

    const detectPose = () => {
      const video = videoRef.current;
      const landmarker = poseLandmarkerRef.current;

      if (
        !video ||
        !landmarker ||
        video.readyState < 2
      ) {
        animationRef.current =
          requestAnimationFrame(detectPose);

        return;
      }

      const timestamp = performance.now();

      const result =
        landmarker.detectForVideo(
          video,
          timestamp
        );

      if (result.landmarks?.length > 0) {
        setLandmarks(result.landmarks[0]);
      }

      animationRef.current =
        requestAnimationFrame(detectPose);
    };

    initializePose();

    return () => {
      cancelled = true;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
    };
  }, [cameraReady, videoRef]);

  return landmarks;
}

export default usePoseDetection;