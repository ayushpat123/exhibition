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

  if (width < 400){
    tempcss = {columnGap: colGap, padding: '1rem 0rem 2rem 0rem'};
    x = 300;
    y = 300;
  } else if (width < 800) {
    tempcss = {columnGap: colGap, padding: '2rem 2rem 2rem 2rem'};
    x = 300;
    y = 600;
  } else if (width < 1200) {
    tempcss = {columnGap: colGap, padding: '2rem 2rem 2rem 2rem'};
    x = 600;
    y = 600;
  } else {
    tempcss = {columnGap: colGap, padding: '2rem 5rem 4rem 5rem'};
    x = 600;
    y = 600;
  }


  return (
    <div className="App">
      <Navbar bg="light">
      {/* <Navbar bg="light" sticky="top"> */}
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
        <CardImage img='https://lh3.googleusercontent.com/Lof5tKP71E8HP_a7FiAWeX-v_NN9T3dfy2zsBGQhVpsCnQiLjV57pWSKMG4NEEIefaO0a5BfA5TiHWzl8UGJBiMigP4E-BxT6BWrgI8LvsSahXBBj6XhxsXFtczbB7m5OJq4Sgkah8M=w2400' x={x} pad='10'/>
        <CardImage img='https://lh3.googleusercontent.com/NPK6aAty1UjIonsWFz6UyHKNIXiOsXaU_R0umbFJBLqvOpPuoS_PHWSoiTsUfctSJMUtHGm8WZVZCILNW8G4ccRz1exkxj3KoCR40105sxbqaMJUdbIQ-EUscrnbAsPbFqShRfEBSBA=w2400' pad='40'/>
        <CardImage img='https://lh3.googleusercontent.com/wjbxsq0FZvMx2gHZw75N4K1i5zEkCSDA1mkBe4ujB7_DpBrg2gYuhuDr2v4rawkQK8XdJSMCgwSmEq7_GhDGJMg4rTfPqhPDyYJbr9DO7RwsaYIG4emmP6aWIuIPYpFMO_b2EB1UxAg=w2400' pad='0' y={y}/>
        <CardImage img='https://lh3.googleusercontent.com/MUhIjR6Q599UtmwJsB4ZsOny8SWM-H1ycSxmrcqje-XudovIhzEVQB_Qcdjt0mRFaxjNUrUjd0PCN1fEqR5kzn-tq-4_Gi1amvMko_ROV-vT7fveppXyrj6uHEpn4wu4LQiE7TeSS88=w2400' pad='10' y={y}/>
        <CardImage img='https://lh3.googleusercontent.com/I-QWDiyoGgwcRmp9PfZvCqOEkH81fxzDNAV_Rq9VIKzjMhOXX7JRyL-fXRXqndhRBM5aPG-M5ib8-PTujSxezOpB3LxzJa8s-z6vyl2PPAcbgN31Nt-oJvFchLKxBX-9lNWlQ7KiZ7Y=w2400' pad='10'/>
      </div>
    </div>
    
  );
}

export default App;
