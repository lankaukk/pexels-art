import React from "react";

const PicList = (props) => {
  if (props.pics.length > 0) {
    return (
      <div className="picCard">
        {/* pixel sizes live in style.css so portrait screens can wrap them 9 across */}
        {props.pics.map((pic, index) => (
          <div
            key={index}
            className="pexel"
            style={{ backgroundColor: pic.avg_color }}
          ></div>
        ))}
      </div>
    );
  } else {
    return <div className="picCard"></div>;
  }
};

export default PicList;
