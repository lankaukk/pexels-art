import React from "react";

// a word whose letters bob up and down one after another, like iMessage's
// "ripple" text effect; each letter starts a beat after the one before it
const RippleText = ({ children }) => (
  <span className="ripple" aria-label={children}>
    {Array.from(children, (char, i) => (
      <span
        key={i}
        className="ripple-char"
        aria-hidden="true"
        style={{ "--i": i }}
      >
        {char}
      </span>
    ))}
  </span>
);

export default RippleText;
