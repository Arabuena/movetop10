const handleLogin = async (data) => {
  try {
    console.log('API URL:', process.env.REACT_APP_API_URL); // Debug environment variable
    // ... rest of your login code
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      apiUrl: process.env.REACT_APP_API_URL
    });
    // ... error handling
  }
}; 