import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" />;
      case 'driver':
        return <Navigate to="/driver-dashboard" />;
      case 'passenger':
        return <Navigate to="/passenger-dashboard" />;
      default:
        return <Navigate to="/" />;
    }
  }

  return children;
};

export default PrivateRoute; 