function StartScreen({ onStart }) {
  return (
    <section className="start-screen">
      <div className="start-content">
        <p className="eyebrow">⚡ AURA FARMER ⚡</p>

        <h1>FARMEA TU AURA</h1>

        <p className="description">
          Abre la cámara y demuestra cuánto aura tienes.
        </p>

        <button className="start-button" onClick={onStart}>
          📷 ABRIR CÁMARA
        </button>
      </div>
    </section>
  );
}

export default StartScreen;