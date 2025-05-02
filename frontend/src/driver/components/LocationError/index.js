import React from 'react';
import { FiMapPin, FiAlertCircle } from 'react-icons/fi';

const LocationError = ({ error }) => {
  const isAndroid = !!window.Android;

  const handleEnableGPS = () => {
    if (isAndroid) {
      window.Android.requestGPSEnable();
    }
  };

  const handleRequestPermission = () => {
    if (isAndroid) {
      window.Android.requestLocationPermission();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <FiMapPin className="w-6 h-6 text-red-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-center mb-2">
          Localização Indisponível
        </h3>
        
        <p className="text-gray-600 text-center mb-4">
          {error === 'GPS desativado' ? (
            'Por favor, ative o GPS do seu dispositivo para continuar.'
          ) : error === 'Permissão de localização negada' ? (
            'Precisamos da sua permissão para acessar a localização.'
          ) : (
            'Não foi possível obter sua localização. Verifique as configurações do seu dispositivo.'
          )}
        </p>

        <div className="flex justify-center">
          {error === 'GPS desativado' ? (
            <button
              onClick={handleEnableGPS}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Ativar GPS
            </button>
          ) : error === 'Permissão de localização negada' ? (
            <button
              onClick={handleRequestPermission}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Permitir Localização
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LocationError; 