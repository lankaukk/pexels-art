import React, { useMemo, useState } from "react";

const REVEAL_MS = 1600; // the last letter starts appearing within this long

// Text hidden under a smudge of its own smeared ink. Tapping it brings the
// letters back one at a time, in a random order, as the smudge fades away.
const SmudgedSpoiler = ({ text }) => {
  const [revealed, setRevealed] = useState(false);

  // each letter's own moment to appear, picked once
  const delays = useMemo(
    () => Array.from(text, () => Math.round(Math.random() * REVEAL_MS)),
    [text]
  );

  const reveal = () => setRevealed(true);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      reveal();
    }
  };

  return (
    <span
      className={revealed ? "spoiler is-revealed" : "spoiler"}
      {...(revealed
        ? {}
        : {
            role: "button",
            tabIndex: 0,
            title: "Tap to reveal",
            "aria-label": "Spoiler, hidden. Press to reveal.",
            onClick: reveal,
            onKeyDown: handleKeyDown,
          })}
    >
      {Array.from(text, (char, i) => (
        <span
          key={i}
          className="spoiler-char"
          style={{ "--delay": `${delays[i]}ms` }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

export default SmudgedSpoiler;
