import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rideService } from '../services/rideService';

export const useRide = () => {
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestRide = async (origin, destination) => {
    setLoading(true);
    setError(null);
    try {
      const ride = await rideService.requestRide({
        passengerId: user.id,
        origin,
        destination
      });
      setCurrentRide(ride);
      return ride;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (location) => {
    if (user.role !== 'driver') return;
    try {
      await rideService.updateDriverLocation(location);
    } catch (err) {
      console.error('Erro ao atualizar localização:', err);
    }
  };

  return {
    currentRide,
    loading,
    error,
    requestRide,
    updateLocation
  };
}; 