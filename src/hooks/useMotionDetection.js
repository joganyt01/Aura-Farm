import { useEffect, useRef, useState } from "react";

function useMotionDetection(videoRef, isReady) {
  const [motion, setMotion] = useState(0);

  const previousFrameRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isReady) return;

    const video = videoRef.current;

    if (!video) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    canvas.width = 160;
    canvas.height = 90;

    const detectMotion = () => {
      if (
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const currentFrame = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        if (previousFrameRef.current) {
          const previousFrame = previousFrameRef.current;

          let difference = 0;

          for (let i = 0; i < currentFrame.data.length; i += 16) {
            const rDiff = Math.abs(
              currentFrame.data[i] - previousFrame[i]
            );

            const gDiff = Math.abs(
              currentFrame.data[i + 1] - previousFrame[i + 1]
            );

            const bDiff = Math.abs(
              currentFrame.data[i + 2] - previousFrame[i + 2]
            );

            difference += (rDiff + gDiff + bDiff) / 3;
          }

          const pixels = currentFrame.data.length / 16;

          const movement = difference / pixels;

          setMotion(Math.min(Math.round(movement), 100));
        }

        previousFrameRef.current = currentFrame.data;
      }

      animationRef.current = requestAnimationFrame(detectMotion);
    };

    detectMotion();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [videoRef, isReady]);

  return motion;
}

export default useMotionDetection;