import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import MaskedInput from '../../../components/common/MaskedInput';

const PassengerRegister = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setLoading(true);

    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const formData = {
        name: e.target.name.value,
        phone: e.target.phone.value.replace(/\D/g, ''),
        email: e.target.email.value,
        cpf: e.target.cpf.value.replace(/\D/g, ''),
        password,
        userType: 'passenger',
        status: 'offline'
      };

      await register(formData, 'passenger');
      navigate('/passenger');
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Criar conta de passageiro
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="name" className="sr-only">Nome completo</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-move-primary focus:border-move-primary focus:z-10 sm:text-sm"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-move-primary focus:border-move-primary focus:z-10 sm:text-sm"
              placeholder="Email"
            />
          </div>
          <div>
            <label htmlFor="cpf" className="sr-only">CPF</label>
            <MaskedInput
              id="cpf"
              name="cpf"
              mask="cpf"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-move-primary focus:border-move-primary focus:z-10 sm:text-sm"
              placeholder="CPF"
            />
          </div>
          <div>
            <label htmlFor="phone" className="sr-only">Telefone</label>
            <MaskedInput
              id="phone"
              name="phone"
              mask="phone"
              required
              className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-move-primary focus:border-move-primary focus:z-10 sm:text-sm"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-move-primary focus:border-move-primary focus:z-10 sm:text-sm"
              placeholder="Senha"
              minLength="6"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="sr-only">Confirmar Senha</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-move-primary focus:border-move-primary focus:z-10 sm:text-sm"
              placeholder="Confirmar Senha"
              minLength="6"
            />
          </div>
        </div>

        {passwordError && (
          <div className="text-sm text-red-600">
            {passwordError}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-move-primary hover:bg-move-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-move-primary"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </div>

        <div className="text-sm text-center">
          <Link
            to="/login/passenger"
            className="font-medium text-move-primary hover:text-move-primary/90"
          >
            Já tem uma conta? Entrar
          </Link>
        </div>
      </form>
    </div>
  );
};

export default PassengerRegister;
