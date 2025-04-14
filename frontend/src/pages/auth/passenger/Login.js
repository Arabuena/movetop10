import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import PhoneInput from '../../../components/common/PhoneInput';
import Button from '../../../components/common/Button';

const PassengerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const phoneRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(phone.replace(/\D/g, ''), 'passenger');
      navigate('/passenger');
    } catch (err) {
      setError('Número de telefone não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
  };

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold text-move-gray-900">
          Entrar como passageiro
        </h2>
        <p className="mt-2 text-center text-sm text-move-gray-600">
          Viaje com a Move
        </p>
      </div>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <PhoneInput
              id="passenger-login-phone"
              name="phone"
              label="Número de celular"
              ref={phoneRef}
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(99) 99999-9999"
              error={error}
              required
              aria-required="true"
              aria-invalid={!!error}
              autoComplete="tel"
            />
          </div>

          {error && (
            <div className="text-sm text-move-primary">
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="text-sm text-center">
            <Link
              to="/register/passenger"
              className="font-medium text-move-primary hover:text-move-primary/90"
            >
              Ainda não tem conta? Cadastre-se
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default PassengerLogin; 