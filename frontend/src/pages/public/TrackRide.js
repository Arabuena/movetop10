import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';

const TrackRide = () => {
  const { rideId } = useParams();
  const { socket } = useSocket();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const response = await api.get(`/rides/track/${rideId}`);
        setRide(response.data);
        calculateRoute(response.data);
      } catch (error) {
        setError('Corrida não encontrada');
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [rideId]);

  useEffect(() => {
    if (!socket || !ride) return;

    // Escutar atualizações da localização do motorista
    socket.on(`driverLocation:${rideId}`, (location) => {
      setRide(prev => ({
        ...prev,
        driver: { ...prev.driver, location }
      }));
    });

    // Escutar atualizações do status da corrida
    socket.on(`rideStatus:${rideId}`, (updatedRide) => {
      setRide(updatedRide);
    });

    return () => {
      socket.off(`driverLocation:${rideId}`);
      socket.off(`rideStatus:${rideId}`);
    };
  }, [socket, rideId, ride]);

  const calculateRoute = async (rideData) => {
    const directionsService = new window.google.maps.DirectionsService();
    
    try {
      const result = await directionsService.route({
        origin: new window.google.maps.LatLng(
          rideData.origin.coordinates.lat,
          rideData.origin.coordinates.lng
        ),
        destination: new window.google.maps.LatLng(
          rideData.destination.coordinates.lat,
          rideData.destination.coordinates.lng
        ),
        travelMode: window.google.maps.TravelMode.DRIVING
      });

      setRouteDetails({
        distance: result.routes[0].legs[0].distance.text,
        duration: result.routes[0].legs[0].duration.text,
        path: result.routes[0].overview_path.map(point => ({
          lat: point.lat(),
          lng: point.lng()
        }))
      });
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error || 'Corrida não encontrada'}</p>
          <p className="text-gray-500">O link pode ter expirado ou a corrida foi finalizada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Mapa */}
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={ride.driver?.location || ride.origin.coordinates}
          zoom={15}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {/* Marcadores */}
          <Marker
            position={ride.origin.coordinates}
            icon={{
              url: '/images/pickup-marker.png',
              scaledSize: new window.google.maps.Size(40, 40)
            }}
          />
          <Marker
            position={ride.destination.coordinates}
            icon={{
              url: '/images/destination-marker.png',
              scaledSize: new window.google.maps.Size(40, 40)
            }}
          />
          {ride.driver?.location && (
            <Marker
              position={ride.driver.location}
              icon={{
                url: '/images/car-marker.png',
                scaledSize: new window.google.maps.Size(40, 40)
              }}
            />
          )}
          {/* Rota */}
          {routeDetails?.path && (
            <Polyline
              path={routeDetails.path}
              options={{
                strokeColor: '#FFB800',
                strokeOpacity: 0.8,
                strokeWeight: 3
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Informações da corrida */}
      <div className="bg-white shadow-lg p-4 space-y-4">
        <div className="flex items-center space-x-4">
          <img
            src={ride.driver?.photo || '/images/default-avatar.png'}
            alt={ride.driver?.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium">{ride.driver?.name}</h3>
            <p className="text-sm text-gray-500">
              {ride.vehicle?.model} • {ride.vehicle?.plate}
            </p>
          </div>
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <div>
            <p className="font-medium">Distância</p>
            <p>{routeDetails?.distance}</p>
          </div>
          <div>
            <p className="font-medium">Tempo estimado</p>
            <p>{routeDetails?.duration}</p>
          </div>
          <div>
            <p className="font-medium">Status</p>
            <p className="text-yellow-600">{ride.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackRide; 