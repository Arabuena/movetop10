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
  const [lastRefineAt, setLastRefineAt] = useState(0);
  const [refineAttempts, setRefineAttempts] = useState(0);
  const [boostActive, setBoostActive] = useState(false);
  const [boostIntervalId, setBoostIntervalId] = useState(null);
  const [boostTimeoutId, setBoostTimeoutId] = useState(null);
  // Mapa sempre disponível imediatamente (sem espera)
  const [readyForMap, setReadyForMap] = useState(true);
  const [mapCountdown, setMapCountdown] = useState(0);
  const [mapCountdownIntervalId, setMapCountdownIntervalId] = useState(null);
  // Fallback por rede/IP (Google Geolocation API)
  const [coarseFallbackTried, setCoarseFallbackTried] = useState(false);

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

  // Sem gating: garantir que o mapa esteja marcado como pronto ao montar
  useEffect(() => {
    setReadyForMap(true);
    setMapCountdown(0);
    if (mapCountdownIntervalId) {
      clearInterval(mapCountdownIntervalId);
      setMapCountdownIntervalId(null);
    }
  }, []);

  useEffect(() => {
    // Mapa já está pronto por padrão; manter coerência
    if (!readyForMap) {
      setReadyForMap(true);
    }
  }, [locationPrecision, readyForMap]);

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

  // Tenta refinar a precisão quando recebemos leituras com precisão baixa
  const refineLowPrecision = () => {
    if (!navigator.geolocation) return;
    const now = Date.now();
    // Limitar frequência das tentativas de refinamento (mais agressivo)
    if (now - lastRefineAt < 5000 || refineAttempts >= 12) {
      return;
    }
    setLastRefineAt(now);
    setRefineAttempts((n) => n + 1);

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const refined = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isDefault: false
        };
        setLocation(refined);
        if (position.coords.accuracy <= 10) {
          setLocationPrecision('alta');
        } else if (position.coords.accuracy <= 100) {
          setLocationPrecision('média');
          // Se atingimos <= 100m, encerrar qualquer boost ativo
          if (boostIntervalId) {
            clearInterval(boostIntervalId);
            setBoostIntervalId(null);
          }
          if (boostTimeoutId) {
            clearTimeout(boostTimeoutId);
            setBoostTimeoutId(null);
          }
          setBoostActive(false);
        } else {
          setLocationPrecision('baixa');
        }
      },
      (err) => {
        // Se falhar, tenta próxima estratégia de forma controlada
        handleGeolocationError(err);
      },
      options
    );
  };

  // Inicia um "boost" de precisão por um período (padrão 60s),
  // solicitando leituras de alta precisão em intervalos curtos.
  const startPrecisionBoost = (durationMs = 60000) => {
    if (!navigator.geolocation || boostActive) return;
    setBoostActive(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const refined = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            isDefault: false
          };
          setLocation(refined);
          if (position.coords.accuracy <= 10) {
            setLocationPrecision('alta');
          } else if (position.coords.accuracy <= 100) {
            setLocationPrecision('média');
          } else {
            setLocationPrecision('baixa');
          }

          // Se atingiu precisão aceitável, encerrar boost mais cedo
          if (position.coords.accuracy <= 100) {
            clearInterval(intervalId);
            if (boostTimeoutId) clearTimeout(boostTimeoutId);
            setBoostActive(false);
            setBoostIntervalId(null);
            setBoostTimeoutId(null);
          }
        },
        (err) => {
          // Em caso de erro, manter o boost até o tempo acabar
          handleGeolocationError(err);
        },
        options
      );
    }, 5000); // tentar a cada 5s durante 60s

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setBoostActive(false);
      setBoostIntervalId(null);
      setBoostTimeoutId(null);
    }, durationMs);

    setBoostIntervalId(intervalId);
    setBoostTimeoutId(timeoutId);
  };

  // Usa a Google Geolocation API para obter localização aproximada via rede/IP
  const getCoarseLocation = async () => {
    try {
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      // Primeiro tentar Google Geolocation API (melhor quando disponível)
      if (apiKey) {
        const resp = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}` , {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.location) {
            const refined = {
              latitude: data.location.lat,
              longitude: data.location.lng,
              accuracy: typeof data.accuracy === 'number' ? data.accuracy : 1000,
              isDefault: false
            };
            setLocation(refined);
            if (refined.accuracy <= 10) {
              setLocationPrecision('alta');
            } else if (refined.accuracy <= 100) {
              setLocationPrecision('média');
            } else {
              setLocationPrecision('baixa');
            }
            // Abrir mapa imediatamente e tentar refinar após fallback
            setReadyForMap(true);
            setMapCountdown(0);
            if (permissionStatus === 'granted' && !boostActive) {
              startPrecisionBoost(45000);
              refineLowPrecision();
            }
            return refined;
          }
        } else {
          console.warn('Falha na Google Geolocation API:', resp.status);
        }
      }

      // Fallback: usar IP geolocation público (ipapi.co)
      const ipResp = await fetch('https://ipapi.co/json/');
      if (ipResp.ok) {
        const ipData = await ipResp.json();
        if (ipData && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
          const refined = {
            latitude: ipData.latitude,
            longitude: ipData.longitude,
            accuracy: 1500, // aproximado
            isDefault: false
          };
          setLocation(refined);
          setLocationPrecision('baixa');
          // Abrir mapa imediatamente e tentar refinar após fallback
          setReadyForMap(true);
          setMapCountdown(0);
          if (permissionStatus === 'granted' && !boostActive) {
            startPrecisionBoost(45000);
            refineLowPrecision();
          }
          return refined;
        }
      }
      return null;
    } catch (e) {
      console.error('Erro ao obter localização aproximada:', e);
      return null;
    }
  };

  // Permite a UI dispensar o modal de erro de localização
  const dismissLocationError = () => {
    setError(null);
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

  // Removido: variação aleatória que causava diferenças artificiais na localização

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
      
      // Usar localização padrão fixa (Goiânia) como fallback sem variação
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
        
        // Usar localização padrão fixa (Goiânia) como fallback quando a permissão é negada
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
        
        // Usar localização padrão fixa quando a posição está indisponível
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
        
        // Usar localização padrão fixa para qualquer outro erro
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
          setError('Geolocalização não é suportada por este navegador. Usando localização padrão.');
          setLocationPrecision('baixa');
          
          // Usar localização padrão fixa quando a geolocalização não é suportada
          setLocation({
            latitude: -16.6869,
            longitude: -49.2648,
            accuracy: 1000,
            isDefault: true
          });
          return;
        }

        // Se a permissão já foi negada, não tenta novamente
        if (permissionStatus === 'denied') {
          setError('Permissão de localização negada. Usando localização padrão.');
          setLocationPrecision('baixa');
          
          // Usar localização padrão fixa quando a permissão já foi negada
          setLocation({
            latitude: -16.6869,
            longitude: -49.2648,
            accuracy: 1000,
            isDefault: true
          });
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
            // Se a precisão inicial for baixa, iniciar boost imediatamente
            if (position.coords.accuracy > 100 && !boostActive) {
              startPrecisionBoost(60000);
            }
            
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
      // Forçar alta precisão contínua para leituras do passageiro
      const watchOptions = {
        ...options,
        enableHighAccuracy: true,
        timeout: Math.min((options && options.timeout) || 20000, 20000),
        maximumAge: 0
      };

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
            // Se a precisão permanecer baixa e permissão concedida, tentar refinamento adicional
            if (permissionStatus === 'granted') {
              refineLowPrecision();
              if (!boostActive) {
                startPrecisionBoost(60000);
              }
            }
          }
          
          console.log(`Localização atualizada, precisão: ${position.coords.accuracy}m`);
        },
        (err) => {
          handleGeolocationError(err);
        },
        watchOptions
      );
    };

    getLocation();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (boostIntervalId) clearInterval(boostIntervalId);
      if (boostTimeoutId) clearTimeout(boostTimeoutId);
    };
  }, [currentStrategyIndex]);

  // Tentar fallback aproximado se permanecer em baixa precisão por 60s
  useEffect(() => {
    if (coarseFallbackTried) return;
    if (locationPrecision !== 'baixa') return;
    const tId = setTimeout(() => {
      if (!coarseFallbackTried && locationPrecision === 'baixa') {
        getCoarseLocation();
        setCoarseFallbackTried(true);
      }
    }, 60000);
    return () => clearTimeout(tId);
  }, [locationPrecision, coarseFallbackTried]);

  return { 
    location, 
    error, 
    permissionStatus,
    requestPermission,
    locationPrecision,
    readyForMap,
    mapCountdown,
    // Expor utilitários para UI acionar refinamento/boost manualmente
    refineLowPrecision,
    startPrecisionBoost,
    getCoarseLocation,
    dismissLocationError
  };
};