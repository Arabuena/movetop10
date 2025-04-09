import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { LoadScript } from '@react-google-maps/api';
import PrivateRoute from './components/routes/PrivateRoute';

// Importando páginas da nova estrutura
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import PassengerDashboard from './pages/passenger/Dashboard';
import RequestRide from './pages/passenger/RequestRide';
import RideHistory from './pages/passenger/RideHistory';
import DriverDashboard from './pages/driver/Dashboard';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <LoadScript
          googleMapsApiKey="AIzaSyAVe7W-B0zZa-6ePrcLfZkDzs1RGRSHSCc"
          libraries={["places"]}
        >
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              {/* Rotas públicas */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              
              {/* Rotas protegidas */}
              <Route path="/" element={<Home />} />
              <Route 
                path="/passenger-dashboard" 
                element={
                  <PrivateRoute allowedRoles={['passenger']}>
                    <PassengerDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/driver-dashboard" 
                element={
                  <PrivateRoute allowedRoles={['driver']}>
                    <DriverDashboard />
                  </PrivateRoute>
                } 
              />
              <Route path="/request-ride" element={<RequestRide />} />
              <Route path="/ride-history" element={<RideHistory />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              
              {/* Rota 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </LoadScript>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App; 