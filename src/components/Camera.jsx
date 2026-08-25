import { useEffect, useRef, useState } from "react";
import useMotionDetection from "../hooks/useMotionDetection";

function Camera() {
  const videoRef = useRef(null);
  const lastAuraTimeRef = useRef(0);

  const [cameraError, setCameraError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [aura, setAura] = useState(0);
  const [combo, setCombo] = useState(0);
  const [displayMotion, setDisplayMotion] = useState(0);

  const motion = useMotionDetection(videoRef, cameraReady);

  // ==========================================
  // MOVIMIENTO MOSTRADO
  // ==========================================
useEffect(() => {
  setDisplayMotion((previous) => {
    // Suavizado del movimiento mostrado
    return Math.round(previous * 0.7 + motion * 0.3);
  });
}, [motion]);
  // ==========================================
  // SISTEMA DE AURA
  // ==========================================

  useEffect(() => {
    // Menos de 10 = ruido normal de cámara
    if (motion < 10) {
      return;
    }

    const now = Date.now();

    // Ganar aura máximo unas 5 veces por segundo
    if (now - lastAuraTimeRef.current < 200) {
      return;
    }

    lastAuraTimeRef.current = now;

    /*
      Convertimos el movimiento en aura.

      10 movimiento → ~2 aura
      30 movimiento → ~6 aura
      60 movimiento → ~12 aura
      100 movimiento → ~20 aura
    */

    const baseAura = Math.floor(motion * 0.2);

    // Combo mucho más suave
    const multiplier = 1 + combo * 0.03;

    const auraGain = Math.max(
      1,
      Math.floor(baseAura * multiplier)
    );

    setAura((previous) => previous + auraGain);

    // El combo sube lentamente
   setCombo((previous) =>
  Math.min(previous + 0.25, 20)
);
  }, [motion]);

  // ==========================================
  // CÁMARA
  // ==========================================

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
        console.error(
          "No se pudo acceder a la cámara:",
          error
        );

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

  // ==========================================
  // ESTADO DEL MOVIMIENTO
  // ==========================================

  const getMotionState = () => {
    if (displayMotion < 10) {
      return "🗿 QUIETO";
    }

    if (displayMotion < 30) {
      return "👋 MOVIMIENTO";
    }

    if (displayMotion < 60) {
      return "🔥 MOVIMIENTO FUERTE";
    }

    return "⚡ MOVIMIENTO EXTREMO";
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <section className="camera-screen">

      <div className="aura-header">

        <p>AURA</p>

        <h2>
          {aura.toLocaleString()}
        </h2>

        <span className="combo-display">
          ⚡ COMBO x{Math.max(combo, 1)}
        </span>

      </div>

      <div className="camera-container">

        {cameraError ? (
          <p>
            No pudimos acceder a tu cámara 📷
          </p>
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

      {/* PANEL DE CALIBRACIÓN */}

      <div className="debug-panel">

        <div>
          <span>MOVIMIENTO</span>
          <strong>{displayMotion}</strong>
        </div>

        <div>
          <span>COMBO</span>
          <strong>
            x{Math.max(combo, 1)}
          </strong>
        </div>

        <div>
          <span>ESTADO</span>
          <strong>
            {getMotionState()}
          </strong>
        </div>

      </div>

      <p className="camera-message">
        🗿 Muévete para generar aura...
      </p>

    </section>
  );
}

export default Camera;