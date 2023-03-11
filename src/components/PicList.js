import React from "react";

const PicList = (props) => {
  if (props.pics.length > 0) {
    return (
      <div className="picCard">
        {props.pics.map((pic) => (
          <>
            <div
              className="pexel"
              style={{
                height: "16.6%",
                width: "16.6%",
                backgroundColor: pic.avg_color,
              }}
            ></div>
          </>
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
