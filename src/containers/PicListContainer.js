import React, { Component } from "react";
import PicList from "../components/PicList";
import PicSearchPaginate from "../components/PicSearchPaginate";

class PicListContainer extends Component {
  state = {
    pics: [],
  };

  fetchSearched = (query, index) => {
    // the Netlify Function in netlify/functions/pexels.js holds the api key, so it never reaches the browser
    const BASE_URL = `/.netlify/functions/pexels?query=${encodeURIComponent(query)}&page=${index}`;

    fetch(BASE_URL)
      .then((response) => response.json())
      //.then(result => console.log(result.photos))
      .then((result) => {
        this.setState({
          pics: (result.photos || []).map((pic) => ({
            avg_color: pic.avg_color,
          })),
        });
      })
      .catch((err) => console.log(err));

    // )
    console.log("query:", query, "page:", index);
  };

  // an example word's saved colors (src/exampleArt.json), shown without a fetch
  showExampleArt = (colors) => {
    this.setState({ pics: colors.map((avg_color) => ({ avg_color })) });
  };

  render() {
    return (
      <div className="piece">
        <div className="artcontainer">
          <PicList pics={this.state.pics} />
        </div>

        <PicSearchPaginate
          fetchSearched={this.fetchSearched}
          showExampleArt={this.showExampleArt}
        />
      </div>
    );
  }
}

export default PicListContainer;
