import React, { Component, createRef } from "react";

const PIXEL_COUNT = 144; // 16 x 9, or 9 x 16 on portrait screens
const REVEAL_MS = 2400; // a new artwork takes this long to fully paint in
const FADE_MS = 300; // each pixel eases into its color over this long
const BLANK_COLOR = "rgb(202, 174, 129)"; // the empty canvas, as in style.css

// smudge brush: 1.5 pixel squares across. Each dab lays down some of the paint
// the brush is carrying, then the brush picks up a little of what's beneath it,
// so color drags along the stroke and fades out, like Photoshop's smudge tool
const BRUSH_CELLS = 1.5;
// fingers smudge with at least a thumb-sized brush, or the touch's own contact
// size where the device reports it
const THUMB_PX = 64;
const SMUDGE_STRENGTH = 0.55; // how much carried paint each dab lays down
const SMUDGE_PICKUP = 0.2; // how much of the canvas each dab mixes into the brush
const DAB_SPACING = 0.08; // distance between dabs, as a share of the brush size

const PORTRAIT = "(orientation: portrait)";

// every pixel position in a random order (Fisher-Yates shuffle)
const shuffledPositions = () => {
  const order = Array.from({ length: PIXEL_COUNT }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The artwork is drawn on a canvas so it can be smudged. A new artwork paints in
// over the last one, a pixel at a time in random order, covering any smudging
// beneath; until then the previous artwork (and its smudges) stays in the frame.
class PicList extends Component {
  canvasRef = createRef();
  ringRef = createRef();
  // the color each position settles on; null shows the blank canvas
  colors = Array(PIXEL_COUNT).fill(null);
  fades = []; // pixels currently easing in: { position, color, start, shown }
  pressure = 1; // the current stroke's pressure, as a multiple of normal strength

  componentDidMount() {
    const canvas = this.canvasRef.current;
    this.ctx = canvas.getContext("2d");
    this.portrait = window.matchMedia(PORTRAIT);
    this.portrait.addEventListener("change", this.redraw);
    this.resizeObserver = new ResizeObserver(this.resizeCanvas);
    this.resizeObserver.observe(canvas);
    this.resizeCanvas();
    if (this.props.pics.length > 0) this.reveal();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pics !== this.props.pics) this.reveal();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.portrait.removeEventListener("change", this.redraw);
  }

  // --- the grid ---

  grid() {
    return this.portrait.matches ? { cols: 9, rows: 16 } : { cols: 16, rows: 9 };
  }

  // a pixel's rectangle in canvas pixels, rounded so neighbors never leave seams
  cellRect(position) {
    const { width, height } = this.canvasRef.current;
    const { cols, rows } = this.grid();
    const col = position % cols;
    const row = Math.floor(position / cols);
    const x = Math.round((col * width) / cols);
    const y = Math.round((row * height) / rows);
    return {
      x,
      y,
      w: Math.round(((col + 1) * width) / cols) - x,
      h: Math.round(((row + 1) * height) / rows) - y,
    };
  }

  fillCell(position, color, alpha = 1) {
    const { x, y, w, h } = this.cellRect(position);
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color || BLANK_COLOR;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.globalAlpha = 1;
  }

  // repaint every pixel flat (used when the grid itself changes shape)
  redraw = () => {
    this.fades = [];
    this.colors.forEach((color, position) => this.fillCell(position, color));
  };

  // match the canvas to its on-screen size at full screen resolution, keeping
  // what's painted (smudges included) by scaling it into the new size
  resizeCanvas = () => {
    const canvas = this.canvasRef.current;
    const scale = window.devicePixelRatio || 1;
    const width = Math.round(canvas.clientWidth * scale);
    const height = Math.round(canvas.clientHeight * scale);
    if (!width || !height || (width === canvas.width && height === canvas.height)) return;

    const previous = document.createElement("canvas");
    previous.width = canvas.width;
    previous.height = canvas.height;
    previous.getContext("2d").drawImage(canvas, 0, 0);

    canvas.width = width;
    canvas.height = height;
    this.ctx.fillStyle = BLANK_COLOR;
    this.ctx.fillRect(0, 0, width, height);
    if (previous.width && previous.height) {
      this.ctx.drawImage(previous, 0, 0, width, height);
    }
  };

  // --- the reveal ---

  reveal() {
    cancelAnimationFrame(this.frame);
    const target = Array.from(
      { length: PIXEL_COUNT },
      (_, i) => (this.props.pics[i] && this.props.pics[i].avg_color) || null
    );
    this.colors = target;

    if (prefersReducedMotion()) {
      this.redraw();
      return;
    }

    const order = shuffledPositions();
    const start = performance.now();
    let started = 0;
    this.fades = [];

    const step = (now) => {
      // start the pixels whose turn has come
      const due = Math.min(
        PIXEL_COUNT,
        Math.ceil(((now - start) / REVEAL_MS) * PIXEL_COUNT)
      );
      for (; started < due; started++) {
        const position = order[started];
        this.fades.push({ position, color: target[position], start: now, shown: 0 });
      }

      // ease each pixel toward its color. Layering a little more paint each
      // frame (rather than redrawing) lets it cover whatever is beneath,
      // smudges included, while still blending with a stroke made mid-fade
      this.fades = this.fades.filter((fade) => {
        const progress = Math.min(1, (now - fade.start) / FADE_MS);
        const eased = 1 - Math.pow(1 - progress, 2);
        const alpha = fade.shown >= 1 ? 1 : (eased - fade.shown) / (1 - fade.shown);
        this.fillCell(fade.position, fade.color, alpha);
        fade.shown = eased;
        return progress < 1;
      });

      if (started < PIXEL_COUNT || this.fades.length > 0) {
        this.frame = requestAnimationFrame(step);
      }
    };
    this.frame = requestAnimationFrame(step);
  }

  // --- the smudge brush ---

  // brush diameter in on-screen (CSS) pixels: 1.5 pixel squares, and for a
  // finger at least a thumb, or the reported contact size if bigger
  brushCssSize(event) {
    const canvas = this.canvasRef.current;
    const cells = (canvas.clientWidth / this.grid().cols) * BRUSH_CELLS;
    if (event.pointerType !== "touch") return cells;
    const contact = Math.max(event.width || 0, event.height || 0) * 1.2;
    return Math.max(cells, THUMB_PX, contact);
  }

  // how hard the stroke presses, where the device reports it; mice and most
  // fingers report a flat 0.5 (or nothing), which smudges at normal strength
  pressureScale(event) {
    const reported = event.pressure;
    if (event.pointerType === "mouse" || !reported || reported === 0.5) return 1;
    return Math.min(1.6, Math.max(0.4, reported * 2));
  }

  // the brush carries paint in its own small canvas; a soft round mask gives
  // each dab feathered edges
  makeBrush(size) {
    if (this.brush && this.brush.width === size) return;
    this.brush = document.createElement("canvas");
    this.brush.width = this.brush.height = size;
    this.brushCtx = this.brush.getContext("2d");

    this.mask = document.createElement("canvas");
    this.mask.width = this.mask.height = size;
    const maskCtx = this.mask.getContext("2d");
    const r = size / 2;
    const falloff = maskCtx.createRadialGradient(r, r, 0, r, r, r);
    falloff.addColorStop(0, "rgba(0, 0, 0, 1)");
    falloff.addColorStop(0.55, "rgba(0, 0, 0, 0.8)");
    falloff.addColorStop(1, "rgba(0, 0, 0, 0)");
    maskCtx.fillStyle = falloff;
    maskCtx.fillRect(0, 0, size, size);

    this.dab = document.createElement("canvas");
    this.dab.width = this.dab.height = size;
    this.dabCtx = this.dab.getContext("2d");
  }

  // pointer position in canvas pixels
  canvasPoint(event) {
    const canvas = this.canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  // load the brush with the paint under it
  pickUp({ x, y }) {
    const size = this.brush.width;
    this.brushCtx.globalAlpha = 1;
    this.brushCtx.clearRect(0, 0, size, size);
    this.brushCtx.drawImage(
      this.canvasRef.current,
      x - size / 2, y - size / 2, size, size,
      0, 0, size, size
    );
  }

  // one dab: lay down carried paint through the soft mask, then mix a little of
  // the canvas here into the brush
  dabAt({ x, y }) {
    const size = this.brush.width;
    const left = x - size / 2;
    const top = y - size / 2;

    this.dabCtx.globalCompositeOperation = "copy";
    this.dabCtx.drawImage(this.brush, 0, 0);
    this.dabCtx.globalCompositeOperation = "destination-in";
    this.dabCtx.drawImage(this.mask, 0, 0);

    this.ctx.globalAlpha = Math.min(1, SMUDGE_STRENGTH * this.pressure);
    this.ctx.drawImage(this.dab, left, top);
    this.ctx.globalAlpha = 1;

    this.brushCtx.globalAlpha = SMUDGE_PICKUP;
    this.brushCtx.drawImage(
      this.canvasRef.current,
      left, top, size, size,
      0, 0, size, size
    );
    this.brushCtx.globalAlpha = 1;
  }

  handlePointerDown = (event) => {
    if (!this.colors.some(Boolean)) return; // nothing painted yet to smudge
    event.preventDefault();
    const canvas = this.canvasRef.current;
    // keeps the stroke going if the finger or mouse slips off the frame; not
    // essential, so a browser refusing it shouldn't stop the smudge
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (err) {}
    const scale = canvas.width / canvas.clientWidth;
    this.makeBrush(Math.max(4, Math.round(this.brushCssSize(event) * scale)));
    this.pressure = this.pressureScale(event);
    this.lastPoint = this.canvasPoint(event);
    this.pickUp(this.lastPoint);
    if (this.props.onSmudge) this.props.onSmudge();
  };

  handlePointerMove = (event) => {
    this.moveRing(event);
    if (!this.lastPoint) return;
    this.pressure = this.pressureScale(event);
    const point = this.canvasPoint(event);
    const dx = point.x - this.lastPoint.x;
    const dy = point.y - this.lastPoint.y;
    const distance = Math.hypot(dx, dy);
    const spacing = Math.max(1, this.brush.width * DAB_SPACING);
    // dabs evenly along the path, so fast strokes smear as smoothly as slow ones
    let travelled = spacing;
    for (; travelled <= distance; travelled += spacing) {
      const t = travelled / distance;
      this.dabAt({ x: this.lastPoint.x + dx * t, y: this.lastPoint.y + dy * t });
    }
    const used = travelled - spacing;
    if (used > 0 && this.props.onSmudge) this.props.onSmudge();
    if (used > 0) {
      this.lastPoint = {
        x: this.lastPoint.x + (dx * used) / distance,
        y: this.lastPoint.y + (dy * used) / distance,
      };
    }
  };

  handlePointerUp = () => {
    this.lastPoint = null;
  };

  // a faint outline of the brush follows the mouse (not shown for touch)
  moveRing = (event) => {
    const ring = this.ringRef.current;
    if (!ring) return;
    if (event.pointerType !== "mouse" || !this.colors.some(Boolean)) {
      ring.style.opacity = 0;
      return;
    }
    const canvas = this.canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const size = (rect.width / this.grid().cols) * BRUSH_CELLS;
    ring.style.width = ring.style.height = `${size}px`;
    ring.style.transform = `translate(${event.clientX - rect.left - size / 2}px, ${
      event.clientY - rect.top - size / 2
    }px)`;
    ring.style.opacity = 1;
  };

  hideRing = () => {
    if (this.ringRef.current) this.ringRef.current.style.opacity = 0;
  };

  render() {
    return (
      <div className="picCard">
        <canvas
          ref={this.canvasRef}
          className="picCanvas"
          onPointerDown={this.handlePointerDown}
          onPointerMove={this.handlePointerMove}
          onPointerUp={this.handlePointerUp}
          onPointerCancel={this.handlePointerUp}
          onPointerLeave={this.hideRing}
        />
        <div ref={this.ringRef} className="brush-ring" aria-hidden="true" />
      </div>
    );
  }
}

export default PicList;
