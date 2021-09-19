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
  var tempcss
  if (width < 600){
    tempcss = {gap: '2rem', padding: '1rem 1rem 2rem 1rem'};
  } else if (width < 900) {
    tempcss = {gap: '3rem', padding: '2rem 1.5rem 2rem 1.5rem'};
  } else {
    tempcss = {gap: '5rem', padding: '2rem 5rem 4rem 5rem'};
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
          {/* <p>{width}</p> */}
        </Navbar.Brand>
      </Container>
      </Navbar>

      <div className="wrapper" style={tempcss}>
        <Card number={1} name="Waveform"/>
        <CardImage img={Pic1} name="pic1" pad='25' dark={1}/>
        <Card number={2} name="Drops"/>
        <CardImage img={Pic2} name="pic2" pad='50' dark={1}/>

      </div>
    </div>
    
  );
}

export default App;
