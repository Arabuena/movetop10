// Contexto de autenticação para gerenciar:
- Estado do usuário
- Token JWT
- Funções de login/logout 

import axios from 'axios';

// Configuração global do axios para incluir o token em todas as requisições
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
); 