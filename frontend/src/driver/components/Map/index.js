// Map (driver) component
import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import logger from '../../../utils/logger';

const Map = ({ center, isOnline, currentRide }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  const defaultCenter = {
    lat: -16.5775095,
    lng: -49.3754792
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'greedy',
    clickableIcons: false,
    minZoom: 3,
    maxZoom: 20
  };

  const [directions, setDirections] = useState(null);

  useEffect(() => {
    // Quando há corrida aceita ou em andamento, calcular rota até o passageiro (accepted) ou destino (in_progress)
    try {
      if (!isLoaded || !window.google || !window.google.maps) return;
      const shouldShowRoute = currentRide && (currentRide.status === 'accepted' || currentRide.status === 'in_progress');

      // Centro efetivo: usa centro real se precisão <= 100m; caso contrário, usa origem da corrida se disponível
      const effectiveCenter = (() => {
        if (center && typeof center.accuracy === 'number' && center.accuracy <= 100 && !center.isDefault) {
          return center;
        }
        if (currentRide?.origin && typeof currentRide.origin.lat === 'number' && typeof currentRide.origin.lng === 'number') {
          return { lat: currentRide.origin.lat, lng: currentRide.origin.lng };
        }
        return null;
      })();

      if (!effectiveCenter || !currentRide || !shouldShowRoute) {
        setDirections(null);
        return;
      }

      const status = currentRide.status;
      const destination =
        status === 'in_progress'
          ? currentRide?.destination
            ? { lat: currentRide.destination.lat, lng: currentRide.destination.lng }
            : null
          : currentRide?.origin
            ? { lat: currentRide.origin.lat, lng: currentRide.origin.lng }
            : null;

      if (!destination) {
        setDirections(null);
        return;
      }

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: effectiveCenter,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, statusResult) => {
          if (statusResult === 'OK') {
            setDirections(result);
          } else {
            logger.warn('Driver Map: erro ao calcular rota:', statusResult);
            setDirections(null);
          }
        }
      );
    } catch (err) {
      logger.error('Driver Map: erro inesperado ao calcular rota:', err);
      setDirections(null);
    }
  }, [isLoaded, center, currentRide]);

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <p>Carregando mapa...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={(() => {
        // Escolhe o mesmo centro que será usado para o marcador
        if (center && typeof center.accuracy === 'number' && center.accuracy <= 100 && !center.isDefault) {
          return center;
        }
        if (currentRide?.origin) {
          return { lat: currentRide.origin.lat, lng: currentRide.origin.lng };
        }
        // Quando não há origem e a precisão é baixa/padrão, mantém um centro padrão
        return { lat: -16.5775095, lng: -49.3754792 };
      })()}
      zoom={15}
      options={mapOptions}
      
    >
      {/* Marcador do motorista: sempre mostra no centro escolhido */}
      {(() => {
        const markerPos = (() => {
          if (center && typeof center.accuracy === 'number' && center.accuracy <= 100 && !center.isDefault) {
            return center;
          }
          if (currentRide?.origin) {
            return { lat: currentRide.origin.lat, lng: currentRide.origin.lng };
          }
          return defaultCenter;
        })();

        return (
          <Marker
            position={markerPos}
            icon={{
              url: '/images/car-marker.svg',
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20)
            }}
          />
        );
      })()}

      {/* Marcadores de origem/destino do passageiro */}
      {currentRide?.origin && currentRide?.status !== 'in_progress' && (
        <Marker
          position={{ lat: currentRide.origin.lat, lng: currentRide.origin.lng }}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(28, 28)
          }}
          title="Ponto de encontro do passageiro"
        />
      )}

      {currentRide?.destination && (
        <Marker
          position={{ lat: currentRide.destination.lat, lng: currentRide.destination.lng }}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new window.google.maps.Size(28, 28)
          }}
          title="Destino da corrida"
        />
      )}

      {/* Rota desenhada quando disponível */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: currentRide?.status === 'in_progress' ? '#10B981' : '#3B82F6',
              strokeOpacity: 0.9,
              strokeWeight: 6
            }
          }}
        />
      )}
    </GoogleMap>
  );
};

export default React.memo(Map);