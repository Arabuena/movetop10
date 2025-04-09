import api from './api';

export const rideService = {
  requestRide: async (rideData) => {
    try {
      const response = await api.post('/rides/request', rideData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao solicitar corrida');
    }
  },

  updateDriverLocation: async (location) => {
    try {
      const response = await api.post('/driver/location', location);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar localização');
    }
  },

  updateDriverAvailability: async (isAvailable) => {
    try {
      const response = await api.post('/driver/availability', { isAvailable });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar disponibilidade');
    }
  },

  getRideHistory: async () => {
    try {
      const response = await api.get('/rides/history');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar histórico');
    }
  }
}; 