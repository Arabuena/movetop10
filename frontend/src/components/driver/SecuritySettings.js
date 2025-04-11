import React, { useState } from 'react';

const SecuritySettings = ({ onSave, disabled }) => {
  const [settings, setSettings] = useState({
    twoFactor: false,
    shareLocation: true,
    emergencyContacts: [],
    pinEnabled: false,
    pin: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    const newSettings = { ...settings, [name]: newValue };
    setSettings(newSettings);
    onSave({ security: newSettings });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactor"
              name="twoFactor"
              checked={settings.twoFactor}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="twoFactor" className="ml-3">
              <div className="text-sm font-medium text-gray-700">
                Autenticação em duas etapas
              </div>
              <div className="text-sm text-gray-500">
                Adicione uma camada extra de segurança à sua conta
              </div>
            </label>
          </div>
          <button
            type="button"
            className="text-sm text-yellow-600 hover:text-yellow-500"
            disabled={disabled || !settings.twoFactor}
          >
            Configurar
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pinEnabled"
              name="pinEnabled"
              checked={settings.pinEnabled}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="pinEnabled" className="ml-3">
              <div className="text-sm font-medium text-gray-700">
                PIN de segurança
              </div>
              <div className="text-sm text-gray-500">
                Solicitar PIN ao iniciar corridas
              </div>
            </label>
          </div>
          <button
            type="button"
            className="text-sm text-yellow-600 hover:text-yellow-500"
            disabled={disabled || !settings.pinEnabled}
          >
            Alterar PIN
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="shareLocation"
              name="shareLocation"
              checked={settings.shareLocation}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="shareLocation" className="ml-3">
              <div className="text-sm font-medium text-gray-700">
                Compartilhar localização
              </div>
              <div className="text-sm text-gray-500">
                Permitir que contatos de emergência acompanhem suas corridas
              </div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Contatos de emergência
        </label>
        <div className="mt-2 space-y-2">
          {settings.emergencyContacts.map((contact, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{contact.name}</div>
                <div className="text-sm text-gray-500">{contact.phone}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newContacts = settings.emergencyContacts.filter((_, i) => i !== index);
                  handleChange({
                    target: {
                      name: 'emergencyContacts',
                      value: newContacts
                    }
                  });
                }}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-yellow-600 hover:text-yellow-500"
            disabled={disabled}
          >
            + Adicionar contato
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings; 