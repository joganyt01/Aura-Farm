import { useEffect, useRef, useState } from "react";
import useMotionDetection from "../hooks/useMotionDetection";

function Camera() {
  const videoRef = useRef(null);

  const [cameraError, setCameraError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [aura, setAura] = useState(0);
  const [combo, setCombo] = useState(0);

  const motion = useMotionDetection(videoRef, cameraReady);

  useEffect(() => {
    // Ignoramos el ruido normal de la cámara
    if (motion < 8) {
      setCombo((previous) => Math.max(previous - 1, 0));
      return;
    }

    // El movimiento aumenta el combo
    setCombo((previous) => Math.min(previous + 1, 20));

    // Convertimos movimiento en aura
    const auraGain = Math.floor(motion * (1 + combo * 0.1));

    setAura((previous) => previous + auraGain);
  }, [motion]);

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

        <h2>
          {aura.toLocaleString()}
        </h2>

        <span>
          ⚡ COMBO x{Math.max(combo, 1)}
        </span>
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