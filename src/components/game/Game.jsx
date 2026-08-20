import { useState } from "react";
import "../../styles/Game.css";
import GameObject from "./GameObject";
import { gameObjects } from "../../data/gameObjects";

function Game({ onCatch, onMistake, gameOver, onRestart }) {
const getRandomPosition = (
  objectsToAvoid = [],
  previousPosition = null
) => {
  const objectSize = 80;
  const minDistance = 150;

  const maxX = 900 - objectSize;
  const maxY = 500 - objectSize;

  let newPosition;
  let validPosition = false;

  while (!validPosition) {
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);

    newPosition = { x, y };

    validPosition = objectsToAvoid.every((object) => {
      const distanceX = Math.abs(x - object.x);
      const distanceY = Math.abs(y - object.y);

      return distanceX > 100 || distanceY > 100;
    });

    if (validPosition && previousPosition) {
      const distanceX = Math.abs(
        x - previousPosition.x
      );

      const distanceY = Math.abs(
        y - previousPosition.y
      );

      if (distanceX < minDistance && distanceY < minDistance) {
        validPosition = false;
      }
    }
  }

  return newPosition;
};

  const [objects, setObjects] = useState(gameObjects);

  const catchObject = (object) => {

    if (gameOver) {
      return;
    }

    if (object.name === "davo") {
     const vegetables = objects.filter(
  (item) => item.name !== "davo"
);

const newPosition = getRandomPosition(
  vegetables,
  object
);

      setObjects((currentObjects) =>
        currentObjects.map((item) => {
          if (item.id === object.id) {
            return {
              ...item,
              x: newPosition.x,
              y: newPosition.y,
            };
          }

          return item;
        })
      );

      onCatch();
    } else {
      onMistake();
    }
  };

 return (
    <main className="game">

      {gameOver && (
        <div className="game-over">
          <h2>GAME OVER</h2>
          <p>¡Se acabaron las vidas!</p>

          <button onClick={onRestart}>
     -       JUGAR DE NUEVO
          </button>
        </div>
      )}

      {objects.map((object) => (
        <GameObject
          key={object.id}
          image={object.image}
          x={object.x}
          y={object.y}
          name={object.name}
          onClick={() => catchObject(object)}
        />
      ))}

    </main>
  
);
}

export default Game;