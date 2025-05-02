import { useState, useEffect } from 'react';
import logger from '../../utils/logger';

const useLocation = (enabled = true) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  const requestPermission = async () => {
    try {
      // Verifica se o navegador suporta a API de permissões
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(result.state);
        
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      }
    } catch (err) {
      logger.error('Erro ao verificar permissão:', err);
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    let watchId;

    const startWatching = () => {
      if (!navigator.geolocation) {
        setError('Geolocalização não suportada neste dispositivo');
        return;
      }

      // Configurações específicas para Android
      const options = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
        // Android requer um tempo mínimo (ms) e distância (metros) para updates
        distanceFilter: 10, // metros
        interval: 3000, // milliseconds
      };

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          setLocation(newLocation);
          setError(null);
          
          logger.debug('Localização atualizada:', newLocation);
        },
        (error) => {
          logger.error('Erro de geolocalização:', error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setError('Permissão de localização negada. Por favor, habilite nas configurações.');
              break;
            case error.POSITION_UNAVAILABLE:
              setError('Localização indisponível. Verifique se o GPS está ativado.');
              break;
            case error.TIMEOUT:
              setError('Tempo esgotado ao obter localização. Verifique sua conexão.');
              break;
            default:
              setError('Erro ao obter localização.');
          }
        },
        options
      );
    };

    if (enabled && permissionStatus !== 'denied') {
      startWatching();
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enabled, permissionStatus]);

  return { 
    location, 
    error,
    permissionStatus,
    requestPermission 
  };
};

export default useLocation; 