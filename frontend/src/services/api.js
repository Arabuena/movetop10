import axios from 'axios';

// Add a check for the API URL
const API_URL = process.env.REACT_APP_API_URL;

if (process.env.NODE_ENV === 'development' && API_URL?.includes('3010')) {
  console.warn('REACT_APP_API_URL aponta para 3010; ajustando para 5001 em desenvolvimento.');
  API_URL = 'http://localhost:5001';
}

const baseURL = `${API_URL}/api`;
console.log('Using API URL:', baseURL);

const api = axios.create({
  baseURL
});

// Configurar o token no axios para todas as requisições
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default api; 

async function makeRequest(method, endpoint, data) {
  const token = localStorage.getItem('token');
  try {
    if (!API_URL) {
      throw new Error('API URL is not configured');
    }
    
    // Usar a URL diretamente sem proxy CORS
    const url = `${API_URL}/api${endpoint}`;
    
    const response = await axios({
      method,
      url,
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error in ${method.toUpperCase()} ${endpoint}:`, error);
    throw error;
  }
}

// Exportar funções auxiliares
export const apiHelpers = {
  get: (endpoint) => makeRequest('get', endpoint),
  post: (endpoint, data) => makeRequest('post', endpoint, data),
  put: (endpoint, data) => makeRequest('put', endpoint, data),
  delete: (endpoint) => makeRequest('delete', endpoint)
};