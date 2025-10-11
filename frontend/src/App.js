import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import AuthLayout from './layouts/AuthLayout';
import DriverLayout from './layouts/DriverLayout';
import PassengerLayout from './layouts/PassengerLayout';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import { PrivateRoute, PublicOnlyRoute } from './components/PrivateRoute';
import { DriverProvider } from './driver/contexts/DriverContext';
import { LoadScript } from '@react-google-maps/api';

// Páginas de autenticação
import DriverLogin from './pages/auth/driver/Login';
import DriverRegister from './pages/auth/driver/Register';
import PassengerLogin from './pages/auth/passenger/Login';
import PassengerRegister from './pages/auth/passenger/Register';

// Páginas do motorista
import DriverHome from './pages/driver/Home';
import DriverRides from './pages/driver/Rides';
import DriverEarnings from './pages/driver/Earnings';

// Páginas do passageiro
import PassengerHome from './pages/passenger/Home';
import PassengerRides from './pages/passenger/Rides';
import PassengerProfile from './pages/passenger/Profile';
import RideRequest from './pages/passenger/RideRequest';
import RideTracking from './pages/passenger/RideTracking';

// Componentes de autenticação
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

const libraries = ['places', 'geometry'];

function App() {
  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      loadingElement={<div>Carregando Google Maps...</div>}
    >
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login/passenger" replace />} />
            
            <Route path="/login/:userType" element={
              <PublicOnlyRoute>
                <AuthLayout />
              </PublicOnlyRoute>
            }>
              <Route index element={<Login />} />
            </Route>
  
            <Route path="/register/:userType" element={
              <PublicOnlyRoute>
                <AuthLayout />
              </PublicOnlyRoute>
            }>
              <Route index element={<Register />} />
            </Route>
  
            <Route path="/passenger/*" element={
              <PrivateRoute>
                <PassengerLayout />
              </PrivateRoute>
            }>
              <Route index element={<RideRequest />} />
              <Route path="rides" element={<PassengerRides />} />
              <Route path="rides/:rideId" element={<RideTracking />} />
              <Route path="profile" element={<PassengerProfile />} />
            </Route>
  
            <Route path="/driver/*" element={
              <PrivateRoute>
                <DriverProvider>
                  <DriverLayout />
                </DriverProvider>
              </PrivateRoute>
            }>
              <Route index element={<DriverHome />} />
              <Route path="rides" element={<DriverRides />} />
              <Route path="earnings" element={<DriverEarnings />} />
            </Route>
          </Routes>
          <ToastContainer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              }
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </LoadScript>
  );
}

export default React.memo(App);