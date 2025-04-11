import api from './api';

export const driverService = {
  updateLocation: async (location) => {
    try {
      const response = await api.post('/driver/location', {
        coordinates: [location.lng, location.lat]
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      throw new Error('Falha ao atualizar localização');
    }
  },

  updateAvailability: async (isAvailable) => {
    try {
      const response = await api.post('/driver/availability', { isAvailable });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      throw new Error('Falha ao atualizar disponibilidade');
    }
  },

  getNearbyRides: async () => {
    try {
      const response = await api.get('/driver/rides/nearby');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar corridas próximas:', error);
      throw new Error('Falha ao buscar corridas próximas');
    }
  },

  acceptRide: async (rideId) => {
    try {
      const response = await api.post(`/rides/${rideId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
      throw new Error('Falha ao aceitar corrida');
    }
  }
}; 