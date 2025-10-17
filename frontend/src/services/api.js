import axios from 'axios';

// Resolve API base URL for development and production
let API_URL = process.env.REACT_APP_API_URL;

// Ajuste automático para Android WebView: quando API aponta para localhost,
// usar o host atual da WebView e porta 5000
if (typeof window !== 'undefined') {
  const isWebView = !!window.ReactNativeWebView || !!window.Android;
  const isLocalhost = API_URL && /localhost/i.test(API_URL);
  if (isWebView && isLocalhost) {
    const host = window.location?.hostname;
    if (host && /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      API_URL = `http://${host}:5000`;
      console.warn('API_URL ajustado para Android WebView:', API_URL);
    }
  }
}

// Fallbacks for development: prefer 5001 when undefined or misconfigured
if (process.env.NODE_ENV === 'development') {
  const shouldFallback = !API_URL || /localhost:3010/.test(API_URL);
  if (shouldFallback) {
    console.warn('Using fallback API URL: http://localhost:5000');
    API_URL = 'http://localhost:5000';
  }
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