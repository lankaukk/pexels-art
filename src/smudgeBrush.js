// A smudge brush for a 2D canvas, like Photoshop's smudge tool: each dab lays
// down some of the paint the brush is carrying through a soft round mask, then
// picks up a little of what's beneath, so color drags along the stroke and
// fades out. (PicList.js has its own copy, tuned for the artwork.)

const makeCanvas = (size) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  return canvas;
};

export const createSmudgeBrush = (
  ctx,
  { size, strength = 0.6, pickup = 0.2, spacing = 0.08 }
) => {
  size = Math.max(4, Math.round(size));
  const brush = makeCanvas(size);
  const brushCtx = brush.getContext("2d");
  const mask = makeCanvas(size);
  const maskCtx = mask.getContext("2d");
  const dab = makeCanvas(size);
  const dabCtx = dab.getContext("2d");

  const r = size / 2;
  const falloff = maskCtx.createRadialGradient(r, r, 0, r, r, r);
  falloff.addColorStop(0, "rgba(0, 0, 0, 1)");
  falloff.addColorStop(0.55, "rgba(0, 0, 0, 0.8)");
  falloff.addColorStop(1, "rgba(0, 0, 0, 0)");
  maskCtx.fillStyle = falloff;
  maskCtx.fillRect(0, 0, size, size);

  const step = Math.max(1, size * spacing);
  let last = null;

  const dabAt = ({ x, y }) => {
    const left = x - r;
    const top = y - r;
    dabCtx.globalCompositeOperation = "copy";
    dabCtx.drawImage(brush, 0, 0);
    dabCtx.globalCompositeOperation = "destination-in";
    dabCtx.drawImage(mask, 0, 0);

    ctx.globalAlpha = strength;
    ctx.drawImage(dab, left, top);
    ctx.globalAlpha = 1;

    brushCtx.globalAlpha = pickup;
    brushCtx.drawImage(ctx.canvas, left, top, size, size, 0, 0, size, size);
    brushCtx.globalAlpha = 1;
  };

  return {
    // put the brush down: load it with the paint beneath
    start(point) {
      brushCtx.globalAlpha = 1;
      brushCtx.clearRect(0, 0, size, size);
      brushCtx.drawImage(ctx.canvas, point.x - r, point.y - r, size, size, 0, 0, size, size);
      last = point;
    },
    // drag to a new point, dabbing evenly along the way
    moveTo(point) {
      if (!last) return;
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      const distance = Math.hypot(dx, dy);
      let travelled = step;
      for (; travelled <= distance; travelled += step) {
        const t = travelled / distance;
        dabAt({ x: last.x + dx * t, y: last.y + dy * t });
      }
      const used = travelled - step;
      if (used > 0) {
        last = { x: last.x + (dx * used) / distance, y: last.y + (dy * used) / distance };
      }
    },
    end() {
      last = null;
    },
  };
};
