import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Logo from '../../../components/common/Logo';
import MaskedInput from '../../../components/common/MaskedInput';
import { toast } from 'react-hot-toast';

const DriverRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: '',
    cnh: '',
    vehicle: {
      model: '',
      plate: '',
      year: '',
      color: ''
    },
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('vehicle.')) {
      const vehicleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhoneChange = (e) => {
    setFormData(prev => ({
      ...prev,
      phone: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 2) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('As senhas não coincidem');
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const submitData = { ...formData };
      delete submitData.confirmPassword; // Remove o campo de confirmação antes de enviar
      await register(submitData, 'driver');
      toast.success('Conta criada com sucesso!');
      navigate('/driver');
    } catch (err) {
      toast.error('Erro ao criar conta');
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Logo className="mx-auto h-12 w-auto mb-8" />
        <h2 className="text-center text-2xl font-bold text-move-gray-900">
          Cadastro de motorista
        </h2>
        <p className="mt-2 text-center text-sm text-move-gray-600">
          Etapa {step} de 3
        </p>
      </div>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <>
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
                <label htmlFor="phone" className="block text-sm font-medium text-move-gray-700">
                  Celular
                </label>
                <div className="mt-1">
                  <MaskedInput
                    id="phone"
                    name="phone"
                    mask="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required
                    placeholder="(00) 00000-0000"
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
            </>
          )}

          {step === 2 && (
            <>
              <MaskedInput
                id="cpf"
                name="cpf"
                mask="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                placeholder="CPF"
              />

              <MaskedInput
                id="cnh"
                name="cnh"
                mask="cnh"
                value={formData.cnh}
                onChange={handleChange}
                required
                placeholder="CNH"
              />

              <Input
                label="Senha"
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Senha"
              />

              <Input
                label="Confirmar Senha"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Confirmar Senha"
              />

              {passwordError && (
                <div className="text-sm text-red-600">
                  {passwordError}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Input
                label="Modelo do veículo"
                id="vehicle.model"
                name="vehicle.model"
                type="text"
                value={formData.vehicle.model}
                onChange={handleChange}
                required
              />

              <Input
                label="Placa"
                id="vehicle.plate"
                name="vehicle.plate"
                type="text"
                value={formData.vehicle.plate}
                onChange={handleChange}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ano"
                  id="vehicle.year"
                  name="vehicle.year"
                  type="number"
                  value={formData.vehicle.year}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Cor"
                  id="vehicle.color"
                  name="vehicle.color"
                  type="text"
                  value={formData.vehicle.color}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

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
            {step < 3 ? 'Continuar' : loading ? 'Criando conta...' : 'Criar conta'}
          </Button>

          <div className="text-sm text-center">
            <Link
              to="/login/driver"
              className="font-medium text-move-primary hover:text-move-primary/90"
            >
              Já tem uma conta? Entre aqui
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default DriverRegister;
