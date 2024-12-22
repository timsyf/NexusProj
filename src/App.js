import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import Home from './Home';
import AI from './AI';
import OD from './OD';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <Link to="/">Home</Link> | <Link to="/AI">AI</Link> | <Link to="/OD">OD</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/AI" element={<AI />} />
          <Route path="/OD" element={<OD />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;