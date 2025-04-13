import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { formatPrice } from '../../utils/rideCalculator';
import { 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const PassengerRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) {
      console.log('Socket não disponível');
      return;
    }

    console.log('Solicitando histórico de corridas...');
    socket.emit('passenger:getRides', {}, (response) => {
      console.log('Resposta recebida:', response);
      if (response.success) {
        setRides(response.rides);
      }
      setLoading(false);
    });
  }, [socket]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAddress = (location) => {
    if (typeof location === 'string') return location;
    if (location?.address) return location.address;
    if (location?.coordinates) {
      return `${location.coordinates[1]}, ${location.coordinates[0]}`;
    }
    return 'Endereço não disponível';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-99-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Minhas Corridas</h1>

      <div className="bg-white rounded-lg shadow">
        {rides.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Você ainda não realizou nenhuma corrida.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rides.map((ride) => (
              <div key={ride._id} className="p-6 hover:bg-gray-50">
                {/* Cabeçalho com status e data */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ride.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ride.status === 'completed' ? 'Finalizada' : 'Cancelada'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(ride.createdAt)}
                  </span>
                </div>

                {/* Informações do motorista */}
                {ride.driver && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ride.driver.name}</p>
                      {ride.rating?.driver && (
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-gray-600">
                            {ride.rating.driver.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Endereços */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Origem</p>
                      <p className="text-gray-900">{getAddress(ride.origin)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Destino</p>
                      <p className="text-gray-900">{getAddress(ride.destination)}</p>
                    </div>
                  </div>
                </div>

                {/* Detalhes da corrida */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">
                      {Math.round((ride.duration || ride.estimatedTime) / 60)} min
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900 font-medium">
                      {formatPrice(ride.price || ride.estimatedPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerRides; 