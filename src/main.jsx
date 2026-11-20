import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Global styles first, so component CSS modules can override them.
import './styles/global.css';
import './fx/directional-fill.js';
import App from './App.jsx';
import { startContent } from './content/store';

// load the latest content and check for an admin session while the page renders
startContent();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
