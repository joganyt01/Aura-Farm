import { useEffect, useRef, useState } from "react";
import useMotionDetection from "../hooks/useMotionDetection";

function Camera() {
  const videoRef = useRef(null);

  const [cameraError, setCameraError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const motion = useMotionDetection(videoRef, cameraReady);

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("No se pudo acceder a la cámara:", error);
        setCameraError(true);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <section className="camera-screen">
      <div className="aura-header">
        <p>AURA</p>
        <h2>{motion}</h2>
      </div>

      <div className="camera-container">
        {cameraError ? (
          <p>No pudimos acceder a tu cámara 📷</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => setCameraReady(true)}
          />
        )}
      </div>

      <p className="camera-message">
        🗿 Muévete para generar aura...
      </p>
    </section>
  );
}

export default Camera;