import { useState } from "react";

import "./App.css";

import HUD from "./components/ui/HUDD";
import Game from "./components/game/Game";

function App() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameKey, setGameKey] = useState(0);

  const handleCatch = () => {
    setScore((previousScore) => previousScore + 1);
  };
const handleMistake = () => {
  setLives((previousLives) => Math.max(previousLives - 1, 0));
};

const handleRestart = () => {
  setScore(0);
  setLives(3);
  setGameKey((previousKey) => previousKey + 1);
};

const gameOver = lives === 0;

  return (
    <>
      <HUD
        score={score}
        lives={lives}
      />

 <Game
  key={gameKey}
  onCatch={handleCatch}
  onMistake={handleMistake}
  gameOver={gameOver}
  onRestart={handleRestart}
/>
    </>
  );
}

export default App;