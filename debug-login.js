const axios = require('axios');

const debugLogin = async () => {
  console.log('🔍 Debugando login...');
  
  try {
    // Teste de login do motorista
    console.log('\n1. Testando login do motorista...');
    const driverResponse = await axios.post('http://localhost:5000/api/auth/login', {
      phone: '11999996666',
      password: '123456',
      userType: 'driver'
    });
    
    console.log('✅ Motorista logado com sucesso');
    console.log('Token:', driverResponse.data.token ? 'Presente' : 'Ausente');
    console.log('User ID:', driverResponse.data.user?.id);
    console.log('User Type:', driverResponse.data.user?.userType);
    
    // Teste de login do passageiro
    console.log('\n2. Testando login do passageiro...');
    const passengerResponse = await axios.post('http://localhost:5000/api/auth/login', {
      phone: '11999996666',
      password: '123456',
      userType: 'passenger'
    });
    
    console.log('✅ Passageiro logado com sucesso');
    console.log('Token:', passengerResponse.data.token ? 'Presente' : 'Ausente');
    console.log('User ID:', passengerResponse.data.user?.id);
    console.log('User Type:', passengerResponse.data.user?.userType);
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.response?.data?.message || error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
};

debugLogin();