import React from 'react';
import {Navbar, Container} from 'react-bootstrap';
// import { Route, Switch } from 'react-router-dom';

// import ReactDOM from 'react-dom';
import CardItem from './components/CardItem';
import './App.css';
import Logo from './img/exbt-white.png';

function App() {
  return (
    <div className="App">
      <Navbar bg="dark" sticky="top">
      <Container>
        <Navbar.Brand className="order-md-0 mx-auto order-1">
          <img
            src={Logo}
            height = "30"
            // className="d-inline-block align-top"
            alt="EXBT logo" 
          /> 
        </Navbar.Brand>
      </Container>
      </Navbar>

      {/* <div className="App-header"> */}
        {/* EXBT */}
      {/* </div> */}
      <div className="wrapper">
        <CardItem number={1} name="Waveform"/>
        <CardItem number={2} name="Drops"/>
      </div>
    </div>
    
  );
}

export default App;
