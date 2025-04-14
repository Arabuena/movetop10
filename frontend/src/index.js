import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Configurar os future flags do React Router
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));

// Remover StrictMode temporariamente para evitar warnings
root.render(
  <BrowserRouter {...routerOptions}>
    <App />
  </BrowserRouter>
); 