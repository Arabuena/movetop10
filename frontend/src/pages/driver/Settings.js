import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import NotificationSettings from '../../components/driver/NotificationSettings';
import PreferenceSettings from '../../components/driver/PreferenceSettings';
import SecuritySettings from '../../components/driver/SecuritySettings';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSave = async (settings) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await api.put('/driver/settings', settings);
      setSuccess('Configurações salvas com sucesso');
    } catch (error) {
      setError('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Configurações
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gerencie suas preferências
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
        {error && (
          <div className="mb-6 bg-red-100 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-100 text-green-600 p-4 rounded-lg">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Notificações */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Notificações
              </h2>
              <NotificationSettings
                onSave={handleSave}
                disabled={loading}
              />
            </div>
          </div>

          {/* Preferências */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Preferências de corrida
              </h2>
              <PreferenceSettings
                onSave={handleSave}
                disabled={loading}
              />
            </div>
          </div>

          {/* Segurança */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Segurança
              </h2>
              <SecuritySettings
                onSave={handleSave}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 