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
    // Redirecionar para dashboard apropriado
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (user.role === 'driver') {
      return <Navigate to="/driver-dashboard" />;
    } else if (user.role === 'passenger') {
      return <Navigate to="/passenger-dashboard" />;
    }
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute; 