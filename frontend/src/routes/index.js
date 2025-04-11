import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DriverLayout from '../layouts/DriverLayout';
import PassengerLayout from '../layouts/PassengerLayout';
import PassengerLogin from '../pages/auth/passenger/Login';
import PassengerRegister from '../pages/auth/passenger/Register';
import DriverLogin from '../pages/auth/driver/Login';
import DriverRegister from '../pages/auth/driver/Register';
import PassengerHome from '../pages/passenger/Home';
import DriverHome from '../pages/driver/Home';
import PrivateRoute from './PrivateRoute';
import SelectVehicle from '../pages/passenger/SelectVehicle';
import TrackRide from '../pages/public/TrackRide';
import ActiveRide from '../pages/driver/ActiveRide';
import RideHistory from '../pages/driver/RideHistory';
import Profile from '../pages/driver/Profile';
import Reviews from '../pages/driver/Reviews';
import Earnings from '../pages/driver/Earnings';
import Settings from '../pages/driver/Settings';
import Support from '../pages/driver/Support';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/" element={<Navigate to="/login/passenger" replace />} />
      
      {/* Rotas de autenticação */}
      <Route element={<AuthLayout />}>
        <Route path="/login/passenger" element={<PassengerLogin />} />
        <Route path="/register/passenger" element={<PassengerRegister />} />
        <Route path="/login/driver" element={<DriverLogin />} />
        <Route path="/register/driver" element={<DriverRegister />} />
      </Route>

      {/* Rotas do motorista */}
      <Route element={<PrivateRoute userType="driver" />}>
        <Route element={<DriverLayout />}>
          <Route path="/driver" element={<Navigate to="/driver/home" replace />} />
          <Route path="/driver/home" element={<DriverHome />} />
          <Route path="/driver/history" element={<RideHistory />} />
          <Route path="/driver/earnings" element={<Earnings />} />
          <Route path="/driver/reviews" element={<Reviews />} />
          <Route path="/driver/settings" element={<Settings />} />
          <Route path="/driver/support" element={<Support />} />
        </Route>
      </Route>

      {/* Rota pública de rastreamento */}
      <Route path="/track/:rideId" element={<TrackRide />} />
    </Routes>
  );
};

export default AppRoutes; 