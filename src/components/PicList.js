import React from "react";

const PicList = (props) => {
  if (props.pics.length > 0) {
    return (
      <div className="picCard">
        {/* 16 columns x 9 rows keeps every pixel square on the 16:9 canvas */}
        {props.pics.map((pic, index) => (
          <div
            key={index}
            className="pexel"
            style={{
              height: `${100 / 9}%`,
              width: `${100 / 16}%`,
              backgroundColor: pic.avg_color,
            }}
          ></div>
        ))}
      </div>
    );
  } else {
    return (
      <div className="picCard">
        <p>This is not Reality.</p>
      </div>
    );
  }
};

export default PicList;
