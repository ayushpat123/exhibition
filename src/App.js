import './App.css';
import Art1 from './sketches/Art1';
import Art2 from './sketches/Art2';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Art2 />
        <p>
          Noisy Day
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        
      </header>
    </div>
  );
}

export default App;
