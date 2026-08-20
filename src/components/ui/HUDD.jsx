function HUD({ score, lives }) {
  return (
    <header className="hud">
      <h1>🌱 Atrapa al Puerro</h1>

      <div className="stats">
        <span>⭐ Puntos: {score}</span>
      <span>❤️ Vidas: {lives}</span>
      </div>
    </header>
  );
}

export default HUD;