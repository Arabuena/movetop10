import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token');
    return storedToken ? storedToken : null;
  });

  const login = async (phone, userType, password) => {
    try {
      console.log('AuthContext: Iniciando login', { phone, userType });
      console.log('AuthContext: API baseURL:', api.defaults.baseURL);
      console.log('AuthContext: Fazendo requisição para /auth/login');
      
      const response = await api.post('/auth/login', {
        phone,
        userType,
        password
      });

      console.log('AuthContext: Resposta recebida:', {
        status: response.status,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user
      });

      const { token, user } = response.data;
      
      console.log('AuthContext: Login bem-sucedido', { 
        userId: user._id,
        phone: user.phone 
      });

      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Configurar o token no axios para futuras requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return user; // Retornar o usuário para uso no componente
    } catch (error) {
      console.error('AuthContext: Erro no login', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url
      });
      throw error;
    }
  };

  const register = async (data, userType) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', { ...data, userType });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar perfil do usuário (passageiro)
  const updateUser = async (updates) => {
    try {
      setLoading(true);
      const response = await api.put('/passenger/profile', updates);
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('AuthContext: Erro ao atualizar perfil', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return { success: false, error: error.response?.data?.error || error.message };
    } finally {
      setLoading(false);
    }
  };

  // Upload de avatar (foto de perfil)
  const uploadAvatar = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      console.debug('AuthContext.uploadAvatar: enviando arquivo', { name: file?.name, type: file?.type, size: file?.size, baseURL: api.defaults.baseURL });
      const response = await api.post('/passenger/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.debug('AuthContext.uploadAvatar: resposta recebida', { status: response.status, data: response.data });
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      console.debug('AuthContext.uploadAvatar: user atualizado no contexto/localStorage', { avatarUrl: updatedUser?.avatarUrl });
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('AuthContext: Erro no upload do avatar', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return { success: false, error: error.response?.data?.error || error.message };
    } finally {
      setLoading(false);
    }
  };

  // Adicionar função de logout ausente
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, uploadAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;