import React from 'react';
import Questionnaire from './components/Questionnaire';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="header">
        <h1>Bienvenido a GO4SURPRISE</h1>
      </div>
      <Questionnaire />
    </div>
  );
}

export default App;