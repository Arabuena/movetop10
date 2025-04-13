import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import PhoneInput from '../../../components/common/PhoneInput';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const DriverRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    }
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
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register(formData, 'driver');
      navigate('/driver');
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
          Cadastro de motorista
        </h2>
        <p className="mt-2 text-center text-sm text-99-gray-600">
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
            </>
          )}

          {step === 2 && (
            <>
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

              <Input
                label="CNH"
                id="cnh"
                name="cnh"
                type="text"
                value={formData.cnh}
                onChange={handleChange}
                required
              />
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
            <div className="text-sm text-99-primary">
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

export default DriverRegister;
