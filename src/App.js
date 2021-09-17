import './App.css';
import Art1 from './sketches/Art1';
import Art2 from './sketches/Art2';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Art1 />
        <Art2 />
        <p>
          Generative Art
        </p>        
      </header>
    </div>
  );
}

export default App;
