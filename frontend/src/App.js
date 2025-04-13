import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import AuthLayout from './layouts/AuthLayout';
import DriverLayout from './layouts/DriverLayout';
import PassengerLayout from './layouts/PassengerLayout';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';

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

const libraries = ['places', 'geometry'];

function App() {
  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      loadingElement={<div>Carregando Google Maps...</div>}
    >
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Rota raiz redireciona para login do passageiro */}
              <Route path="/" element={<Navigate to="/login/passenger" replace />} />

              {/* Rotas de autenticação */}
              <Route element={<AuthLayout />}>
                <Route path="/login/driver" element={<DriverLogin />} />
                <Route path="/register/driver" element={<DriverRegister />} />
                <Route path="/login/passenger" element={<PassengerLogin />} />
                <Route path="/register/passenger" element={<PassengerRegister />} />
              </Route>

              {/* Rotas do motorista */}
              <Route path="/driver" element={<DriverLayout />}>
                <Route index element={<DriverHome />} />
                <Route path="rides" element={<DriverRides />} />
                <Route path="earnings" element={<DriverEarnings />} />
              </Route>

              {/* Rotas do passageiro */}
              <Route path="/passenger" element={<PassengerLayout />}>
                <Route index element={<RideRequest />} />
                <Route path="rides" element={<PassengerRides />} />
                <Route path="rides/:rideId" element={<RideTracking />} />
                <Route path="profile" element={<PassengerProfile />} />
              </Route>
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
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
      </BrowserRouter>
    </LoadScript>
  );
}

export default React.memo(App); 