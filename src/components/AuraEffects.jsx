import { useEffect, useRef } from "react";

function AuraEffects({ poseData, motion }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !poseData?.smoothedLandmarks) {
      return;
    }

    const ctx = canvas.getContext("2d");

    const draw = () => {
      const video = canvas.parentElement?.querySelector("video");

      if (!video) {
        requestAnimationFrame(draw);
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        requestAnimationFrame(draw);
        return;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      const landmarks =
        poseData.smoothedLandmarks;

      // =====================================
      // POSICIONES
      // =====================================

      const leftHand =
        landmarks[15];

      const rightHand =
        landmarks[16];

      const leftWrist =
        landmarks[15];

      const rightWrist =
        landmarks[16];

      const leftShoulder =
        landmarks[11];

      const rightShoulder =
        landmarks[12];

      const nose =
        landmarks[0];

      if (
        !leftHand ||
        !rightHand ||
        !nose
      ) {
        requestAnimationFrame(draw);
        return;
      }

      const getPoint = (point) => ({
        x: point.x * width,
        y: point.y * height,
      });

      // =====================================
      // NIVEL DE AURA
      // =====================================

      const auraPower =
        Math.min(motion / 20, 1);

      // =====================================
      // PARTÍCULAS
      // =====================================

      if (motion > 3) {
        const spawnAmount =
          Math.floor(
            auraPower * 3
          ) + 1;

        for (
          let i = 0;
          i < spawnAmount;
          i++
        ) {
          const source =
            Math.random() > 0.5
              ? leftHand
              : rightHand;

          const point =
            getPoint(source);

          particlesRef.current.push({
            x: point.x,
            y: point.y,

            vx:
              (Math.random() - 0.5) *
              3,

            vy:
              (Math.random() - 0.5) *
              3,

            life: 1,

            size:
              Math.random() * 4 + 2,
          });
        }
      }

      // =====================================
      // DIBUJAR PARTÍCULAS
      // =====================================

      particlesRef.current =
        particlesRef.current.filter(
          (particle) => {
            particle.x +=
              particle.vx;

            particle.y +=
              particle.vy;

            particle.life -= 0.025;

            if (
              particle.life <= 0
            ) {
              return false;
            }

            ctx.globalAlpha =
              particle.life;

            ctx.beginPath();

            ctx.arc(
              particle.x,
              particle.y,
              particle.size,
              0,
              Math.PI * 2
            );

            ctx.fillStyle =
              "#ffffff";

            ctx.shadowBlur = 15;

            ctx.shadowColor =
              "#00ffff";

            ctx.fill();

            ctx.shadowBlur = 0;

            return true;
          }
        );

      ctx.globalAlpha = 1;

      // =====================================
      // AURA ALREDEDOR DE LA CABEZA
      // =====================================

      if (motion > 3) {
        const head =
          getPoint(nose);

        const radius =
          35 +
          auraPower * 35;

        ctx.beginPath();

        ctx.arc(
          head.x,
          head.y,
          radius,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle =
          `rgba(0,255,255,${0.2 + auraPower * 0.5})`;

        ctx.lineWidth = 3;

        ctx.shadowBlur = 25;

        ctx.shadowColor =
          "#00ffff";

        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      // =====================================
      // RAYOS DE LAS MANOS
      // =====================================

      if (motion > 5) {
        drawLightning(
          ctx,
          getPoint(leftHand),
          auraPower
        );

        drawLightning(
          ctx,
          getPoint(rightHand),
          auraPower
        );
      }

      requestAnimationFrame(draw);
    };

    const drawLightning = (
      ctx,
      point,
      power
    ) => {
      const length =
        30 +
        power * 80;

      ctx.beginPath();

      ctx.moveTo(
        point.x,
        point.y
      );

      let currentX =
        point.x;

      let currentY =
        point.y;

      const segments = 5;

      for (
        let i = 0;
        i < segments;
        i++
      ) {
        currentX +=
          (Math.random() - 0.5) *
          30;

        currentY -=
          length / segments;

        ctx.lineTo(
          currentX,
          currentY
        );
      }

      ctx.strokeStyle =
        "#ffffff";

      ctx.lineWidth =
        2 + power * 3;

      ctx.shadowBlur = 20;

      ctx.shadowColor =
        "#00ffff";

      ctx.stroke();

      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

  }, [poseData, motion]);

  return (
    <canvas
      ref={canvasRef}
      className="aura-effects"
    />
  );
}

export default AuraEffects;