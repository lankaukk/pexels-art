import React from "react";
import PicListContainer from "../containers/PicListContainer";
import ArtistStatement from "./ArtistStatement";

const App = () => {
  return (
    <div>
      <PicListContainer />
      <ArtistStatement />
      <div className="page-scrim" aria-hidden="true" />
    </div>
  );
};

export default App;
