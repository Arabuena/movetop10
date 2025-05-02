import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import MaskedInput from '../../../components/common/MaskedInput';
import { toast } from 'react-hot-toast';

const PassengerLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const phoneInput = e.target.phone;
      const phone = phoneInput.rawValue || phoneInput.value.replace(/\D/g, '');
      const password = e.target.password.value;

      console.log('Tentando login com:', {
        phone,
        originalValue: phoneInput.value,
        rawValue: phoneInput.rawValue
      });

      await login(phone, 'passenger', password);
      toast.success('Login realizado com sucesso!');
      navigate('/passenger');
    } catch (error) {
      console.error('Erro no login:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
      setError(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    console.log('Phone change:', {
      value: e.target.value,
      rawValue: e.target.rawValue
    });
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Login de Passageiro
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="phone" className="sr-only">
            Telefone
          </label>
          <MaskedInput
            id="phone"
            name="phone"
            mask="phone"
            required
            onChange={handlePhoneChange}
            placeholder="(00) 00000-0000"
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-move-primary focus:border-move-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="sr-only">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-move-primary focus:border-move-primary sm:text-sm"
            placeholder="Senha"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-move-primary hover:bg-move-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-move-primary"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        <div className="text-sm text-center">
          <Link
            to="/register/passenger"
            className="font-medium text-move-primary hover:text-move-primary/90"
          >
            Não tem uma conta? Cadastre-se
          </Link>
        </div>
      </form>
    </div>
  );
};

export default PassengerLogin; 