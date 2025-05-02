import React from 'react';
import { useParams } from 'react-router-dom';
import PassengerLogin from './passenger/Login';
import DriverLogin from './driver/Login';

const Login = () => {
  const { userType } = useParams();

  switch (userType) {
    case 'passenger':
      return <PassengerLogin />;
    case 'driver':
      return <DriverLogin />;
    default:
      return <PassengerLogin />;
  }
};

export default Login; 