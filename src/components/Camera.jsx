import { useEffect, useRef, useState } from "react";
import useMotionDetection from "../hooks/useMotionDetection";

function Camera() {
  const videoRef = useRef(null);
const lastAuraTimeRef = useRef(0);
  const [cameraError, setCameraError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [aura, setAura] = useState(0);
  const [combo, setCombo] = useState(0);

  const motion = useMotionDetection(videoRef, cameraReady);
useEffect(() => {
  if (motion < 10) {
    setCombo((previous) => Math.max(previous - 1, 0));
    return;
  }

  const now = Date.now();

  // Solo permitimos ganar aura cada 120 ms
  if (now - lastAuraTimeRef.current < 120) {
    return;
  }

  lastAuraTimeRef.current = now;

  const baseAura = Math.floor(motion * 0.8);

  const multiplier = 1 + combo * 0.05;

  const auraGain = Math.floor(baseAura * multiplier);

  setAura((previous) => previous + auraGain);

  setCombo((previous) => Math.min(previous + 1, 20));
}, [motion, combo]);

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

        <div className="debug-panel">
  <div>
    <span>MOVIMIENTO</span>
    <strong>{motion}</strong>
  </div>

  <div>
    <span>COMBO</span>
    <strong>x{Math.max(combo, 1)}</strong>
  </div>

  <div>
    <span>ESTADO</span>

    <strong>
      {motion < 10
        ? "🗿 QUIETO"
        : motion < 30
        ? "👋 MOVIMIENTO"
        : motion < 60
        ? "🔥 MOVIMIENTO FUERTE"
        : "⚡ MOVIMIENTO EXTREMO"}
    </strong>
  </div>
</div>
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