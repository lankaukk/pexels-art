import React, { Component, createRef } from "react";
// each example's 144 Pexels colors, fetched once and saved, so the demo
// paints real artworks without spending any API requests
import EXAMPLE_ART from "../exampleArt.json";

// ideas typed out in the empty blank, one at a time
const EXAMPLES = ["pipe", "ocean", "moonlight", "Venus flytrap"];
const TYPE_MS = 90; // per letter typed
// finished word stays up: long enough for its artwork to paint in (2.4s, see
// PicList.js) and then be looked at
const HOLD_MS = 5500;
const DELETE_MS = 50; // per letter deleted
const GAP_MS = 300; // empty blank before the first word
// after someone smudges an example's artwork, the examples wait at least this
// long past their last stroke before moving on
const SMUDGE_HOLD_MS = 4000;
// room inside the box, right of the text, for the Enter arrow (in em; matches
// .blank's padding-right in style.css)
const ENTER_ROOM = 0.75;
const LONGEST_EXAMPLE = EXAMPLES.reduce((a, b) => (b.length > a.length ? b : a));

class PicSearchPaginate extends Component {
  state = {
    query: "",
    pageIndex: 1,
    exampleIndex: 0,
    // how much of the current example is typed out
    typedLength: 0,
    // the person has typed (or used an example); examples stop until reload
    takenOver: false,
    // what the last artwork was made from, so the arrow can hide until it changes
    submitted: null,
  };

  entryRef = createRef();
  blankRef = createRef();
  sizerRef = createRef();
  minSizerRef = createRef();
  inputRef = createRef();

  componentDidMount() {
    // focused from the start, so the browser's own cursor blinks in the blank
    this.inputRef.current.focus({ preventScroll: true });
    this.scheduleTyping(GAP_MS);
    this.sizeBlank();
    // the script font loads after first paint and changes the text width
    if (document.fonts) document.fonts.ready.then(this.sizeBlank);
    // the font size and portrait/landscape width change with the window
    window.addEventListener("resize", this.sizeBlank);
  }

  componentDidUpdate() {
    this.sizeBlank();
  }

  componentWillUnmount() {
    clearTimeout(this.typingTimer);
    window.removeEventListener("resize", this.sizeBlank);
  }

  scheduleTyping = (delay) => {
    clearTimeout(this.typingTimer);
    this.nextStepAt = Date.now() + delay;
    this.typingTimer = setTimeout(this.stepTyping, delay);
  };

  // called on every smudge stroke: the typist pauses where it is and resumes
  // SMUDGE_HOLD_MS after the last stroke (or when it was due anyway, if later),
  // so the artwork isn't replaced while someone is still playing with it
  holdForSmudge = () => {
    if (this.state.takenOver) return;
    const remaining = (this.nextStepAt || 0) - Date.now();
    this.scheduleTyping(Math.max(remaining, SMUDGE_HOLD_MS));
  };

  // one keystroke of the fake typist: add a letter, hold, delete a letter,
  // or move on to the next word
  stepTyping = () => {
    const { exampleIndex, typedLength } = this.state;
    const word = EXAMPLES[exampleIndex];

    if (this.deleting) {
      if (typedLength > 1) {
        this.setState({ typedLength: typedLength - 1 });
        this.scheduleTyping(DELETE_MS);
      } else {
        // the last letter turns straight into the next word's first, so the
        // blank is never empty between examples
        this.deleting = false;
        this.setState({ exampleIndex: (exampleIndex + 1) % EXAMPLES.length, typedLength: 1 });
        this.scheduleTyping(TYPE_MS);
      }
    } else if (typedLength < word.length) {
      const finished = typedLength + 1 === word.length;
      this.setState({ typedLength: typedLength + 1 });
      // the word is "entered": its artwork paints into the frame
      if (finished) this.props.showExampleArt(EXAMPLE_ART[word]);
      this.scheduleTyping(finished ? HOLD_MS : TYPE_MS);
    } else {
      this.deleting = true;
      this.scheduleTyping(DELETE_MS);
    }
  };

