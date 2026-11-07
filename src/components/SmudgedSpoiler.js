import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSmudgeBrush } from "../smudgeBrush";
import savedStrokes from "../spoilerStrokes.json";

const REVEAL_MS = 1600; // the last letter starts appearing within this long
const BRUSH_EM = 2; // smudge brush width, in letter heights
const INK = "#6b6b6b"; // the page text's own grey
const STORAGE_KEY = "spoilerStrokes"; // studio strokes, kept in this browser

// open the page with #studio to smudge the spoiler yourself
const inStudio = () => window.location.hash === "#studio";

const loadStudioStrokes = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || [];
  } catch (err) {
    return [];
  }
};

// Text hidden under a smudge of its own ink. The smudge is the artist's own:
// strokes recorded in studio mode (#studio) and saved in spoilerStrokes.json,
// replayed on a canvas over the text. Each stroke point is stored relative to
// the letter it was nearest, so the smudge follows the text when it rewraps on
// a different screen. Tapping brings the letters back one at a time, in a
// random order, as the smudge fades away.
const SmudgedSpoiler = ({ text }) => {
  const studio = useMemo(inStudio, []);
  const [revealed, setRevealed] = useState(false);
  const [strokes] = useState(() =>
    studio ? loadStudioStrokes() : savedStrokes
  );
  const spanRef = useRef(null);
  const canvasRef = useRef(null);
  const brushRef = useRef(null);
  const currentStroke = useRef(null);
  const geometry = useRef(null);
  // every stroke so far (saved, plus new ones made in the studio); render()
  // replays these
  const strokesRef = useRef(strokes);
  const [strokeCount, setStrokeCount] = useState(strokes.length);

  // each letter's own moment to appear, picked once
  const delays = useMemo(
    () => Array.from(text, () => Math.round(Math.random() * REVEAL_MS)),
    [text]
  );

  const usesCanvas = studio || strokes.length > 0;

  // where each letter sits, in canvas pixels, plus the font to draw it with
  const measure = useCallback(() => {
    const span = spanRef.current;
    const canvas = canvasRef.current;
    const box = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const style = getComputedStyle(span);
    const fontSize = parseFloat(style.fontSize);
    const chars = [...span.querySelectorAll(".spoiler-char")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        char: el.textContent,
        x: (r.left - box.left) * scale,
        y: (r.top - box.top) * scale,
        w: r.width * scale,
        h: r.height * scale,
      };
    });
    return {
      box,
      scale,
      em: fontSize * scale,
      font: `${style.fontWeight} ${fontSize * scale}px ${style.fontFamily}`,
      chars,
    };
  }, []);

  // a stored point (nearest letter + offset in ems) back to canvas pixels
  const toCanvas = (g, { i, dx, dy }) => {
    const c = g.chars[Math.min(i, g.chars.length - 1)];
    return { x: c.x + dx * g.em, y: c.y + dy * g.em };
  };

  // a canvas point to its nearest letter + offset in ems, so it survives rewrapping
  const toStored = (g, point) => {
    let best = 0;
    let bestDistance = Infinity;
    g.chars.forEach((c, i) => {
      const cx = Math.max(c.x, Math.min(point.x, c.x + c.w));
      const cy = Math.max(c.y, Math.min(point.y, c.y + c.h));
      const d = Math.hypot(point.x - cx, point.y - cy);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    const c = g.chars[best];
    return {
      i: best,
      dx: +((point.x - c.x) / g.em).toFixed(3),
      dy: +((point.y - c.y) / g.em).toFixed(3),
    };
  };

  // draw the letters onto the canvas, then smudge them with every saved stroke
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spanRef.current) return;
    const g = measure();
    geometry.current = g;
    canvas.width = Math.round(g.box.width * g.scale);
    canvas.height = Math.round(g.box.height * g.scale);
    const ctx = canvas.getContext("2d");

    // the spoiler's rows, each painted in the page's white down to the next
    // row, so the paint is continuous and one line can be dragged into another.
    // Nothing is clipped: a stroke can carry paint off the edges onto the page
    const rows = new Map();
    g.chars.forEach((c) => {
      const key = Math.round(c.y);
      const row = rows.get(key) || { left: c.x, right: c.x + c.w, top: c.y, h: c.h };
      row.left = Math.min(row.left, c.x);
      row.right = Math.max(row.right, c.x + c.w);
      rows.set(key, row);
    });
    const sorted = [...rows.values()].sort((a, b) => a.top - b.top);
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor || "#ffffff";
    sorted.forEach((row, n) => {
      const next = sorted[n + 1];
      const bottom = next ? next.top : row.top + row.h;
      // a little extra white at the paragraph's edges, but none where the
      // spoiler meets the words before and after it on the same line
      const pad = g.em * 0.35;
      const padLeft = n === 0 ? 0 : pad;
      const padRight = n === sorted.length - 1 ? 0 : pad;
      ctx.fillRect(
        row.left - padLeft,
        row.top,
        row.right - row.left + padLeft + padRight,
        bottom - row.top
      );
    });

    ctx.fillStyle = INK;
    ctx.font = g.font;
    ctx.textBaseline = "alphabetic";
    const probe = ctx.measureText("Hg");
    g.chars.forEach((c) => {
      if (!c.char.trim()) return;
      // sit each letter on the same baseline the page uses for it
      const baseline =
        c.y + (c.h + probe.fontBoundingBoxAscent - probe.fontBoundingBoxDescent) / 2;
      ctx.fillText(c.char, c.x, baseline);
    });

    brushRef.current = createSmudgeBrush(ctx, { size: g.em * BRUSH_EM });
    strokesRef.current.forEach((stroke) => {
      if (!stroke.length) return;
      brushRef.current.start(toCanvas(g, stroke[0]));
      stroke.slice(1).forEach((p) => brushRef.current.moveTo(toCanvas(g, p)));
      brushRef.current.end();
    });
  }, [measure]);

  useEffect(() => {
    if (!usesCanvas) return undefined;
    render();
    if (document.fonts) document.fonts.ready.then(render);
    const observer = new ResizeObserver(() => render());
    observer.observe(canvasRef.current.parentElement);
    return () => observer.disconnect();
  }, [usesCanvas, render]);

  // --- studio: smudge it yourself ---

  const pointFrom = (event) => {
    const g = geometry.current;
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * g.scale, y: (event.clientY - rect.top) * g.scale };
  };

  const handlePointerDown = (event) => {
    if (!studio) return;
    event.preventDefault();
    try {
      canvasRef.current.setPointerCapture(event.pointerId);
    } catch (err) {}
    const point = pointFrom(event);
    brushRef.current.start(point);
    currentStroke.current = [toStored(geometry.current, point)];
  };

  const handlePointerMove = (event) => {
    if (!studio || !currentStroke.current) return;
    if ((event.buttons & 1) === 0) {
      handlePointerUp();
      return;
    }
    const point = pointFrom(event);
    brushRef.current.moveTo(point);
    currentStroke.current.push(toStored(geometry.current, point));
  };

  const handlePointerUp = () => {
    if (!studio || !currentStroke.current) return;
    brushRef.current.end();
    const stroke = currentStroke.current;
    currentStroke.current = null;
    if (stroke.length < 2) return;
    // kept without re-rendering, since the stroke is already on the canvas
    const next = [...strokesRef.current, stroke];
    strokesRef.current = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {}
    setStrokeCount(next.length);
  };


  const clearStudio = () => {
    strokesRef.current = [];
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
    setStrokeCount(0);
    render();
  };

  // --- the reveal ---

  const reveal = () => {
    if (!studio) setRevealed(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      reveal();
    }
  };

  const className = [
    "spoiler",
    usesCanvas && "uses-canvas",
    revealed && "is-revealed",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <span
        ref={spanRef}
        className={className}
        {...(revealed || studio
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
      {usesCanvas && (
        <canvas
          ref={canvasRef}
          className={[
            "spoiler-canvas",
            studio && "is-studio",
            revealed && "is-revealed",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      )}
      {studio && (
        <span className="spoiler-studio" role="status">
          Studio: drag across the spoiler to smudge it. {strokeCount} strokes
          saved in this browser.{" "}
          <button type="button" onClick={clearStudio}>
            Start over
          </button>
        </span>
      )}
    </>
  );
};

export default SmudgedSpoiler;
