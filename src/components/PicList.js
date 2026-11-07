import React, { Component } from "react";

const PIXEL_COUNT = 144; // 16 x 9 (or 9 x 16 on portrait screens)
const REVEAL_MS = 2400; // a new artwork takes this long to fully paint in

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
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A new artwork paints in over the last one, one pixel at a time in a random
// order; until then the previous artwork stays in the frame.
class PicList extends Component {
  state = {
    // the color showing at each position; null shows the blank canvas
    shown: Array(PIXEL_COUNT).fill(null),
  };

  componentDidMount() {
    if (this.props.pics.length > 0) this.reveal();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pics !== this.props.pics) this.reveal();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.frame);
  }

  reveal() {
    cancelAnimationFrame(this.frame);
    const target = Array.from(
      { length: PIXEL_COUNT },
      (_, i) => (this.props.pics[i] && this.props.pics[i].avg_color) || null
    );

    if (prefersReducedMotion()) {
      this.setState({ shown: target });
      return;
    }

    const order = shuffledPositions();
    const start = performance.now();
    let painted = 0;

    const step = (now) => {
      const due = Math.min(
        PIXEL_COUNT,
        Math.ceil(((now - start) / REVEAL_MS) * PIXEL_COUNT)
      );
      if (due > painted) {
        const positions = order.slice(painted, due);
        painted = due;
        this.setState(({ shown }) => {
          const next = shown.slice();
          positions.forEach((position) => {
            next[position] = target[position];
          });
          return { shown: next };
        });
      }
      if (painted < PIXEL_COUNT) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  render() {
    return (
      <div className="picCard">
        {/* pixel sizes live in style.css so portrait screens can wrap them 9 across */}
        {this.state.shown.map((color, index) => (
          <div
            key={index}
            className="pexel"
            style={{ backgroundColor: color || "transparent" }}
          ></div>
        ))}
      </div>
    );
  }
}

export default PicList;
