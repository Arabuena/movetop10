import React, { useState } from 'react';
import { useDriver } from '../../contexts/DriverContext';
import { formatCurrency, formatDistance } from '../../../utils/format';
import logger from '../../../utils/logger';
import { toast } from 'react-hot-toast';

const RideRequest = ({ ride }) => {
  const { acceptRide, rejectRide, cancelRide } = useDriver();
  const [isLoading, setIsLoading] = useState(false);

  // Debug do componente RideRequest
  console.log('🎯 [RIDE REQUEST] Componente renderizado com ride:', ride);
  console.log('🎯 [RIDE REQUEST] Status da corrida:', ride?.status);

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

  const handleCancel = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      logger.debug('Tentando cancelar corrida:', ride._id);
      await toast.promise(
        cancelRide(ride._id),
        {
          loading: 'Cancelando corrida...',
          success: 'Corrida cancelada com sucesso!',
          error: (err) => `Erro ao cancelar corrida: ${err.message}`
        }
      );
    } catch (error) {
      logger.error('Erro ao cancelar corrida:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar o status da corrida para mostrar interface apropriada
  const isAccepted = ride.status === 'accepted';
  const isInProgress = ride.status === 'in_progress';
  const isPending = ride.status === 'pending' || ride.status === 'requested';

  // Debug dos status
  console.log('🎯 [RIDE REQUEST] Status checks:', {
    isAccepted,
    isInProgress,
    isPending,
    actualStatus: ride.status
  });

  // Se a corrida já foi aceita, mostrar interface de corrida em andamento
  if (isAccepted || isInProgress) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-green-600">
              {isAccepted ? 'Corrida Aceita!' : 'Corrida em Andamento'}
            </h3>
            <p className="text-gray-600">
              {formatDistance(ride.distance)}km • {formatCurrency(ride.price)}
            </p>
            {ride.passenger && (
              <p className="text-sm text-gray-600 mt-1">
                Passageiro: {ride.passenger.name} • {ride.passenger.phone}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600 font-medium">
              {isAccepted ? 'A caminho do passageiro' : 'Em andamento'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            onClick={() => {
              // Aqui você pode adicionar navegação para detalhes da corrida
              logger.debug('Visualizar detalhes da corrida:', ride._id);
            }}
          >
            Ver Detalhes
          </button>
          {isAccepted && (
            <>
              <button
                className="flex-1 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                onClick={() => {
                  // Aqui você pode adicionar lógica para iniciar a corrida
                  logger.debug('Iniciar corrida:', ride._id);
                }}
              >
                Iniciar Corrida
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className={`flex-1 py-2 text-red-600 bg-red-50 rounded-lg ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'
                }`}
              >
                {isLoading ? 'Cancelando...' : 'Cancelar'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Interface para corridas pendentes (nova solicitação)
  if (isPending) {
    console.log('🎯 [RIDE REQUEST] Renderizando interface PENDENTE');
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl p-4 z-50 border-t-4 border-red-500">
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
            className={`flex-1 py-3 text-red-600 bg-red-50 rounded-lg border-2 border-red-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'
            }`}
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className={`flex-1 py-3 text-white bg-green-600 rounded-lg border-2 border-green-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
            }`}
          >
            {isLoading ? 'Processando...' : 'Aceitar'}
          </button>
        </div>
      </div>
    );
  }

  // Para outros status, não mostrar nada
  return null;
};

export default RideRequest;