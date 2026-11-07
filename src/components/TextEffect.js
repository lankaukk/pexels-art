import React from "react";

// iMessage-style text effects ("bloom", "small"): each letter animates on its
// own, a beat after the one before it (see .effect-* in style.css)
const TextEffect = ({ effect, children }) => (
  <span className={`effect effect-${effect}`} aria-label={children}>
    {Array.from(children, (char, i) => (
      <span
        key={i}
        className="effect-char"
        aria-hidden="true"
        style={{ "--i": i }}
      >
        {char === " " ? " " : char}
      </span>
    ))}
  </span>
);

export default TextEffect;
