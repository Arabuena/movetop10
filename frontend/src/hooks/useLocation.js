import { useState, useEffect } from 'react';

// Estratégia de tentativas progressivas para obter localização
const LOCATION_STRATEGIES = [
  {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
    description: 'Alta precisão'
  },
  {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0,
    description: 'Alta precisão com timeout estendido'
  },
  {
    enableHighAccuracy: false,
    timeout: 20000,
    maximumAge: 30000,
    description: 'Precisão padrão'
  }
];

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [currentStrategyIndex, setCurrentStrategyIndex] = useState(0);
  const [locationPrecision, setLocationPrecision] = useState('buscando');

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

  // Solicita novamente a localização real com a próxima estratégia
  const tryNextStrategy = () => {
    const nextIndex = (currentStrategyIndex + 1) % LOCATION_STRATEGIES.length;
    console.log(`Tentando estratégia ${nextIndex + 1}/${LOCATION_STRATEGIES.length}: ${LOCATION_STRATEGIES[nextIndex].description}`);
    
    setCurrentStrategyIndex(nextIndex);
    
    if (navigator.geolocation) {
      const strategy = LOCATION_STRATEGIES[nextIndex];
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const realLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            isDefault: false
          };
          setLocation(realLocation);
          setError(null);
          
          // Definir nível de precisão baseado na accuracy
          if (position.coords.accuracy <= 10) {
            setLocationPrecision('alta');
          } else if (position.coords.accuracy <= 100) {
            setLocationPrecision('média');
          } else {
            setLocationPrecision('baixa');
          }
          
          console.log(`Localização obtida com estratégia ${nextIndex + 1}, precisão: ${position.coords.accuracy}m`);
        },
        (err) => {
          console.error(`Falha na estratégia ${nextIndex + 1}:`, err);
          
          // Se ainda houver estratégias para tentar
          if (nextIndex < LOCATION_STRATEGIES.length - 1) {
            tryNextStrategy();
          } else {
            // Todas as estratégias falharam
            setError('Não foi possível obter sua localização. Por favor, verifique suas configurações de GPS.');
            setLocationPrecision('indisponível');
          }
        },
        strategy
      );
    }
  };

  // Solicita permissão de geolocalização explicitamente
  const requestPermission = () => {
    if (navigator.geolocation) {
      // Oculta o erro imediatamente quando o usuário clica no botão
      setError(null);
      
      navigator.geolocation.getCurrentPosition(
        () => {
          // Permissão concedida, atualizará automaticamente via watchPosition
          setError(null);
        },
        (err) => {
          // Só mostra o erro se realmente falhar após a tentativa
          handleGeolocationError(err);
        }
      );
    }
  };

  // Trata os erros de geolocalização com mensagens específicas
  const handleGeolocationError = (err) => {
    // Para erros de timeout, tentar próxima estratégia
    if (err && err.code === 3) { // TIMEOUT
      console.log('Timeout ao obter localização, tentando próxima estratégia');
      tryNextStrategy();
      return;
    }
    
    // Verifica se o erro é um objeto válido antes de acessar propriedades
    if (!err || typeof err !== 'object' || !err.code) {
      console.error('Erro de geolocalização desconhecido:', err || 'Erro vazio');
      setError('Erro ao obter localização. Verifique suas configurações de GPS.');
      setLocationPrecision('indisponível');
      
      // Usar localização padrão para erro desconhecido
      setLocation({
        latitude: -16.6869,
        longitude: -49.2648,
        accuracy: 1000,
        isDefault: true
      });
      return;
    }
    
    // Evita logar repetidamente o mesmo erro de permissão negada
    if (err.code !== 1) {
      console.error('Erro de geolocalização:', err);
    }
    
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        // Atualiza o status de permissão para evitar novas tentativas
        setPermissionStatus('denied');
        // Mostra o erro apenas uma vez
        if (error === null) {
          setError('Permissão de localização negada. Por favor, habilite nas configurações do navegador.');
        }
        setLocationPrecision('indisponível');
        
        // Usar localização padrão de Goiânia como fallback quando a permissão é negada
        setLocation({
          latitude: -16.6869,
          longitude: -49.2648,
          accuracy: 1000,
          isDefault: true
        });
        break;
      case 2: // POSITION_UNAVAILABLE
        setError('Localização indisponível. Verifique se o GPS está ativado.');
        setLocationPrecision('indisponível');
        
        // Usar localização padrão quando a posição está indisponível
        setLocation({
          latitude: -16.6869,
          longitude: -49.2648,
          accuracy: 1000,
          isDefault: true
        });
        break;
      default:
        setError('Erro ao obter localização.');
        setLocationPrecision('indisponível');
        
        // Usar localização padrão para qualquer outro erro
        setLocation({
          latitude: -16.6869,
          longitude: -49.2648,
          accuracy: 1000,
          isDefault: true
        });
    }
  };

  useEffect(() => {
    // Verificar status de permissão ao iniciar
    checkPermissionStatus();
    
    let watchId;

    const getLocation = async () => {
      try {
        if (!navigator.geolocation) {
          setError('Geolocalização não suportada neste navegador.');
          setLocationPrecision('indisponível');
          return;
        }

        // Se a permissão já foi negada, não tenta novamente
        if (permissionStatus === 'denied') {
          // Usar localização padrão de Goiânia como fallback
          setLocation({
            latitude: -16.6869,
            longitude: -49.2648,
            accuracy: 1000,
            isDefault: true
          });
          setLocationPrecision('baixa');
          return;
        }

        // Usar a primeira estratégia
        const strategy = LOCATION_STRATEGIES[currentStrategyIndex];
        console.log(`Iniciando com estratégia ${currentStrategyIndex + 1}/${LOCATION_STRATEGIES.length}: ${strategy.description}`);

        // Solicita permissão explicitamente primeiro
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Localização inicial obtida com sucesso
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              isDefault: false
            });
            setError(null);
            
            // Definir nível de precisão baseado na accuracy
            if (position.coords.accuracy <= 10) {
              setLocationPrecision('alta');
            } else if (position.coords.accuracy <= 100) {
              setLocationPrecision('média');
            } else {
              setLocationPrecision('baixa');
            }
            
            console.log(`Localização inicial obtida, precisão: ${position.coords.accuracy}m`);
            
            // Agora inicia o monitoramento contínuo
            startWatchPosition(strategy);
          },
          (err) => {
            console.error('Erro ao obter localização inicial:', err);
            handleGeolocationError(err);
          },
          strategy
        );
      } catch (err) {
        console.error('Erro ao configurar geolocalização:', err);
        tryNextStrategy();
      }
    };
    
    // Função para iniciar o monitoramento contínuo
    const startWatchPosition = (options) => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            isDefault: false
          });
          setError(null);
          
          // Atualizar nível de precisão baseado na accuracy
          if (position.coords.accuracy <= 10) {
            setLocationPrecision('alta');
          } else if (position.coords.accuracy <= 100) {
            setLocationPrecision('média');
          } else {
            setLocationPrecision('baixa');
          }
          
          console.log(`Localização atualizada, precisão: ${position.coords.accuracy}m`);
        },
        (err) => {
          handleGeolocationError(err);
        },
        options
      );
    };

    getLocation();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [currentStrategyIndex]);

  return { 
    location, 
    error, 
    permissionStatus,
    requestPermission,
    locationPrecision
  };
};