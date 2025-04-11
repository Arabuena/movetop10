import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RideProvider } from './contexts/RideContext';
import AppRoutes from './routes';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RideProvider>
          <AppRoutes />
        </RideProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App; 