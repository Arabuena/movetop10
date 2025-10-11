import logger from '../../utils/logger';

export const calculateRoute = async (origin, destination) => {
  try {
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps não carregado');
    }

    const directionsService = new window.google.maps.DirectionsService();

    const result = await new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (res, status) => {
          if (status === 'OK') {
            resolve(res);
          } else {
            reject(new Error(`Erro ao calcular rota: ${status}`));
          }
        }
      );
    });

    const leg = result.routes?.[0]?.legs?.[0];

    return {
      directions: result,
      distance: leg?.distance?.value ?? null, // em metros
      duration: leg?.duration?.value ?? null  // em segundos
    };
  } catch (error) {
    logger.error('Erro ao calcular rota:', error);
    throw error;
  }
};

export const createMarkerIcon = (type) => {
  const icons = {
    driver: {
      url: '/images/car-marker.png',
      size: new window.google.maps.Size(32, 32)
    },
    passenger: {
      url: '/images/passenger-marker.png',
      size: new window.google.maps.Size(32, 32)
    },
    destination: {
      url: '/images/destination-marker.png',
      size: new window.google.maps.Size(32, 32)
    }
  };

  return {
    url: icons[type].url,
    scaledSize: icons[type].size
  };
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        logger.error('Erro ao obter localização:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  });
};