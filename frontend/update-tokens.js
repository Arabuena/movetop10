// Script para atualizar tokens JWT no localStorage do frontend
// Execute este script no console do navegador (F12 > Console) ou use como referência

// Novos tokens gerados (válidos por 24 horas)
const newTokens = {
  // Passageiros
  'arah': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MDllZDgwMzYwNjMwMmNlNjM5NTU1ZCIsInVzZXJUeXBlIjoicGFzc2VuZ2VyIiwiaWF0IjoxNzU5NDM4NTcxLCJleHAiOjE3NTk1MjQ5NzF9.jpEc3UB3NerR1m1I-Ryr4pwtwadCRGjreAzpiZKrR44',
  'passageiro-teste': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGRjMWJiMWYyMDc1N2RjNzNlOGVkYSIsInVzZXJUeXBlIjoicGFzc2VuZ2VyIiwiaWF0IjoxNzU5NDM4NTcxLCJleHAiOjE3NTk1MjQ5NzF9.9yF5zVNQScsHlj9222siKd_6u7ZvzcruhsHDqUc5A7E',
  
  // Motorista
  'motorista-ativo': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGMyZmJmYjE2YjViMWFkOTdmYzM5NCIsInVzZXJUeXBlIjoiZHJpdmVyIiwiaWF0IjoxNzU5NDM4NTcxLCJleHAiOjE3NTk1MjQ5NzF9.QhSfvRe2j0I2QAKBFgwNcfSS-tSFbSLhIPXmVCxijUg'
};

// Dados dos usuários correspondentes
const userData = {
  'arah': {
    _id: '6809ed803606302ce639555d',
    name: 'arah',
    userType: 'passenger',
    phone: '62999999999' // Substitua pelo telefone correto se necessário
  },
  'passageiro-teste': {
    _id: '68ddc1bb1f20757dc73e8eda',
    name: 'Passageiro Teste',
    userType: 'passenger',
    phone: '62888888888' // Substitua pelo telefone correto se necessário
  },
  'motorista-ativo': {
    _id: '68dc2fbfb16b5b1ad97fc394',
    name: 'Motorista Ativo',
    userType: 'driver',
    phone: '62777777777' // Substitua pelo telefone correto se necessário
  }
};

// Função para atualizar token de um usuário específico
function updateUserToken(userKey) {
  if (!newTokens[userKey] || !userData[userKey]) {
    console.error(`❌ Usuário '${userKey}' não encontrado`);
    return false;
  }

  const token = newTokens[userKey];
  const user = userData[userKey];

  // Atualizar localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));

  console.log(`✅ Token atualizado para ${user.name} (${user.userType})`);
  console.log(`🔑 Novo token: ${token.substring(0, 50)}...`);
  
  return true;
}

// Função para listar tokens disponíveis
function listAvailableUsers() {
  console.log('👥 Usuários disponíveis para atualização de token:');
  Object.keys(userData).forEach(key => {
    const user = userData[key];
    console.log(`- ${key}: ${user.name} (${user.userType})`);
  });
}

// Função para verificar token atual
function checkCurrentToken() {
  const currentToken = localStorage.getItem('token');
  const currentUser = localStorage.getItem('user');
  
  if (currentToken && currentUser) {
    const user = JSON.parse(currentUser);
    console.log('🔍 Token atual:');
    console.log(`- Usuário: ${user.name} (${user.userType})`);
    console.log(`- Token: ${currentToken.substring(0, 50)}...`);
  } else {
    console.log('❌ Nenhum token encontrado no localStorage');
  }
}

// Instruções de uso
console.log('🚀 Script de Atualização de Tokens JWT');
console.log('=====================================');
console.log('');
console.log('📋 Comandos disponíveis:');
console.log('- listAvailableUsers() - Lista usuários disponíveis');
console.log('- checkCurrentToken() - Verifica token atual');
console.log('- updateUserToken("userKey") - Atualiza token do usuário');
console.log('');
console.log('👤 Exemplos de uso:');
console.log('- updateUserToken("arah") - Para passageiro arah');
console.log('- updateUserToken("motorista-ativo") - Para motorista');
console.log('- updateUserToken("passageiro-teste") - Para passageiro teste');
console.log('');

// Executar automaticamente
listAvailableUsers();
console.log('');
checkCurrentToken();

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.updateUserToken = updateUserToken;
  window.listAvailableUsers = listAvailableUsers;
  window.checkCurrentToken = checkCurrentToken;
}