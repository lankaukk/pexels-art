import React, { Component, createRef } from "react";

// ideas typed out in the empty blank, one at a time
const EXAMPLES = ["pipe", "ocean", "moonlight", "Venus flytrap"];
const TYPE_MS = 90; // per letter typed
const HOLD_MS = 1800; // finished word stays up
const DELETE_MS = 50; // per letter deleted
const GAP_MS = 300; // empty blank before the next word

class PicSearchPaginate extends Component {
  state = {
    query: "",
    pageIndex: 1,
    exampleIndex: 0,
    // how much of the current example is typed out
    typedLength: 0,
    focused: false,
  };

  blankRef = createRef();
  sizerRef = createRef();

  componentDidMount() {
    this.scheduleTyping(GAP_MS);
    this.sizeBlank();
    // the script font loads after first paint and changes the text width
    if (document.fonts) document.fonts.ready.then(this.sizeBlank);
  }

  componentDidUpdate() {
    this.sizeBlank();
  }

  componentWillUnmount() {
    clearTimeout(this.typingTimer);
  }

  scheduleTyping = (delay) => {
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(this.stepTyping, delay);
  };

  // one keystroke of the fake typist: add a letter, hold, delete a letter,
  // or move on to the next word
  stepTyping = () => {
    const { exampleIndex, typedLength } = this.state;
    const word = EXAMPLES[exampleIndex];

    if (this.deleting) {
      if (typedLength > 0) {
        this.setState({ typedLength: typedLength - 1 });
        this.scheduleTyping(DELETE_MS);
      } else {
        this.deleting = false;
        this.setState({ exampleIndex: (exampleIndex + 1) % EXAMPLES.length });
        this.scheduleTyping(GAP_MS);
      }
    } else if (typedLength < word.length) {
      this.setState({ typedLength: typedLength + 1 });
      this.scheduleTyping(typedLength + 1 === word.length ? HOLD_MS : TYPE_MS);
    } else {
      this.deleting = true;
      this.scheduleTyping(DELETE_MS);
    }
  };

  // the blank is as wide as its text, measured from a hidden copy, so its
  // width can transition and the whole centered caption glides with it
  sizeBlank = () => {
    const sizer = this.sizerRef.current;
    const blank = this.blankRef.current;
    if (!sizer || !blank) return;
    const fontSize = parseFloat(getComputedStyle(sizer).fontSize);
    const widthEm = sizer.offsetWidth / fontSize;
    blank.style.width = `${widthEm.toFixed(3)}em`;
  };

  handleChange = (event) => {
    const query = event.target.value;
    this.setState({ query, pageIndex: 1 });
    if (query === "") {
      // blank cleared: the typist starts over with a fresh word
      this.deleting = false;
      this.setState({ typedLength: 0 });
      this.scheduleTyping(GAP_MS);
    } else {
      clearTimeout(this.typingTimer);
    }
  };

  handleSubmit = (event) => {
    event.preventDefault();
    // an empty blank makes art from the example being typed, and keeps that
    // word in the blank so the caption matches the artwork
    const query = this.state.query.trim() || EXAMPLES[this.state.exampleIndex];
    if (this.state.query === "") {
      clearTimeout(this.typingTimer);
      this.setState({ query });
    }
    this.props.fetchSearched(query, this.state.pageIndex);
  };

  render() {
    const { query, exampleIndex, typedLength, focused } = this.state;
    const placeholder = EXAMPLES[exampleIndex].slice(0, typedLength);

    return (
      <div>
        <form onSubmit={this.handleSubmit} className="title" lang="fr">
          {/* a nod to Magritte's "Ceci n'est pas une pipe" */}
          <label htmlFor="title" className="caption">
            Ceci n’est pas une
          </label>
          <span className="entry">
            <span className="blank" ref={this.blankRef}>
              <span className="blank-sizer" ref={this.sizerRef} aria-hidden="true">
                {query || placeholder}
              </span>
              <input
                id="title"
                aria-label="Title"
                type="text"
                size={1}
                autoComplete="off"
                spellCheck="false"
                placeholder={placeholder}
                value={query}
                className="search"
                onChange={this.handleChange}
                onFocus={() => this.setState({ focused: true })}
                onBlur={() => this.setState({ focused: false })}
              />
              {/* browsers only draw the real cursor while the blank is focused,
                  so an empty, unfocused blank gets a blinking stand-in */}
              {!focused && query === "" && (
                <span className="fake-caret" aria-hidden="true" />
              )}
            </span>
            <button type="submit" className="enter" aria-label="Make the artwork">
              {/* the curved "return" arrow from the Enter key */}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 5v6a4 4 0 0 1-4 4H5" />
                <path d="M9 10l-5 5 5 5" />
              </svg>
            </button>
          </span>
        </form>
      </div>
    );
  }
}

export default PicSearchPaginate;
