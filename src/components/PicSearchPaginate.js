import React, { Component } from "react";

// ideas shown in the empty blank, one at a time
const EXAMPLES = ["pipe", "ocean", "moonlight", "Venus flytrap"];
const EXAMPLE_INTERVAL_MS = 2500;

class PicSearchPaginate extends Component {
  state = {
    query: "",
    pageIndex: 1,
    exampleIndex: 0,
  };

  componentDidMount() {
    this.exampleTimer = setInterval(() => {
      if (this.state.query === "") {
        this.setState(({ exampleIndex }) => ({
          exampleIndex: (exampleIndex + 1) % EXAMPLES.length,
        }));
      }
    }, EXAMPLE_INTERVAL_MS);
  }

  componentWillUnmount() {
    clearInterval(this.exampleTimer);
  }

  handleSubmit = (event) => {
    event.preventDefault();
    // an empty blank makes art from the example that's showing, and keeps that
    // word in the blank so the caption matches the artwork
    const query = this.state.query.trim() || EXAMPLES[this.state.exampleIndex];
    if (this.state.query === "") this.setState({ query });
    this.props.fetchSearched(query, this.state.pageIndex);
  };

  render() {
    const example = EXAMPLES[this.state.exampleIndex];

    return (
      <div>
        <form onSubmit={this.handleSubmit} className="title" lang="fr">
          {/* a nod to Magritte's "Ceci n'est pas une pipe" */}
          <label htmlFor="title" className="caption">
            Ceci n’est pas une
          </label>
          <span className="entry">
            {/* the blank grows with the typed words (or the example showing):
                an invisible copy of the text (see .blank::after) sets its width */}
            <span className="blank" data-value={this.state.query || example}>
              <input
                id="title"
                aria-label="Title"
                type="text"
                size={1}
                autoComplete="off"
                spellCheck="false"
                placeholder={example}
                value={this.state.query}
                className="search"
                onChange={(event) =>
                  this.setState({
                    query: event.target.value,
                    pageIndex: 1,
                  })
                }
              />
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
