import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import PhoneInput from '../../../components/common/PhoneInput';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const PassengerRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (value) => {
    // Garante que apenas a string do número seja armazenada
    const phoneValue = typeof value === 'string'
      ? value
      : value?.target?.value || value?.value || '';

    setFormData((prev) => ({
      ...prev,
      phone: phoneValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await register(formData, 'passenger');
      navigate('/passenger');
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold text-99-gray-900">
          Cadastro de passageiro
        </h2>
        <p className="mt-2 text-center text-sm text-99-gray-600">
          Comece a viajar com a 99
        </p>
      </div>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome completo"
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-99-gray-700">
              Celular
            </label>
            <div className="mt-1">
              <PhoneInput
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                required
              />
            </div>
          </div>

          <Input
            label="E-mail"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="CPF"
            id="cpf"
            name="cpf"
            type="text"
            value={formData.cpf}
            onChange={handleChange}
            required
            mask="999.999.999-99"
          />

          {error && (
            <div className="text-sm text-99-primary">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>

          <div className="text-sm text-center">
            <Link
              to="/login/passenger"
              className="font-medium text-99-primary hover:text-99-primary/90"
            >
              Já tem uma conta? Entre aqui
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default PassengerRegister;
