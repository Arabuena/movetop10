import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm = () => {
  const [userType, setUserType] = useState('passenger');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'passenger'
  });

  // Campos adicionais para motoristas
  const [driverData, setDriverData] = useState({
    vehicle: {
      model: '',
      plate: '',
      year: ''
    },
    documents: {
      license: '',
      insurance: ''
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      ...(userType === 'driver' && { 
        vehicle: driverData.vehicle,
        documents: driverData.documents
      })
    };
    // Lógica de submissão
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Tipo de Usuário
        </label>
        <select 
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value);
            setFormData({...formData, role: e.target.value});
          }}
          className="w-full p-2 border rounded"
        >
          <option value="passenger">Passageiro</option>
          <option value="driver">Motorista</option>
        </select>
      </div>

      {/* Campos comuns */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Nome completo"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-4">
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Campos específicos para motoristas */}
      {userType === 'driver' && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-bold mb-2">Informações do Veículo</h3>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Modelo do veículo"
              value={driverData.vehicle.model}
              onChange={(e) => setDriverData({
                ...driverData,
                vehicle: {...driverData.vehicle, model: e.target.value}
              })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Placa do veículo"
              value={driverData.vehicle.plate}
              onChange={(e) => setDriverData({
                ...driverData,
                vehicle: {...driverData.vehicle, plate: e.target.value}
              })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      )}

      <button 
        type="submit"
        onClick={handleSubmit}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Registrar
      </button>
    </div>
  );
};

export default RegisterForm; 