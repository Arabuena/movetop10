import React, { useState } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import PlacesAutocomplete from '../../components/PlacesAutocomplete';
import logger from '../../../utils/logger';

const PassengerHome = () => {
  const { requestRide } = useSocket();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  const handleConfirmRide = async () => {
    if (!origin || !destination) {
      logger.warn('Origem ou destino não selecionados');
      return;
    }

    try {
      const rideData = {
        origin,
        destination,
        paymentMethod: 'cash' // ou outro método
      };

      const response = await requestRide(rideData);
      logger.debug('Corrida solicitada:', response);
    } catch (error) {
      logger.error('Erro ao solicitar corrida:', error);
    }
  };

  return (
    // ... resto do JSX
  );
}; 