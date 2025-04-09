import api from './api';

export const adminService = {
  // Gerenciamento de Usuários
  getUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar usuários');
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar status do usuário');
    }
  },

  // Gerenciamento de Corridas
  getAllRides: async (filters) => {
    try {
      const response = await api.get('/admin/rides', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar corridas');
    }
  },

  // Relatórios
  getMetrics: async (period) => {
    try {
      const response = await api.get('/admin/metrics', { params: { period } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar métricas');
    }
  }
}; 