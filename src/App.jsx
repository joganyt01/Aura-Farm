import { useEffect, useState } from "react";
import StartScreen from "./components/StartScreen";
import Camera from "./components/Camera";
import "./App.css";

const POSES = [
  {
    id: "mewing",
    name: "MEWING",
    emoji: "🗿",
  },
  {
    id: "six-seven",
    name: "SIX SEVEN",
    emoji: "✋",
  },
  {
    id: "banana",
    name: "BANANA SPEED",
    emoji: "🍌",
  },
];

const ROUND_TIME = 10;

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  const [gameState, setGameState] =
    useState("idle");

  const [currentPose, setCurrentPose] =
    useState(0);

  const [timeLeft, setTimeLeft] =
    useState(ROUND_TIME);

  // ==========================================
  // INICIAR PARTIDA
  // ==========================================

  const startGame = () => {
    setGameStarted(true);
    setCurrentPose(0);
    setTimeLeft(ROUND_TIME);

    setGameState("countdown");
  };

  // ==========================================
  // CUENTA REGRESIVA
  // ==========================================

  useEffect(() => {
    if (gameState !== "countdown") {
      return;
    }

    const timer = setTimeout(() => {
      setGameState("playing");
    }, 3000);

    return () => clearTimeout(timer);
  }, [gameState]);

  // ==========================================
  // TEMPORIZADOR DE RONDA
  // ==========================================

  useEffect(() => {
    if (gameState !== "playing") {
      return;
    }

    if (timeLeft <= 0) {
      setGameState("lost");
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(
        (previous) => previous - 1
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameState, timeLeft]);

  // ==========================================
  // COMPLETAR POSE
  // ==========================================

  const completePose = () => {
    if (gameState !== "playing") {
      return;
    }

    // Última pose
    if (
      currentPose ===
      POSES.length - 1
    ) {
      setGameState("won");
      return;
    }

    // Siguiente pose
    setCurrentPose(
      (previous) => previous + 1
    );

    setTimeLeft(ROUND_TIME);
  };

  // ==========================================
  // REINICIAR
  // ==========================================

  const restartGame = () => {
    setCurrentPose(0);
    setTimeLeft(ROUND_TIME);
    setGameState("countdown");
  };

  // ==========================================
  // PANTALLA INICIAL
  // ==========================================

  if (!gameStarted) {
    return (
      <main className="app">
        <StartScreen
          onStart={startGame}
        />
      </main>
    );
  }

  // ==========================================
  // VICTORIA
  // ==========================================

  if (gameState === "won") {
    return (
      <main className="app">
        <section className="game-result">
          <div className="result-content">
            <span className="result-emoji">
              🏆
            </span>

            <h1>
              AURA MASTER
            </h1>

            <p>
              ¡Completaste todas las poses!
            </p>

            <button
              onClick={restartGame}
            >
              JUGAR DE NUEVO
            </button>
          </div>
        </section>
      </main>
    );
  }

  // ==========================================
  // DERROTA
  // ==========================================

  if (gameState === "lost") {
    return (
      <main className="app">
        <section className="game-result">
          <div className="result-content">
            <span className="result-emoji">
              💀
            </span>

            <h1>
              AURA LOST
            </h1>

            <p>
              Se acabó el tiempo.
            </p>

            <button
              onClick={restartGame}
            >
              INTENTAR DE NUEVO
            </button>
          </div>
        </section>
      </main>
    );
  }

  // ==========================================
  // JUEGO
  // ==========================================

  const pose = POSES[currentPose];

  return (
    <main className="app">
      <Camera
        gameState={gameState}
        pose={pose}
        poseNumber={currentPose + 1}
        totalPoses={POSES.length}
        timeLeft={timeLeft}
        onPoseComplete={completePose}
      />
    </main>
  );
}

export default App;