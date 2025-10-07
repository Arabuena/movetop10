const axios = require('axios');

const createPassenger = async () => {
  console.log('🚀 Criando passageiro de teste...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Passageiro Teste',
      phone: '11999999999',
      email: 'passageiro@teste.com',
      password: '123456',
      userType: 'passenger'
    });
    
    console.log('✅ Passageiro criado com sucesso!');
    console.log('📱 Telefone: 11999999999');
    console.log('🔑 Senha: 123456');
    console.log('👤 Tipo: passenger');
    console.log('🆔 ID:', response.data.user._id);
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('já cadastrado')) {
      console.log('ℹ️ Passageiro já existe');
      console.log('📱 Telefone: 11999999999');
      console.log('🔑 Senha: 123456');
      console.log('👤 Tipo: passenger');
    } else {
      console.error('❌ Erro ao criar passageiro:', error.response?.data || error.message);
    }
  }
};

createPassenger();