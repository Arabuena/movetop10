import logger from '../../utils/logger';

export const calculateRoute = async (origin, destination) => {
  try {
    const directionsService = new google.maps.DirectionsService();
    
    const result = await directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    });

    return {
      directions: result,
      distance: result.routes[0].legs[0].distance.value,
      duration: result.routes[0].legs[0].duration.value
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
      size: new google.maps.Size(32, 32)
    },
    passenger: {
      url: '/images/passenger-marker.png',
      size: new google.maps.Size(32, 32)
    },
    destination: {
      url: '/images/destination-marker.png',
      size: new google.maps.Size(32, 32)
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