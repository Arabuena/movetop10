import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import VehicleForm from '../../components/driver/VehicleForm';
import api from '../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    vehicle: user?.vehicle || {
      model: '',
      plate: '',
      year: '',
      color: ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVehicleChange = (vehicleData) => {
    setFormData(prev => ({
      ...prev,
      vehicle: vehicleData
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/driver/profile', formData);
      await updateUser(response.data);
      setIsEditing(false);
    } catch (error) {
      setError('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login/driver');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Meu Perfil
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gerencie suas informações pessoais
              </p>
            </div>
            <button
              onClick={() => navigate('/driver/home')}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <span className="material-icons-outlined">arrow_back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {/* Foto e informações básicas */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="relative">
                <img
                  src={user?.photo || '/images/default-avatar.png'}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-yellow-400 rounded-full p-2 text-white hover:bg-yellow-500">
                    <span className="material-icons-outlined text-sm">
                      photo_camera
                    </span>
                  </button>
                )}
              </div>
              <div>
                <h2 className="text-xl font-medium">{user?.name}</h2>
                <div className="flex items-center mt-1">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1">{user?.rating?.toFixed(1) || '5.0'}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({user?.totalRides || 0} corridas)
                  </span>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* Dados do veículo */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Dados do veículo
                </h3>
                <VehicleForm
                  data={formData.vehicle}
                  onChange={handleVehicleChange}
                  disabled={!isEditing}
                />
              </div>

              {error && (
                <div className="bg-red-100 text-red-600 p-4 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700"
                >
                  Sair da conta
                </button>

                <div className="space-x-4">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        {loading ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Editar perfil
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 