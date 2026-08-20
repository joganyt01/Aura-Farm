function GameObject({
  image,
  x,
  y,
  name,
  onClick,
}) {
  const left = (x / 900) * 100;
  const top = (y / 500) * 100;

  return (
    <img
      src={image}
      alt={name}
      onClick={onClick}
      style={{
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: "80px",
        userSelect: "none",
        cursor: "pointer",
      }}
      draggable="false"
    />
  );
}

export default GameObject;