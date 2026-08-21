import { useState } from "react";
import StartScreen from "./components/StartScreen";
import Camera from "./components/Camera";
import "./App.css";

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <main className="app">
      {!gameStarted ? (
        <StartScreen onStart={() => setGameStarted(true)} />
      ) : (
        <Camera />
      )}
    </main>
  );
}

export default App;