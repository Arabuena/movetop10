import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/login/${location.pathname.split('/')[1]}`} replace />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to={`/${user.userType}`} replace />;
  }

  return children;
}; 