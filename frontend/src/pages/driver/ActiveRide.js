import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useSocket } from '../../contexts/SocketContext';
import { useRide } from '../../contexts/RideContext';
import PassengerInfo from '../../components/driver/PassengerInfo';
import RideActions from '../../components/driver/RideActions';
import RideStatusHeader from '../../components/driver/RideStatusHeader';

const ActiveRide = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { getRide, updateRideStatus } = useRide();
  const [ride, setRide] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const rideData = await getRide(rideId);
        setRide(rideData);
        calculateRoute(rideData);
      } catch (error) {
        setError('Erro ao carregar corrida');
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [rideId, getRide]);

  // Rastrear localização do motorista
  useEffect(() => {
    if (!ride) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        
        // Enviar localização para o servidor
        if (socket) {
          socket.emit('updateDriverLocation', { rideId, location });
        }
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, ride, rideId]);

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

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateRideStatus(rideId, newStatus);
      setRide(prev => ({ ...prev, status: newStatus }));

      if (newStatus === 'COMPLETED') {
        navigate('/driver/home');
      }
    } catch (error) {
      setError('Erro ao atualizar status da corrida');
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
          <button
            onClick={() => navigate('/driver/home')}
            className="text-yellow-600 hover:text-yellow-700"
          >
            Voltar para o início
          </button>
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
          center={currentLocation || ride.origin.coordinates}
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
          {currentLocation && (
            <Marker
              position={currentLocation}
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

      {/* Painel de informações */}
      <div className="bg-white shadow-lg">
        <RideStatusHeader status={ride.status} />
        
        <PassengerInfo
          passenger={ride.passenger}
          origin={ride.origin}
          destination={ride.destination}
          distance={routeDetails?.distance}
          duration={routeDetails?.duration}
        />

        <RideActions
          ride={ride}
          onStatusUpdate={handleStatusUpdate}
          onChat={() => {/* Implementar chat */}}
          onCall={() => {/* Implementar chamada */}}
        />
      </div>
    </div>
  );
};

export default ActiveRide; 