import React, { useState } from 'react';

const PreferenceSettings = ({ onSave, disabled }) => {
  const [settings, setSettings] = useState({
    maxDistance: 10,
    minRating: 4.0,
    autoAccept: false,
    preferredRegions: [],
    workHours: {
      start: '08:00',
      end: '18:00'
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    const newSettings = { ...settings, [name]: newValue };
    setSettings(newSettings);
    onSave({ preferences: newSettings });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="maxDistance" className="block text-sm font-medium text-gray-700">
          Distância máxima para corridas (km)
        </label>
        <input
          type="range"
          id="maxDistance"
          name="maxDistance"
          min="1"
          max="20"
          value={settings.maxDistance}
          onChange={handleChange}
          disabled={disabled}
          className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="mt-1 text-sm text-gray-500">
          {settings.maxDistance} km
        </div>
      </div>

      <div>
        <label htmlFor="minRating" className="block text-sm font-medium text-gray-700">
          Avaliação mínima do passageiro
        </label>
        <select
          id="minRating"
          name="minRating"
          value={settings.minRating}
          onChange={handleChange}
          disabled={disabled}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 rounded-md"
        >
          <option value="3.0">3.0+</option>
          <option value="3.5">3.5+</option>
          <option value="4.0">4.0+</option>
          <option value="4.5">4.5+</option>
        </select>
      </div>

      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoAccept"
            name="autoAccept"
            checked={settings.autoAccept}
            onChange={handleChange}
            disabled={disabled}
            className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label htmlFor="autoAccept" className="ml-3 text-sm text-gray-700">
            Aceitar corridas automaticamente
          </label>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          As corridas serão aceitas automaticamente se atenderem aos critérios acima
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Horário de trabalho
        </label>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="workStart" className="block text-sm text-gray-500">
              Início
            </label>
            <input
              type="time"
              id="workStart"
              name="workHours.start"
              value={settings.workHours.start}
              onChange={handleChange}
              disabled={disabled}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <div>
            <label htmlFor="workEnd" className="block text-sm text-gray-500">
              Fim
            </label>
            <input
              type="time"
              id="workEnd"
              name="workHours.end"
              value={settings.workHours.end}
              onChange={handleChange}
              disabled={disabled}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferenceSettings; 