import axios from 'axios';

// Add a check for the API URL
const API_URL = process.env.REACT_APP_API_URL;
if (!API_URL) {
  console.error('REACT_APP_API_URL is not defined in environment variables');
}

const api = axios.create({
  baseURL: `${API_URL}/api`
});

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
      url: error.config.url,
      method: error.config.method,
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
    
    const response = await axios({
      method,
      url: `${API_URL}/api${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      endpoint,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      apiUrl: API_URL // Add this for debugging
    });
    throw error;
  }
}

export { makeRequest }; 