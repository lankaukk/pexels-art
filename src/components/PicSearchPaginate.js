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
          <input
            id="title"
            aria-label="Title"
            type="text"
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
        </form>
      </div>
    );
  }
}

export default PicSearchPaginate;
