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

  useEffect(() => {
    if (!cameraReady) return;

    let cancelled = false;

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
        const currentPoint =
          current[index];

        const previousPoint =
          previous[index];

        if (
          !currentPoint ||
          !previousPoint
        ) {
          return;
        }

        total += calculateDistance(
          currentPoint,
          previousPoint
        );

        count++;
      });

      if (count === 0) return 0;

      return total / count;
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

        const previous =
          previousLandmarksRef.current;

        // ==================================
        // MOVIMIENTO POR ZONAS
        // ==================================

        const headMovement =
          calculateZoneMovement(
            landmarks,
            previous,
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
          );

        const leftArmMovement =
          calculateZoneMovement(
            landmarks,
            previous,
            [11, 13, 15]
          );

        const rightArmMovement =
          calculateZoneMovement(
            landmarks,
            previous,
            [12, 14, 16]
          );

        const torsoMovement =
          calculateZoneMovement(
            landmarks,
            previous,
            [11, 12, 23, 24]
          );

        const leftLegMovement =
          calculateZoneMovement(
            landmarks,
            previous,
            [23, 25, 27]
          );

        const rightLegMovement =
          calculateZoneMovement(
            landmarks,
            previous,
            [24, 26, 28]
          );

        // ==================================
        // MANOS
        // ==================================

        const leftHandMovement =
          calculateZoneMovement(
            landmarks,
            previous,
            [15]
          );

        const rightHandMovement =
          calculateZoneMovement(
            landmarks,
            previous,
            [16]
          );

        // ==================================
        // GUARDAR
        // ==================================

        setPoseData({
          landmarks,

          head: headMovement,

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
          landmarks;
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