import React from 'react';
import { useParams } from 'react-router-dom';
import PassengerRegister from './passenger/Register';
import DriverRegister from './driver/Register';

const Register = () => {
  const { userType } = useParams();

  switch (userType) {
    case 'passenger':
      return <PassengerRegister />;
    case 'driver':
      return <DriverRegister />;
    default:
      return <PassengerRegister />;
  }
};

export default Register; 