import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSmudgeBrush } from "../smudgeBrush";
import savedStrokes from "../spoilerStrokes.json";

const REVEAL_MS = 1600; // the last letter starts appearing within this long
const BRUSH_EM = 2; // smudge brush width, in letter heights
const INK = "#6b6b6b"; // the page text's own grey
// the un-smudge: one wiping stroke per line of text, right to left
const UNSMUDGE_LINE_MS = 650; // each line's stroke
const UNSMUDGE_STAGGER_MS = 420; // the next line's stroke starts this soon after
const RUB_EM = 3.2; // rub-to-reveal eraser width, in letter heights
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
  // the text as it looks unsmudged, and the rows it sits on, for the un-smudge
  const cleanRef = useRef(null);
  const rowsRef = useRef([]);
  const [unsmudged, setUnsmudged] = useState(false);
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
      // whole pixels, overlapping the next row, so no empty seam is left for
      // the brush to drag along as a line
      const top = Math.floor(row.top);
      ctx.fillRect(
        Math.floor(row.left - padLeft),
        top,
        Math.ceil(row.right - row.left + padLeft + padRight),
        Math.ceil(bottom) - top + 2
      );
    });

    // the clean copy starts from the same white rows; it gets the letters exactly
    // as the page draws them (no extra outline), so the hand-off at the end of
    // the un-smudge to the real text is seamless
    const clean = document.createElement("canvas");
    clean.width = canvas.width;
    clean.height = canvas.height;
    const cleanCtx = clean.getContext("2d");
    cleanCtx.drawImage(canvas, 0, 0);
    cleanRef.current = clean;
    rowsRef.current = sorted;

    ctx.fillStyle = INK;
    ctx.font = g.font;
    cleanCtx.fillStyle = INK;
    cleanCtx.font = g.font;
    cleanCtx.textBaseline = "alphabetic";
    ctx.textBaseline = "alphabetic";
    ctx.strokeStyle = INK;
    ctx.lineWidth = g.em * 0.06;
    ctx.lineJoin = "round";
    const probe = ctx.measureText("Hg");
    g.chars.forEach((c) => {
      if (!c.char.trim()) return;
      // sit each letter on the same baseline the page uses for it
      const baseline =
        c.y + (c.h + probe.fontBoundingBoxAscent - probe.fontBoundingBoxDescent) / 2;
      ctx.fillText(c.char, c.x, baseline);
      cleanCtx.fillText(c.char, c.x, baseline);
      // a hairline outline in the same grey makes the letters a touch heavier,
      // so there's more ink than white to smudge
      ctx.strokeText(c.char, c.x, baseline);
    });

    brushRef.current = createSmudgeBrush(ctx, {
      size: g.em * BRUSH_EM,
      // dabs close together, so fast strokes don't leave faint ridges
      spacing: 0.04,
    });
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


  // take back the last stroke: forget it, then redraw from the ones left
  const undoStroke = useCallback(() => {
    if (!strokesRef.current.length) return;
    const next = strokesRef.current.slice(0, -1);
    strokesRef.current = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {}
    setStrokeCount(next.length);
    render();
  }, [render]);

  // Ctrl+Z (Cmd+Z on a Mac) undoes, in the studio
  useEffect(() => {
    if (!studio) return undefined;
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoStroke();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [studio, undoStroke]);

  // write the strokes into src/spoilerStrokes.json (dev server only), so every
  // visitor sees this smudge
  const [saveNote, setSaveNote] = useState("");
  const saveToSite = async () => {
    try {
      const response = await fetch("/__studio/spoiler-strokes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strokesRef.current),
      });
      const result = await response.json();
      setSaveNote(response.ok ? `Saved ${result.saved} strokes to the site.` : result.error);
    } catch (err) {
      setSaveNote("Couldn't save; is npm start running?");
    }
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

  // un-smudge: each line gets one stroke, right to left, that wipes the smudge
  // back to clean letters. A line's stroke covers the full width and everything
  // from its top to the next line's (the first and last reach the canvas edges),
  // so paint that ran off the edges is wiped up too. Then the real text takes over
  const unsmudge = () => {
    const canvas = canvasRef.current;
    const clean = cleanRef.current;
    const rows = rowsRef.current;
    if (!canvas || !clean || !rows.length) {
      setRevealed(true);
      return;
    }
    const ctx = canvas.getContext("2d");
    const bands = rows.map((row, n) => ({
      top: n === 0 ? 0 : Math.floor(row.top),
      bottom: n === rows.length - 1 ? canvas.height : Math.ceil(rows[n + 1].top) + 1,
      wiped: canvas.width, // everything right of this is already clean
    }));
    const feather = geometry.current.em * 1.5;
    const start = performance.now();
    const step = (now) => {
      let done = true;
      bands.forEach((band, n) => {
        const t = (now - start - n * UNSMUDGE_STAGGER_MS) / UNSMUDGE_LINE_MS;
        if (t <= 0) {
          done = false;
          return;
        }
        const eased = 1 - Math.pow(1 - Math.min(1, t), 2);
        const x = canvas.width - eased * (canvas.width + feather);
        const height = band.bottom - band.top;
        // fully clean behind the stroke...
        if (x < band.wiped) {
          ctx.save();
          ctx.globalCompositeOperation = "copy";
          ctx.beginPath();
          ctx.rect(x, band.top, band.wiped - x, height);
          ctx.clip();
          ctx.drawImage(clean, 0, 0);
          ctx.restore();
          band.wiped = x;
        }
        // ...and a soft leading edge just ahead of it
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.rect(x - feather, band.top, feather, height);
        ctx.clip();
        ctx.drawImage(clean, 0, 0);
        ctx.restore();
        if (t < 1) done = false;
      });
      if (done) {
        setUnsmudged(true);
        setRevealed(true);
      } else {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  // --- rub to reveal: dragging over the smudge wipes it away where you rub ---

  const rubRef = useRef(null); // { last, moved } while a rub is underway
  const rubbedRef = useRef(false); // the pointer dragged, so the click isn't a tap
  const rubTools = useRef(null);

  // a soft round eraser that paints the clean text back through a feathered mask
  const rubAt = (point) => {
    const canvas = canvasRef.current;
    const clean = cleanRef.current;
    if (!canvas || !clean) return;
    const size = Math.round(geometry.current.em * RUB_EM);
    if (!rubTools.current || rubTools.current.size !== size) {
      const dab = document.createElement("canvas");
      dab.width = dab.height = size;
      const mask = document.createElement("canvas");
      mask.width = mask.height = size;
      const maskCtx = mask.getContext("2d");
      const r = size / 2;
      const falloff = maskCtx.createRadialGradient(r, r, 0, r, r, r);
      falloff.addColorStop(0, "rgba(0, 0, 0, 1)");
      falloff.addColorStop(0.6, "rgba(0, 0, 0, 0.7)");
      falloff.addColorStop(1, "rgba(0, 0, 0, 0)");
      maskCtx.fillStyle = falloff;
      maskCtx.fillRect(0, 0, size, size);
      rubTools.current = { size, dab, dabCtx: dab.getContext("2d"), mask };
    }
    const { dab, dabCtx, mask } = rubTools.current;
    const left = point.x - size / 2;
    const top = point.y - size / 2;
    dabCtx.globalCompositeOperation = "copy";
    dabCtx.drawImage(clean, left, top, size, size, 0, 0, size, size);
    dabCtx.globalCompositeOperation = "destination-in";
    dabCtx.drawImage(mask, 0, 0);
    const ctx = canvas.getContext("2d");
    ctx.globalAlpha = 0.9;
    ctx.drawImage(dab, left, top);
    ctx.globalAlpha = 1;
  };

  const canRub = usesCanvas && !studio && !revealed;

  // whether a point (canvas pixels) is on the spoiler: anywhere from its first
  // line to its last, gaps between lines included, but not on the words that
  // share its first and last lines
  const inSpoiler = (point) => {
    const rows = rowsRef.current;
    if (!rows.length) return false;
    const first = rows[0];
    const last = rows[rows.length - 1];
    if (point.y < first.top || point.y > last.top + last.h) return false;
    if (point.y < first.top + first.h && point.x < first.left) return false;
    if (point.y > last.top && point.x > last.right) return false;
    return true;
  };

  // outside the paragraph, a rub only starts where the smudge left paint
  const hasPaintAt = (point) => {
    const canvas = canvasRef.current;
    if (point.x < 0 || point.y < 0 || point.x >= canvas.width || point.y >= canvas.height) {
      return false;
    }
    return canvas.getContext("2d").getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data[3] > 0;
  };

  const startsRub = (event) => {
    const point = pointFrom(event);
    if (inSpoiler(point)) return true;
    const paragraph = canvasRef.current.parentElement.getBoundingClientRect();
    const outside =
      event.clientX < paragraph.left ||
      event.clientX > paragraph.right ||
      event.clientY < paragraph.top ||
      event.clientY > paragraph.bottom;
    return outside && hasPaintAt(point);
  };

  const handleRubDown = (event) => {
    if (!canRub || !startsRub(event)) return;
    event.preventDefault();
    rubbedRef.current = false;
    // listening on the window, the rub keeps following the pointer anywhere
    rubRef.current = { last: pointFrom(event), startX: event.clientX, startY: event.clientY };
  };

  const handleRubMove = (event) => {
    const rub = rubRef.current;
    if (!rub) return;
    if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
      rubRef.current = null;
      return;
    }
    // a few pixels of slack, so a slightly shaky tap still counts as a tap
    if (!rubbedRef.current && Math.hypot(event.clientX - rub.startX, event.clientY - rub.startY) < 6) {
      return;
    }
    rubbedRef.current = true;
    const point = pointFrom(event);
    const dx = point.x - rub.last.x;
    const dy = point.y - rub.last.y;
    const distance = Math.hypot(dx, dy);
    const spacing = geometry.current.em * RUB_EM * 0.15;
    for (let d = 0; d <= distance; d += spacing) {
      rubAt({ x: rub.last.x + (dx * d) / distance || rub.last.x, y: rub.last.y + (dy * d) / distance || rub.last.y });
    }
    rub.last = point;
  };

  // a press and release without dragging is a tap: play the un-smudge
  const handleRubUp = () => {
    const wasPress = rubRef.current && !rubbedRef.current;
    rubRef.current = null;
    rubbedRef.current = false;
    if (wasPress) reveal();
  };

  // the rub listens on the whole page, so pressing between the spoiler's lines,
  // or on paint smudged past the paragraph, works too; handlersRef keeps the
  // listeners pointing at this render's handlers
  const handlersRef = useRef({});
  handlersRef.current = { down: handleRubDown, move: handleRubMove, up: handleRubUp };
  useEffect(() => {
    if (!canRub || !canvasRef.current) return undefined;
    const area = canvasRef.current.parentElement;
    const down = (e) => handlersRef.current.down(e);
    const move = (e) => handlersRef.current.move(e);
    const up = (e) => handlersRef.current.up(e);
    area.classList.add("rub-area");
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      area.classList.remove("rub-area");
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [canRub]);

  const reveal = () => {
    if (studio || revealed) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (usesCanvas && !reduceMotion) unsmudge();
    else setRevealed(true);
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
    unsmudged && "is-unsmudged",
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
              title: "Rub or tap to reveal",
              "aria-label": "Spoiler, hidden. Press to reveal.",
              // without the smudge canvas, a click reveals; with it, the
              // paragraph's rub handlers turn a tap into the un-smudge
              onClick: usesCanvas ? undefined : reveal,
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
            unsmudged && "is-unsmudged",
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
          <button type="button" onClick={undoStroke} disabled={!strokeCount}>
            Undo (⌘/Ctrl+Z)
          </button>
          <button type="button" onClick={clearStudio}>
            Start over
          </button>
          <button type="button" onClick={saveToSite} disabled={!strokeCount}>
            Save to site
          </button>
          {saveNote && <span className="spoiler-studio-note"> {saveNote}</span>}
        </span>
      )}
    </>
  );
};

export default SmudgedSpoiler;
