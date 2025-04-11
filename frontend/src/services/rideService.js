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

  acceptRide: async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/accept`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao aceitar corrida');
    }
  },

  startRide: async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/start`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao iniciar corrida');
    }
  },

  finishRide: async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/finish`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao finalizar corrida');
    }
  },

  getRideStatus: async (rideId) => {
    try {
      const response = await api.get(`/rides/${rideId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar status da corrida');
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
  },

  cancelRide: async (rideId, reason) => {
    try {
      const response = await api.post(`/rides/${rideId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao cancelar corrida');
    }
  },

  getCurrentRide: async () => {
    try {
      const response = await api.get('/rides/current');
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        throw new Error(error.response?.data?.message || 'Erro ao buscar corrida atual');
      }
      return null;
    }
  }
}; 