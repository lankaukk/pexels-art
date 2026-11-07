import React, { Component } from "react";

class PicSearchPaginate extends Component {
  state = {
    query: "",
    pageIndex: 1,
  };

  handleSubmit = (event) => {
    event.preventDefault();
    this.props.fetchSearched(this.state.query, this.state.pageIndex);
  };

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit} className="title" lang="fr">
          {/* a nod to Magritte's "Ceci n'est pas une pipe" */}
          <label htmlFor="title" className="caption">
            Ceci n’est pas une
          </label>
          {/* the blank grows with the typed words: an invisible copy of the
              query (see .blank::after) sets its width */}
          <span className="blank" data-value={this.state.query}>
            <input
              id="title"
              aria-label="Title"
              type="text"
              size={1}
              autoComplete="off"
              spellCheck="false"
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
        </form>
      </div>
    );
  }
}

export default PicSearchPaginate;
