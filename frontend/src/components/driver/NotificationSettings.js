import React, { useState } from 'react';

const NotificationSettings = ({ onSave, disabled }) => {
  const [settings, setSettings] = useState({
    newRides: true,
    rideUpdates: true,
    earnings: true,
    promotions: false,
    email: true,
    push: true,
    sound: true
  });

  const handleChange = (e) => {
    const { name, checked } = e.target;
    const newSettings = { ...settings, [name]: checked };
    setSettings(newSettings);
    onSave({ notifications: newSettings });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">
          Receber notificações de:
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="newRides"
              name="newRides"
              checked={settings.newRides}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="newRides" className="ml-3 text-sm text-gray-700">
              Novas corridas disponíveis
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rideUpdates"
              name="rideUpdates"
              checked={settings.rideUpdates}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="rideUpdates" className="ml-3 text-sm text-gray-700">
              Atualizações de corridas
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="earnings"
              name="earnings"
              checked={settings.earnings}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="earnings" className="ml-3 text-sm text-gray-700">
              Resumo de ganhos
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="promotions"
              name="promotions"
              checked={settings.promotions}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="promotions" className="ml-3 text-sm text-gray-700">
              Promoções e novidades
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-medium text-gray-700">
          Canais de notificação:
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="email"
              name="email"
              checked={settings.email}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="email" className="ml-3 text-sm text-gray-700">
              E-mail
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="push"
              name="push"
              checked={settings.push}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="push" className="ml-3 text-sm text-gray-700">
              Notificações push
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="sound"
              name="sound"
              checked={settings.sound}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="sound" className="ml-3 text-sm text-gray-700">
              Sons de notificação
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings; 