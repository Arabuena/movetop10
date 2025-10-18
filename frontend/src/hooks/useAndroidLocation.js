import { useState, useEffect } from 'react';
import logger from '../utils/logger';

const useAndroidLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isGPSEnabled, setIsGPSEnabled] = useState(false);

  useEffect(() => {
    const checkGPSStatus = async () => {
      try {
        // Verificar se estamos no Android
        if (!window.Android) {
          logger.debug('Não estamos no ambiente Android');
          return;
        }

        // Verificar status do GPS
        const gpsEnabled = await window.Android.isGPSEnabled();
        setIsGPSEnabled(gpsEnabled);

        if (!gpsEnabled) {
          setError('GPS desativado');
          logger.warn('GPS está desativado');
          // Solicitar ativação do GPS
          window.Android.requestGPSEnable();
          return;
        }

        // Verificar permissões
        const hasPermission = await window.Android.hasLocationPermission();
        if (!hasPermission) {
          setError('Permissão de localização negada');
          logger.warn('Permissão de localização não concedida');
          // Solicitar permissão
          window.Android.requestLocationPermission();
          return;
        }

        // Iniciar monitoramento de localização
        window.Android.startLocationUpdates();
      } catch (err) {
        logger.error('Erro ao verificar status do GPS:', err);
        setError('Erro ao verificar status do GPS');
      }
    };

    checkGPSStatus();

    // Listener para atualizações de localização
    const handleLocationUpdate = (payload) => {
      try {
        // A interface Android injeta um objeto literal (não string)
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        const lat = typeof data.lat === 'number' ? data.lat : (typeof data.latitude === 'number' ? data.latitude : null);
        const lng = typeof data.lng === 'number' ? data.lng : (typeof data.longitude === 'number' ? data.longitude : null);
        const accuracy = typeof data.accuracy === 'number' ? data.accuracy : null;
        const timestamp = typeof data.timestamp === 'number' ? data.timestamp : Date.now();

        if (lat != null && lng != null) {
          setLocation({ lat, lng, accuracy, timestamp });
          setError(null);
        } else {
          logger.warn('Atualização de localização sem lat/lng válidos:', data);
        }
      } catch (err) {
        logger.error('Erro ao processar localização:', err);
        setError('Erro ao processar localização');
      }
    };

    // Registrar callback no objeto window
    window.onLocationUpdate = handleLocationUpdate;

    return () => {
      // Limpar quando o componente for desmontado
      if (window.Android) {
        window.Android.stopLocationUpdates();
      }
      window.onLocationUpdate = null;
    };
  }, []);

  return {
    location,
    error,
    isGPSEnabled
  };
};

export default useAndroidLocation;