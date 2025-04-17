import React, { useState, useEffect } from 'react';
import { GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { UserIcon, PhoneIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import Chat from '../../../components/Chat';
import { useSocket } from '../../../contexts/SocketContext';
import SharedRideMap from '../../../components/SharedRideMap';

const RIDE_STATUS = {
  pending: 'Procurando motorista...',
  accepted: 'Motorista a caminho',
  collecting: 'Motorista chegou ao local',
  in_progress: 'Em viagem',
  completed: 'Finalizada',
  cancelled: 'Cancelada'
};

const RideStatus = ({ ride, origin, destination }) => {
  const [driverEta, setDriverEta] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const { socket } = useSocket();

  // Atualizar ETA quando receber nova localização do motorista
  useEffect(() => {
    if (!socket || !ride?.driver) return;

    socket.on('driver:location', (data) => {
      if (data.driverId === ride.driver._id) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: data.location,
            destination: origin,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK') {
              setDriverEta(result.routes[0].legs[0].duration.text);
            }
          }
        );
      }
    });

    return () => socket.off('driver:location');
  }, [socket, ride?.driver, origin]);

  return (
    <div className="h-[calc(100vh-64px)] relative"> {/* Altura total menos altura do navbar */}
      {/* Mapa como background */}
      <div className="absolute inset-0">
        <SharedRideMap
          ride={ride}
          origin={origin}
          destination={destination}
          center={ride.driver?.location || origin}
        />
      </div>

      {/* Overlay com informações flutuando sobre o mapa */}
      <div className="absolute inset-x-0 top-0">
        {/* Barra de status no topo */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm p-4">
          <h2 className="text-lg font-semibold">
            {RIDE_STATUS[ride.status]}
          </h2>
          {ride.status === 'accepted' && driverEta && (
            <p className="text-sm text-gray-600">
              Motorista chegará em aproximadamente {driverEta}
            </p>
          )}
        </div>
      </div>

      {/* Painel do motorista flutuando na parte inferior */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg p-4">
          <div className="max-w-lg mx-auto">
            {ride.driver && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{ride.driver.name}</p>
                    <p className="text-sm text-gray-500">
                      {ride.driver.vehicle?.model} • {ride.driver.vehicle?.plate}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.open(`tel:${ride.driver.phone}`)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <PhoneIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowChat(true)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <ChatBubbleLeftIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat overlay */}
      {showChat && ride?.driver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <Chat
              rideId={ride._id}
              otherUser={ride.driver}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RideStatus; 