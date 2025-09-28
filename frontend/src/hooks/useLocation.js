import { useState, useEffect } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  // Verifica o status da permissão de geolocalização
  const checkPermissionStatus = async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(result.state);
        
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      }
    } catch (err) {
      console.error('Erro ao verificar permissão:', err);
    }
  };

  // Fornece uma localização padrão quando a geolocalização falha
  const fallbackLocation = () => {
    // Coordenadas de Goiânia como localização padrão
    const defaultLocation = {
      latitude: -16.6799,
      longitude: -49.2556,
      accuracy: 1000, // Precisão baixa para indicar que é uma localização aproximada
      isDefault: true // Flag para indicar que é uma localização padrão
    };
    
    setLocation(defaultLocation);
    console.log('Usando localização padrão:', defaultLocation);
  };

  // Solicita permissão de geolocalização explicitamente
  const requestPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Permissão concedida, atualizará automaticamente via watchPosition
          setError(null);
        },
        (err) => {
          handleGeolocationError(err);
        }
      );
    }
  };

  // Trata os erros de geolocalização com mensagens específicas
  const handleGeolocationError = (err) => {
    console.error('Erro de geolocalização:', err);
    
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        setError('Permissão de localização negada. Por favor, habilite nas configurações do navegador.');
        break;
      case 2: // POSITION_UNAVAILABLE
        setError('Localização indisponível. Verifique se o GPS está ativado.');
        break;
      case 3: // TIMEOUT
        setError('Tempo esgotado ao obter localização. Verifique sua conexão.');
        break;
      default:
        setError('Erro ao obter localização.');
    }
    
    // Usar localização padrão como fallback
    fallbackLocation();
  };

  useEffect(() => {
    // Verificar status de permissão ao iniciar
    checkPermissionStatus();
    
    let watchId;

    const getLocation = async () => {
      try {
        if (!navigator.geolocation) {
          setError('Geolocalização não suportada neste navegador.');
          fallbackLocation();
          return;
        }

        // Configurações para melhor precisão
        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        };

        // Monitorar posição continuamente
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              isDefault: false
            });
            setError(null);
          },
          (err) => {
            handleGeolocationError(err);
          },
          options
        );
      } catch (err) {
        console.error('Erro ao configurar geolocalização:', err);
        fallbackLocation();
      }
    };

    getLocation();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return { 
    location, 
    error, 
    permissionStatus,
    requestPermission,
    isDefaultLocation: location?.isDefault || false
  };
};