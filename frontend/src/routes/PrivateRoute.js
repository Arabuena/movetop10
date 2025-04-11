import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ userType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to={`/login/${userType}`} replace />;
  }

  if (user.type !== userType) {
    return <Navigate to={`/login/${userType}`} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute; 