  // the blank is as wide as its text, measured from a hidden copy. The blank
  // takes its new size at once, so a new letter is never clipped; the box around
  // it (.entry) eases to match, and the whole centered caption glides with it.
  // The Enter arrow hangs off the blank's end, outside the centered width
  // Text too long for one line wraps: the blank stops at the caption's full
  // width and grows taller instead
  sizeBlank = () => {
    const sizer = this.sizerRef.current;
    const blank = this.blankRef.current;
    const entry = this.entryRef.current;
    const field = this.inputRef.current;
    if (!sizer || !blank || !entry || !field) return;
    const fontSize = parseFloat(getComputedStyle(sizer).fontSize);
    const caption = entry.parentElement;
    // the widest the blank can be: the caption's own width
    const maxWidth = parseFloat(getComputedStyle(caption).maxWidth);
    // the line holds still at the longest example's width, and only grows
    // for typed text longer than that. ENTER_ROOM is the arrow's space on it
    const room = ENTER_ROOM * fontSize;
    const minWidth = this.minSizerRef.current ? this.minSizerRef.current.offsetWidth : 0;
    const widthPx = Math.min(Math.max(sizer.offsetWidth, minWidth), (maxWidth || Infinity) - room);
    const width = `${(widthPx / fontSize).toFixed(3)}em`;
    blank.style.width = width;
    entry.style.width = `${((widthPx + room) / fontSize).toFixed(3)}em`;
    // as tall as its lines of text
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  };

  // Enter makes the artwork, rather than starting a new line in the blank
  handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      this.handleSubmit({ preventDefault() {} });
    }
  };

  handleChange = (event) => {
    // the person took over: the example stops where it is and fades out, and
    // stays gone until the page is reloaded
    clearTimeout(this.typingTimer);
    // the blank is one line of text, even if it wraps: pasted line breaks become spaces
    const query = event.target.value.replace(/[\r\n]+/g, " ");
    this.setState({ query, pageIndex: 1, takenOver: true });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    // an empty blank makes art from the example being typed, and keeps that
    // word in the blank so the caption matches the artwork
    const { takenOver, exampleIndex, typedLength } = this.state;
    const query = takenOver ? this.state.query.trim() : EXAMPLES[exampleIndex];
    if (!query) return;
    clearTimeout(this.typingTimer);
    this.setState({
      query: takenOver ? this.state.query : query,
      takenOver: true,
      submitted: query,
    });
    if (takenOver) {
      this.props.fetchSearched(query, this.state.pageIndex);
    } else if (typedLength < query.length) {
      // the example's art hasn't painted in yet; its saved colors need no fetch
      this.props.showExampleArt(EXAMPLE_ART[query]);
    }
  };

  render() {
    const { query, exampleIndex, typedLength, takenOver, submitted } = this.state;
    // frozen where it stopped once the person takes over, so it can fade out
    const example = EXAMPLES[exampleIndex].slice(0, typedLength);
    // the arrow is shown while there's something new to make art from
    const canSubmit = takenOver ? query.trim() !== "" && query.trim() !== submitted : true;

    return (
      <div>
        <form onSubmit={this.handleSubmit} className="title" lang="fr">
          {/* a nod to Magritte's "Ceci n'est pas une pipe" */}
          <label htmlFor="title" className="caption">
            Ceci n’est pas une
          </label>
          <span className="entry" ref={this.entryRef}>
            <span className="blank" ref={this.blankRef}>
              <span className="blank-sizer" ref={this.sizerRef} aria-hidden="true">
                {query}
              </span>
              <span className="blank-sizer" ref={this.minSizerRef} aria-hidden="true">
                {LONGEST_EXAMPLE}
              </span>
              {/* drawn beside the input instead of as its placeholder, which
                  browsers hide instantly, so it can fade out when typing starts */}
              <span
                className={takenOver ? "example is-hidden" : "example"}
                aria-hidden="true"
              >
                {example}
              </span>
              {/* a one-row text area rather than an input, so long text wraps
                  onto more lines instead of scrolling sideways */}
              <textarea
                id="title"
                ref={this.inputRef}
                aria-label="Title"
                rows={1}
                autoComplete="off"
                spellCheck="false"
                value={query}
                className="search"
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
              />
              {/* the curved "return" arrow from the Enter key, hanging past the
                  end of the text like hanging punctuation */}
              <button
                type="submit"
                className={canSubmit ? "enter" : "enter is-hidden"}
                aria-label="Make the artwork"
                disabled={!canSubmit}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 5v6a4 4 0 0 1-4 4H5" />
                  <path d="M9 10l-5 5 5 5" />
                </svg>
              </button>
            </span>
          </span>
        </form>
      </div>
    );
  }
}

export default PicSearchPaginate;
