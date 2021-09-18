import './App.css';
import CardItem from './components/CardItem';


function App() {
  return (
    <div className="App">
      <div className="App-header">
        Exhibition
      </div>
      <div className="wrapper">
        <CardItem number={1} name="Waveform"/>
        <CardItem number={2} name="Drops"/>
      </div>
    </div>
    
  );
}

export default App;
