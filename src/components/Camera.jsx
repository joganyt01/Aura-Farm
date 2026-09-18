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
  const mewingCompletedRef = useRef(false);

  const sixSevenLastYRef = useRef(null);
  const sixSevenPhaseRef = useRef(0);

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

  const [mewingDetected, setMewingDetected] = useState(false);

  const [sixSevenDirection, setSixSevenDirection] = useState("QUIETO");

  useEffect(() => {
    if (!poseData?.hands?.length) {
      return;
    }

    poseData.hands.forEach((hand, index) => {
      const wrist = hand[0];
      const indexTip = hand[8];

      console.log(
        `MANO ${index + 1}`,
        "Muñeca:",
        wrist,
        "Punta índice:",
        indexTip
      );

    });
  }, [poseData?.hands]);

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

  // DETECCIÓN MEWING
  useEffect(() => {
    if (!poseData?.hands?.length || !poseData?.smoothedLandmarks) {
      setMewingDetected(false);
      return;
    }

    const mouthLeft = poseData.smoothedLandmarks[9];
    const mouthRight = poseData.smoothedLandmarks[10];

    if (!mouthLeft || !mouthRight) {
      setMewingDetected(false);
      return;
    }

    const mouthCenter = {
      x: (mouthLeft.x + mouthRight.x) / 2,
      y: (mouthLeft.y + mouthRight.y) / 2,
    };

    let detected = false;

    poseData.hands.forEach((hand) => {
      const wrist = hand[0];
      const indexTip = hand[8];
      const middleTip = hand[12];
      const ringTip = hand[16];
      const pinkyTip = hand[20];

      if (
        !wrist ||
        !indexTip ||
        !middleTip ||
        !ringTip ||
        !pinkyTip
      ) {
        return;
      }

      const distance = (a, b) => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return Math.sqrt(dx * dx + dy * dy);
      };

      const mouthDistance = distance(indexTip, mouthCenter);

      const indexDistance = distance(wrist, indexTip);
      const middleDistance = distance(wrist, middleTip);
      const ringDistance = distance(wrist, ringTip);
      const pinkyDistance = distance(wrist, pinkyTip);

      const indexExtended =
        indexDistance > middleDistance * 1.5 &&
        indexDistance > ringDistance * 1.5 &&
        indexDistance > pinkyDistance * 1.5;

      const fingerNearMouth = mouthDistance < 0.13;

      if (indexExtended && fingerNearMouth) {
        detected = true;
      }
    });

    setMewingDetected(detected);

    if (detected && gameState === "playing" && pose?.id === "mewing") {
      if (!mewingCompletedRef.current) {
        mewingCompletedRef.current = true;
        onPoseComplete();
      }
    }
  }, [poseData]);
  //detecccion d emewing
  useEffect(() => {
    if (pose?.id !== "mewing") {
      mewingCompletedRef.current = false;
    }
  }, [pose]);

 // DETECCIÓN SIX SEVEN
useEffect(() => {
  if (!poseData?.hands || poseData.hands.length < 2) {
    setSixSevenDirection("NECESITAS 2 MANOS");
    return;
  }

  const hand1 = poseData.hands[0];
  const hand2 = poseData.hands[1];

  const wrist1 = hand1?.[0];
  const wrist2 = hand2?.[0];

  if (!wrist1 || !wrist2) return;

  const previous = sixSevenLastYRef.current;

  if (previous) {
    const movement1 = wrist1.y - previous.y1;
    const movement2 = wrist2.y - previous.y2;

    const threshold = 0.015;

    const hand1Up = movement1 < -threshold;
    const hand1Down = movement1 > threshold;

    const hand2Up = movement2 < -threshold;
    const hand2Down = movement2 > threshold;

    // Una mano sube mientras la otra baja
    if (hand1Up && hand2Down) {
      setSixSevenDirection("⬆️ IZQ / ⬇️ DER");
    }

    if (hand1Down && hand2Up) {
      setSixSevenDirection("⬇️ IZQ / ⬆️ DER");
    }
  }

  sixSevenLastYRef.current = {
    y1: wrist1.y,
    y2: wrist2.y,
  };
}, [poseData]);
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

      // ==================================
      // DEBUG MEWING
      // ==================================

      const drawDebugPoint = (
        landmark,
        color,
        radius = 10
      ) => {
        if (!landmark) return;

        const point = getPoint(landmark);

        ctx.beginPath();

        ctx.arc(
          point.x,
          point.y,
          radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = color;
        ctx.fill();
      };

      // TEMPORARY DEBUG DISTANCIA MEWING
      if (poseData.hands?.length) {
        poseData.hands.forEach((hand, index) => {
          const indexTip = hand[8];

          const mouthLeft =
            poseData.smoothedLandmarks[9];

          const mouthRight =
            poseData.smoothedLandmarks[10];

          if (
            indexTip &&
            mouthLeft &&
            mouthRight
          ) {
            const mouthCenter = {
              x:
                (mouthLeft.x +
                  mouthRight.x) /
                2,

              y:
                (mouthLeft.y +
                  mouthRight.y) /
                2,
            };

            const dx =
              indexTip.x -
              mouthCenter.x;

            const dy =
              indexTip.y -
              mouthCenter.y;

            const distance =
              Math.sqrt(
                dx * dx +
                dy * dy
              );

            console.log(
              `MEWING MANO ${index + 1} - DISTANCIA:`,
              distance.toFixed(3)
            );

            const wrist = hand[0];

            const indexDistance =
              Math.sqrt(
                Math.pow(hand[8].x - wrist.x, 2) +
                Math.pow(hand[8].y - wrist.y, 2)
              );

            const middleDistance =
              Math.sqrt(
                Math.pow(hand[12].x - wrist.x, 2) +
                Math.pow(hand[12].y - wrist.y, 2)
              );

            const ringDistance =
              Math.sqrt(
                Math.pow(hand[16].x - wrist.x, 2) +
                Math.pow(hand[16].y - wrist.y, 2)
              );

            const pinkyDistance =
              Math.sqrt(
                Math.pow(hand[20].x - wrist.x, 2) +
                Math.pow(hand[20].y - wrist.y, 2)
              );

            console.log(
              `MEWING MANO ${index + 1}`,
              "Índice:",
              indexDistance.toFixed(3),
              "Medio:",
              middleDistance.toFixed(3),
              "Anular:",
              ringDistance.toFixed(3),
              "Meñique:",
              pinkyDistance.toFixed(3)
            );
          }
        });
      }

      // PUNTA DEL ÍNDICE
      if (poseData.hands?.length) {
        poseData.hands.forEach((hand) => {
          drawDebugPoint(
            hand[8],
            "#ff0000",
            10
          );
        });
      }

      // ZONA DE LA CARA
      drawDebugPoint(
        poseData.smoothedLandmarks[0],
        "#0088ff",
        10
      );

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

              <div className="hud-mewing">
                {mewingDetected
                  ? "🔥 MEWING DETECTADO"
                  : "❌ MEWING NO DETECTADO"}
              </div>

              <div className="hud-six-seven">
                SIX SEVEN: {sixSevenDirection}
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