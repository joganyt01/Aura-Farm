import { useEffect, useRef, useState } from "react";
import useMotionDetection from "../hooks/useMotionDetection";
import usePoseDetection from "../hooks/usePoseDetection";
import AuraEffects from "./AuraEffects";

function Camera({
  gameState,
  pose,
  poseNumber,
  totalPoses,
  timeLeft,
  onPoseComplete,
}) {
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
  // SISTEMA DE AURA CORPORAL
  // ==========================================

  useEffect(() => {
    if (!poseData) {
      return;
    }

    const now = Date.now();

    if (
      now - lastAuraTimeRef.current < 200
    ) {
      return;
    }

    // ========================================
    // MOVIMIENTO DE CADA ZONA
    // ========================================

    const head =
      poseData.head || 0;

    const leftHand =
      poseData.leftHand || 0;

    const rightHand =
      poseData.rightHand || 0;

    const leftArm =
      poseData.leftArm || 0;

    const rightArm =
      poseData.rightArm || 0;

    const torso =
      poseData.torso || 0;

    const leftLeg =
      poseData.leftLeg || 0;

    const rightLeg =
      poseData.rightLeg || 0;

    // ========================================
    // POTENCIA CORPORAL
    // ========================================

    const bodyPower =
      head * 1 +
      leftHand * 2 +
      rightHand * 2 +
      leftArm * 3 +
      rightArm * 3 +
      torso * 2 +
      leftLeg * 2 +
      rightLeg * 2;

    // ========================================
    // COMBINAR CON MOVIMIENTO DE CÁMARA
    // ========================================

    const cameraPower =
      motion * 0.15;

    const totalPower =
      bodyPower * 100 +
      cameraPower;

    // ========================================
    // FILTRO
    // ========================================

    if (totalPower < 3) {
      return;
    }

    lastAuraTimeRef.current = now;

    // ========================================
    // MULTIPLICADOR DE COMBO
    // ========================================

    const multiplier =
      1 + combo * 0.03;

    // ========================================
    // AURA GENERADA
    // ========================================

    const auraGain = Math.max(
      1,
      Math.floor(
        totalPower * 0.2 * multiplier
      )
    );

    setAura(
      (previous) =>
        previous + auraGain
    );

    // ========================================
    // COMBO
    // ========================================

    setCombo(
      (previous) =>
        Math.min(
          previous + 0.25,
          20
        )
    );

  }, [poseData, motion, combo]);
  // ==========================================
  // DIBUJAR ESQUELETO
  // ==========================================

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (
      !canvas ||
      !video ||
      !poseData?.smoothedLandmarks
    ) {
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

      const getPoint = (landmark) => {
        return {
          x: landmark.x * videoWidth,
          y: landmark.y * videoHeight,
        };
      };

      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 3;

      connections.forEach(([start, end]) => {
        const a =
          poseData.smoothedLandmarks[start];

        const b =
          poseData.smoothedLandmarks[end];

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

      poseData.smoothedLandmarks.forEach(
        (landmark) => {
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
        }
      );
    };

    drawPose();
  }, [poseData]);

  // ==========================================
  // CÁMARA
  // ==========================================

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: false,
            }
          );

        if (videoRef.current) {
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
          .forEach((track) =>
            track.stop()
          );
      }
    };
  }, []);

  // ==========================================
  // ESTADO
  // ==========================================

  const getMotionState = () => {
    if (displayMotion < 3) {
      return "🗿 QUIETO";
    }

    if (displayMotion < 8) {
      return "👋 MOVIMIENTO";
    }

    if (displayMotion < 15) {
      return "🔥 MOVIMIENTO FUERTE";
    }

    return "⚡ MOVIMIENTO EXTREMO";
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <section className="camera-screen">

      <div className="camera-container">

        {cameraError ? (
          <div className="camera-error">
            <p>
              No pudimos acceder
              a tu cámara 📷
            </p>
          </div>
        ) : (
          <>
            {/* =========================
                CÁMARA
            ========================= */}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedData={() =>
                setCameraReady(true)
              }
            />

            {/* =========================
                ESQUELETO
            ========================= */}

            <canvas
              ref={canvasRef}
              className="pose-canvas"
            />

            {/* =========================
                EFECTOS
            ========================= */}

            <AuraEffects
              poseData={poseData}
              motion={displayMotion}
            />

            {/* =========================
                HUD DEL JUEGO
            ========================= */}

            <div className="game-hud">

              {/* AURA */}

              <div className="hud-challenge">
                <span>
                  POSE {poseNumber} / {totalPoses}
                </span>

                <strong>
                  {pose?.emoji} {pose?.name}
                </strong>

                <small>
                  {gameState === "countdown"
                    ? "PREPÁRATE"
                    : "¡HAZ LA POSE!"}
                </small>
              </div>

              <div className="hud-timer">
                {timeLeft}s
              </div>

              <div className="hud-aura">
                <span>AURA</span>

                <strong>
                  {aura.toLocaleString()}
                </strong>
              </div>

              {/* COMBO */}

              <div className="hud-combo">
                ⚡ COMBO x
                {Math.max(
                  Math.floor(combo),
                  1
                )}
              </div>

              {/* MOVIMIENTO */}

              <div className="hud-motion">

                <span>
                  MOVIMIENTO
                </span>

                <strong>
                  {displayMotion}
                </strong>

              </div>

              {/* ESTADO */}

              <div className="hud-state">
                {getMotionState()}
              </div>

            </div>

            {gameState === "playing" && (
              <button
                className="debug-pose-button"
                onClick={onPoseComplete}
              >
                ✅ SIMULAR POSE
              </button>
            )}

          </>
        )}

      </div>

      {/* =========================
          MENSAJE
      ========================= */}

      <p className="camera-message">
        🗿 Muévete para generar aura...
      </p>

    </section>
  );
}

export default Camera;