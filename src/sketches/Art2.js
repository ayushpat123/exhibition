import React from "react";
import Sketch from "react-p5";

const canvasWidth = 300;
const canvasHeight = 300;

const size = 15;

// Included in index.html
// This is an alternative to p5.js builtin 'noise' function,
// It provides 4D noise and returns a value between -1 and 1
  
const Art2 = (props) => {
  const setup = (p5, canvasParentRef) => {
    // use parent to render the canvas in this ref
    // (without that p5 will render the canvas outside of your component)
    p5.createCanvas(canvasWidth, canvasHeight).parent(canvasParentRef);
    p5.background(0);
    // p5.frameRate(60);
    p5.noStroke();
  };

  const draw = (p5) => {
      let j = p5.random(3);
      for(let i=0;i<=j;i++){
          p5.fill(p5.random(256),0,0);
          p5.circle(p5.random(canvasWidth), p5.random(canvasHeight), p5.random(size));
      }      
  };

  return <Sketch setup={setup} draw={draw} />;
};

export default Art2;

