import React from 'react';
import {Navbar, Container} from 'react-bootstrap';
// import { Route, Switch } from 'react-router-dom';
// import ReactDOM from 'react-dom';
import Card from './components/Card';
import CardImage from './components/CardImage';
import './App.css';
import Logo from './img/exbt-black.png';
import Pic1 from './img/pic1.jpeg';
import Pic2 from './img/pic2.png';
import useWindowDimensions from './components/Hook';


function App() {


  const { width } = useWindowDimensions();
  var tempcss;
  var gap = 50;
  var colGap = gap.toString()+'px';
  var x=300;
  var y=300;

  if (width < 500){
    tempcss = {columnGap: colGap, padding: '1rem 0rem 2rem 0rem'};
    x = 300;
    y = 300;
  } else if (width < 900) {
    tempcss = {columnGap: colGap, padding: '1rem 1rem 2rem 1rem'};
    x = 300;
    y = 600;
  } else if (width < 1200) {
    tempcss = {columnGap: colGap, padding: '2rem 2rem 2rem 2rem'};
    x = 300;
    y = 600;
  } else {
    tempcss = {columnGap: colGap, padding: '2rem 5rem 4rem 5rem'};
    x = 600;
    y = 600;
  }


  return (
    <div className="App">
      <Navbar bg="light" sticky="top">
      <Container>
        <Navbar.Brand className="order-md-0 mx-auto order-1">
          <img
            src={Logo}
            height = "30"
            className="d-inline-block align-top"
            alt="EXBT logo" 
          /> 
        </Navbar.Brand>
      </Container>
      </Navbar>

      <div className="wrapper" style={tempcss}>
        <Card number={1} y = {y} x = {x}/>
        <CardImage img={Pic1} pad='25' />
        <Card number={2} />
        <CardImage img={Pic2} pad='50'/>

      </div>
    </div>
    
  );
}

export default App;
