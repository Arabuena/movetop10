import React, { createContext, useContext, useState } from 'react';
import { rideService } from '../services/rideService';
import api from '../services/api';

const RideContext = createContext();

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide deve ser usado dentro de um RideProvider');
  }
  return context;
};

export const RideProvider = ({ children }) => {
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestRide = async (rideData) => {
    try {
      setLoading(true);
      const response = await api.post('/rides/request', rideData);
      setCurrentRide(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao solicitar corrida');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Busca uma corrida específica
  const getRide = async (rideId) => {
    try {
      setLoading(true);
      const ride = await rideService.getRideStatus(rideId);
      setCurrentRide(ride);
      return ride;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cancela uma corrida
  const cancelRide = async (rideId, reason) => {
    try {
      setLoading(true);
      await rideService.cancelRide(rideId, reason);
      setCurrentRide(null);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentRide = async () => {
    try {
      setLoading(true);
      const response = await rideService.getCurrentRide();
      if (response) {
        setCurrentRide(response);
      }
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentRide,
    loading,
    error,
    requestRide,
    getRide,
    getCurrentRide,
    cancelRide,
    setError
  };

  return (
    <RideContext.Provider value={value}>
      {children}
    </RideContext.Provider>
  );
};

export default RideContext; 