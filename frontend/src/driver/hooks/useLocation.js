import { useState, useEffect } from 'react';
import logger from '../../utils/logger';

const useLocation = (enabled = true) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [useDefaultLocation, setUseDefaultLocation] = useState(false);

  // Localização padrão para Goiânia
  const defaultLocation = {
    // Adicionar pequena variação aleatória para simular posições diferentes em testes
    lat: -16.6869 + (Math.random() - 0.5) * 0.01, // ~500m de variação
    lng: -49.2648 + (Math.random() - 0.5) * 0.01,
    accuracy: 1000,
    timestamp: Date.now(),
    isDefault: true
  };

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

  // Função para continuar com localização padrão
  const continueWithDefaultLocation = () => {
    setUseDefaultLocation(true);
    setLocation(defaultLocation);
    setError(null);
    logger.info('Usando localização padrão por escolha do usuário');
  };

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    let watchId;

    const startWatching = () => {
      if (!navigator.geolocation) {
        setError('Geolocalização não suportada neste dispositivo');
        setLocation(defaultLocation);
        return;
      }

      // Se o usuário optou por usar localização padrão, não tenta obter localização real
      if (useDefaultLocation) {
        setLocation(defaultLocation);
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

      // Usar localização padrão imediatamente para evitar atrasos
      setLocation(defaultLocation);
      
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Se o usuário optou por usar localização padrão, ignora atualizações reais
          if (useDefaultLocation) return;
          
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
          
          // Se o usuário já optou por usar localização padrão, não mostra erro
          if (useDefaultLocation) return;
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setError('Permissão de localização negada. Por favor, habilite nas configurações.');
              setLocation(defaultLocation);
              break;
            case error.POSITION_UNAVAILABLE:
              setError('Localização indisponível. Verifique se o GPS está ativado.');
              setLocation(defaultLocation);
              break;
            case error.TIMEOUT:
              setError('Tempo esgotado ao obter localização. Verifique sua conexão.');
              setLocation(defaultLocation);
              break;
            default:
              setError('Erro ao obter localização.');
              setLocation(defaultLocation);
          }
        },
        options
      );
    };

    if (enabled && (permissionStatus !== 'denied' || useDefaultLocation)) {
      startWatching();
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enabled, permissionStatus, useDefaultLocation]);

  return { 
    location, 
    error,
    permissionStatus,
    requestPermission,
    continueWithDefaultLocation
  };
};

export default useLocation;