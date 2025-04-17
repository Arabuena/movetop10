import React, { useEffect, useState } from 'react';
import { GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';

const SharedRideMap = ({ 
  ride, 
  origin, 
  destination, 
  directions, 
  driverDirections,
  center,
  zoom = 14 
}) => {
  const [mainRoute, setMainRoute] = useState(null);
  const [driverRoute, setDriverRoute] = useState(null);

  // Calcular rotas quando os props mudarem
  useEffect(() => {
    console.log('SharedRideMap - Props atualizadas:', {
      'Tem origem?': !!origin,
      'Tem destino?': !!destination,
      'Status da corrida': ride?.status,
      'Tem motorista?': !!ride?.driver,
      'Localização do motorista': ride?.driver?.location
    });

    if (!origin || !destination) return;

    const directionsService = new window.google.maps.DirectionsService();

    // Rota principal (verde)
    directionsService.route(
      {
        origin: {
          lat: parseFloat(origin.lat),
          lng: parseFloat(origin.lng)
        },
        destination: {
          lat: parseFloat(destination.lat),
          lng: parseFloat(destination.lng)
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          console.log('Rota principal calculada');
          setMainRoute(result);
        }
      }
    );

    // Rota do motorista (azul) - se existir
    if (ride?.status === 'accepted' && ride?.driver?.location) {
      directionsService.route(
        {
          origin: {
            lat: parseFloat(ride.driver.location.lat),
            lng: parseFloat(ride.driver.location.lng)
          },
          destination: {
            lat: parseFloat(origin.lat),
            lng: parseFloat(origin.lng)
          },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            console.log('Rota do motorista calculada');
            setDriverRoute(result);
          }
        }
      );
    }
  }, [origin, destination, ride?.status, ride?.driver?.location]);

  return (
    <GoogleMap
      mapContainerStyle={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
      center={center || origin}
      zoom={zoom}
      options={{
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }}
    >
      {/* Rota principal (verde) */}
      {mainRoute && (
        <DirectionsRenderer
          directions={mainRoute}
          options={{
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#34D399',
              strokeWeight: 5,
              strokeOpacity: 0.8
            }
          }}
        />
      )}

      {/* Rota do motorista (azul) */}
      {driverRoute && (
        <DirectionsRenderer
          directions={driverRoute}
          options={{
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#3B82F6',
              strokeWeight: 5,
              strokeOpacity: 0.8
            }
          }}
        />
      )}

      {/* Marcadores */}
      {origin && (
        <Marker 
          position={origin}
          icon={{
            url: '/marker-origin.png',
            scaledSize: new window.google.maps.Size(40, 40)
          }}
        />
      )}
      {destination && (
        <Marker
          position={destination}
          icon={{
            url: '/marker-destination.png',
            scaledSize: new window.google.maps.Size(40, 40)
          }}
        />
      )}
      {ride?.driver?.location && (
        <Marker
          position={ride.driver.location}
          icon={{
            url: '/car-marker.png',
            scaledSize: new window.google.maps.Size(40, 40)
          }}
        />
      )}
    </GoogleMap>
  );
};

export default SharedRideMap; 