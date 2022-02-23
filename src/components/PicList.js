import React from 'react'

const PicList = (props) => {
  // console.log(props);

  function changeSize(e) {
    e.target.style.transform = "scale(2)";
  }

  // function removeSize(e) {
  //   e.target.style.transform = "scale(3)";
  // }

  if (props.pics.length > 0) {
    return (
      <div className="picCard">
          {props.pics.map(pic =>     
            <>
                <div 
                onMouseEnter={changeSize}
                onMouseLeave={removeSize}
                className='pexel'
                style={{height: '16.6%', width: '16.6%', backgroundColor: pic.avg_color }}></div>
            </>
          )}
      </div>
    )
  } else {
    return (
      <div className="picCard">
        <p>This is not Reality.</p>
      </div>
    )
  }
}

export default PicList