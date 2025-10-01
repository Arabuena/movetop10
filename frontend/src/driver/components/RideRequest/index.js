import React, { useState } from 'react';
import { useDriver } from '../../contexts/DriverContext';
import { formatCurrency, formatDistance } from '../../../utils/format';
import logger from '../../../utils/logger';
import { toast } from 'react-hot-toast';

const RideRequest = ({ ride }) => {
  const { acceptRide, rejectRide } = useDriver();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Garantir que temos um ID válido da corrida
      const rideId = ride._id || (ride.id ? ride.id : null);
      
      if (!rideId) {
        throw new Error('ID da corrida não encontrado');
      }
      
      logger.debug('Tentando aceitar corrida:', rideId);
      await toast.promise(
        acceptRide(rideId),
        {
          loading: 'Aceitando corrida...',
          success: 'Corrida aceita com sucesso!',
          error: (err) => `Erro ao aceitar corrida: ${err.message}`
        }
      );
    } catch (error) {
      logger.error('Erro ao aceitar corrida:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      logger.debug('Tentando rejeitar corrida:', ride._id);
      await toast.promise(
        rejectRide(ride._id),
        {
          loading: 'Rejeitando corrida...',
          success: 'Corrida rejeitada',
          error: (err) => `Erro ao rejeitar corrida: ${err.message}`
        }
      );
    } catch (error) {
      logger.error('Erro ao rejeitar corrida:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Nova corrida!</h3>
          <p className="text-gray-600">
            {formatDistance(ride.distance)}km • {formatCurrency(ride.price)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Tempo para aceitar</p>
          <p className="text-lg font-semibold">15s</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={isLoading}
          className={`flex-1 py-2 text-red-600 bg-red-50 rounded-lg ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'
          }`}
        >
          Recusar
        </button>
        <button
          onClick={handleAccept}
          disabled={isLoading}
          className={`flex-1 py-2 text-white bg-green-600 rounded-lg ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
          }`}
        >
          {isLoading ? 'Processando...' : 'Aceitar'}
        </button>
      </div>
    </div>
  );
};

export default RideRequest;