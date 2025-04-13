import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import PhoneInput from '../../../components/common/PhoneInput';
import Button from '../../../components/common/Button';

const DriverLogin = () => {
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
      await login(phone.replace(/\D/g, ''), 'driver');
      navigate('/driver');
    } catch (err) {
      setError('Número de telefone não encontrado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold text-99-gray-900">
          Entrar como motorista
        </h2>
      </div>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <PhoneInput
              id="driver-login-phone"
              name="phone"
              label="Número de celular"
              ref={phoneRef}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(99) 99999-9999"
              error={error}
              required
              aria-required="true"
              aria-invalid={!!error}
              autoComplete="tel"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="text-sm text-center">
            <Link
              to="/register/driver"
              className="font-medium text-99-primary hover:text-99-primary/90"
            >
              Ainda não tem conta? Cadastre-se
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default DriverLogin; 