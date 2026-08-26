import { useEffect, useRef, useState } from "react";
import {
    FilesetResolver,
    PoseLandmarker,
} from "@mediapipe/tasks-vision";

function usePoseDetection(videoRef, cameraReady) {
    const [poseData, setPoseData] = useState(null);

    const poseLandmarkerRef = useRef(null);
    const animationRef = useRef(null);

    const previousLandmarksRef = useRef(null);
    const smoothedLandmarksRef = useRef(null);

    useEffect(() => {
        if (!cameraReady) return;

        let cancelled = false;

        const calculateDistance = (a, b) => {
            if (!a || !b) return 0;

            const dx = a.x - b.x;
            const dy = a.y - b.y;

            return Math.sqrt(
                dx * dx + dy * dy
            );
        };

      const calculateZoneMovement = (
  current,
  previous,
  indexes
) => {
  if (!previous) return 0;

  let total = 0;
  let count = 0;

  indexes.forEach((index) => {
    const currentPoint = current[index];
    const previousPoint = previous[index];

    if (!currentPoint || !previousPoint) {
      return;
    }

    // Ignorar puntos con poca confianza
    if (
      currentPoint.visibility !== undefined &&
      currentPoint.visibility < 0.5
    ) {
      return;
    }

    const dx =
      currentPoint.x - previousPoint.x;

    const dy =
      currentPoint.y - previousPoint.y;

    const distance = Math.sqrt(
      dx * dx + dy * dy
    );

    total += distance;
    count++;
  });

  if (count === 0) return 0;

  const movement = total / count;

  // FILTRO DE MICRO-MOVIMIENTOS
  if (movement < 0.015) {
    return 0;
  }

  return movement;
};

        const initializePose = async () => {
            try {
                const vision =
                    await FilesetResolver.forVisionTasks(
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

                poseLandmarkerRef.current =
                    poseLandmarker;

                detectPose();

            } catch (error) {
                console.error(
                    "Error iniciando Pose Landmarker:",
                    error
                );
            }
        };

        const detectPose = () => {
            const video =
                videoRef.current;

            const landmarker =
                poseLandmarkerRef.current;

            if (
                !video ||
                !landmarker ||
                video.readyState < 2
            ) {
                animationRef.current =
                    requestAnimationFrame(
                        detectPose
                    );

                return;
            }

            const timestamp =
                performance.now();

            const result =
                landmarker.detectForVideo(
                    video,
                    timestamp
                );

            if (
                result.landmarks &&
                result.landmarks.length > 0
            ) {
                const landmarks =
                    result.landmarks[0];

                // ==================================
// SUAVIZADO DE LANDMARKS
// ==================================

let smoothedLandmarks =
  smoothedLandmarksRef.current;

if (!smoothedLandmarks) {
  smoothedLandmarks =
    landmarks.map((point) => ({
      ...point,
    }));

  smoothedLandmarksRef.current =
    smoothedLandmarks;
} else {
  smoothedLandmarks =
    landmarks.map((point, index) => {
      const previous =
        smoothedLandmarks[index];

      const smoothing = 0.25;

      return {
        ...point,

        x:
          previous.x +
          (point.x - previous.x) *
            smoothing,

        y:
          previous.y +
          (point.y - previous.y) *
            smoothing,
      };
    });

  smoothedLandmarksRef.current =
    smoothedLandmarks;
}

                const previous =
                    previousLandmarksRef.current;

                // ==================================
                // CABEZA
                // ==================================

                const headMovement =
                    calculateZoneMovement(
                        smoothedLandmarks,
                        previous,
                        [
                            0,
                            1,
                            2,
                            3,
                            4,
                            5,
                            6,
                            7,
                            8,
                            9,
                            10,
                        ]
                    );

                // ==================================
                // MANOS
                // ==================================

                const leftHandMovement =
                    calculateZoneMovement(
                        smoothedLandmarks,
                        previous,
                        [15]
                    );

                const rightHandMovement =
                    calculateZoneMovement(
                        smoothedLandmarks,
                        previous,
                        [16]
                    );

                // ==================================
                // BRAZOS
                // ==================================

                const leftArmMovement =
                    calculateZoneMovement(
                        smoothedLandmarks,
                        previous,
                        [11, 13, 15]
                    );

                const rightArmMovement =
                    calculateZoneMovement(
                        smoothedLandmarks,
                        previous,
                        [12, 14, 16]
                    );

                // ==================================
                // TORSO
                // ==================================

                const torsoMovement =
                    calculateZoneMovement(
                        smoothedLandmarks,
                        previous,
                        [11, 12, 23, 24]
                    );

                // ==================================
                // PIERNAS
                // ==================================

                const leftLegMovement =
                    calculateZoneMovement(
                        smoothedLandmarks,
                        previous,
                        [23, 25, 27]
                    );

                const rightLegMovement =
                    calculateZoneMovement(
                        smoothedLandmarks,
                        previous,
                        [24, 26, 28]
                    );

                // ==================================
                // GUARDAR DATOS
                // ==================================

                setPoseData({
                    smoothedLandmarks,

                    head:
                        headMovement,

                    leftHand:
                        leftHandMovement,

                    rightHand:
                        rightHandMovement,

                    leftArm:
                        leftArmMovement,

                    rightArm:
                        rightArmMovement,

                    torso:
                        torsoMovement,

                    leftLeg:
                        leftLegMovement,

                    rightLeg:
                        rightLegMovement,
                });

               previousLandmarksRef.current =
  smoothedLandmarks;
            }

            animationRef.current =
                requestAnimationFrame(
                    detectPose
                );
        };

        initializePose();

        return () => {
            cancelled = true;

            if (animationRef.current) {
                cancelAnimationFrame(
                    animationRef.current
                );
            }

            if (
                poseLandmarkerRef.current
            ) {
                poseLandmarkerRef.current.close();

                poseLandmarkerRef.current =
                    null;
            }

            previousLandmarksRef.current =
                null;
        };
    }, [cameraReady, videoRef]);

    return poseData;
}

export default usePoseDetection;