import { useEffect, useRef, useState } from "react";
import useMotionDetection from "../hooks/useMotionDetection";
import usePoseDetection from "../hooks/usePoseDetection";

function Camera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const lastAuraTimeRef = useRef(0);

  const [cameraError, setCameraError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [aura, setAura] = useState(0);
  const [combo, setCombo] = useState(0);
  const [displayMotion, setDisplayMotion] = useState(0);

  const motion = useMotionDetection(videoRef, cameraReady);

  const poseData = usePoseDetection(
  videoRef,
  cameraReady
);

  // ==========================================
  // MOVIMIENTO MOSTRADO
  // ==========================================

  useEffect(() => {
    setDisplayMotion((previous) => {
      return Math.round(
        previous * 0.7 + motion * 0.3
      );
    });
  }, [motion]);

  // ==========================================
  // SISTEMA DE AURA
  // ==========================================

  useEffect(() => {
    if (motion < 10) {
      return;
    }

    const now = Date.now();

    if (
      now - lastAuraTimeRef.current <
      200
    ) {
      return;
    }

    lastAuraTimeRef.current = now;

    const baseAura = Math.floor(
      motion * 0.2
    );

    const multiplier =
      1 + combo * 0.03;

    const auraGain = Math.max(
      1,
      Math.floor(
        baseAura * multiplier
      )
    );

    setAura(
      (previous) =>
        previous + auraGain
    );

    setCombo(
      (previous) =>
        Math.min(
          previous + 0.25,
          20
        )
    );
  }, [motion]);

  // ==========================================
  // DIBUJAR ESQUELETO
  // ==========================================
useEffect(() => {
  const canvas = canvasRef.current;
  const video = videoRef.current;

  if (!canvas || !video || !poseData?.smoothedLandmarks) {
    return;
  }

  const ctx = canvas.getContext("2d");

  const drawPose = () => {
    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // ==================================
    // CONEXIONES DEL CUERPO
    // ==================================

    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 7],

      [0, 4],
      [4, 5],
      [5, 6],
      [6, 8],

      [9, 10],

      [11, 12],

      [11, 13],
      [13, 15],

      [12, 14],
      [14, 16],

      [11, 23],
      [12, 24],

      [23, 24],

      [23, 25],
      [25, 27],

      [24, 26],
      [26, 28],

      [27, 29],
      [29, 31],

      [28, 30],
      [30, 32],
    ];

    // ==================================
    // FUNCIÓN PARA CONVERTIR COORDENADAS
    // ==================================

    const getPoint = (landmark) => {
      return {
        x: landmark.x * videoWidth,
        y: landmark.y * videoHeight,
      };
    };

    // ==================================
    // LÍNEAS
    // ==================================

    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;

    connections.forEach(([start, end]) => {
    const a = poseData.smoothedLandmarks[start];
    const b = poseData.smoothedLandmarks[end];
      if (!a || !b) return;

      const pointA = getPoint(a);
      const pointB = getPoint(b);

      ctx.beginPath();

      ctx.moveTo(
        pointA.x,
        pointA.y
      );

      ctx.lineTo(
        pointB.x,
        pointB.y
      );

      ctx.stroke();
    });

    // ==================================
    // PUNTOS
    // ==================================

    poseData.smoothedLandmarks.forEach((landmark) => {
      const point = getPoint(landmark);

      ctx.beginPath();

      ctx.arc(
        point.x,
        point.y,
        5,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2;

      ctx.stroke();
    });
  };

  drawPose();

}, [poseData]);

  // ==========================================
  // CÁMARA
  // ==========================================

  useEffect(() => {
    let stream;

    const startCamera =
      async () => {
        try {
          stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: true,
                audio: false,
              }
            );

          if (
            videoRef.current
          ) {
            videoRef.current.srcObject =
              stream;
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
        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );
      }
    };
  }, []);

  // ==========================================
  // ESTADO
  // ==========================================

  const getMotionState =
    () => {
      if (
        displayMotion < 3
      ) {
        return "🗿 QUIETO";
      }

      if (
        displayMotion < 8
      ) {
        return "👋 MOVIMIENTO";
      }

      if (
        displayMotion < 15
      ) {
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
          ⚡ COMBO x
          {Math.max(
            Math.floor(combo),
            1
          )}
        </span>

      </div>

      <div className="camera-container">

        {cameraError ? (
          <p>
            No pudimos acceder
            a tu cámara 📷
          </p>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedData={() =>
                setCameraReady(true)
              }
            />

            <canvas
              ref={canvasRef}
              className="pose-canvas"
            />
          </>
        )}

      </div>

      {/* PANEL DE CALIBRACIÓN */}

      <div className="debug-panel">

        <div>
          <span>
            MOVIMIENTO
          </span>

          <strong>
            {displayMotion}
          </strong>
        </div>

        <div>
          <span>
            COMBO
          </span>

          <strong>
            x
            {Math.max(
              Math.floor(combo),
              1
            )}
          </strong>
        </div>

        <div>
          <span>
            ESTADO
          </span>

          <strong>
            {getMotionState()}
          </strong>
        </div>

      </div>

      <div className="pose-debug">

  <div>
    <span>CABEZA</span>
    <strong>
      {poseData
        ? poseData.head.toFixed(3)
        : "0.000"}
    </strong>
  </div>

  <div>
    <span>MANO IZQ.</span>
    <strong>
      {poseData
        ? poseData.leftHand.toFixed(3)
        : "0.000"}
    </strong>
  </div>

  <div>
    <span>MANO DER.</span>
    <strong>
      {poseData
        ? poseData.rightHand.toFixed(3)
        : "0.000"}
    </strong>
  </div>

  <div>
    <span>BRAZO IZQ.</span>
    <strong>
      {poseData
        ? poseData.leftArm.toFixed(3)
        : "0.000"}
    </strong>
  </div>

  <div>
    <span>BRAZO DER.</span>
    <strong>
      {poseData
        ? poseData.rightArm.toFixed(3)
        : "0.000"}
    </strong>
  </div>

  <div>
    <span>TORSO</span>
    <strong>
      {poseData
        ? poseData.torso.toFixed(3)
        : "0.000"}
    </strong>
  </div>

</div>

      <p className="camera-message">
        🗿 Muévete para generar
        aura...
      </p>

    </section>
  );
}

export default Camera;