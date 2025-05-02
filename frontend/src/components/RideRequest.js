// src/components/RideRequest.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext'; // Ajuste o caminho de importação conforme necessário
import { toast } from 'react-hot-toast';
import SelectDestination from './SelectDestination';
import SelectCategory from './SelectCategory';
import ConfirmRide from './ConfirmRide';
import { calculateRideEstimates } from '../../utils/rideCalculator'; // Ajuste o caminho de importação conforme necessário

const STEPS = {
  SELECT_DESTINATION: 'select_destination',
  SELECT_CATEGORY: 'select_category',
  CONFIRM_RIDE: 'confirm_ride'
};

const RideRequest = () => {
  const navigate = useNavigate();
  const { requestRide } = useSocket();
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_DESTINATION);
  const [rideData, setRideData] = useState({
    origin: null,
    destination: null,
    category: null,
    estimates: null
  });

  const handleDestinationSelect = async (data) => {
    try {
      const estimates = await calculateRideEstimates(data.origin, data.destination);

      setRideData(prev => ({
        ...prev,
        origin: data.origin,
        destination: data.destination,
        estimates
      }));

      setCurrentStep(STEPS.SELECT_CATEGORY);
    } catch (error) {
      console.error('Erro ao calcular estimativas:', error);
      toast.error('Erro ao calcular valor da corrida');
    }
  };

  const handleCategorySelect = (category) => {
    setRideData(prev => ({
      ...prev,
      category
    }));
    setCurrentStep(STEPS.CONFIRM_RIDE);
  };

  const handleConfirmRide = async () => {
    try {
      toast.loading('Procurando motoristas próximos...', {
        id: 'searching-drivers'
      });

      const rideRequest = {
        origin: {
          lat: rideData.origin.lat,
          lng: rideData.origin.lng,
          address: rideData.origin.address
        },
        destination: {
          lat: rideData.destination.lat,
          lng: rideData.destination.lng,
          address: rideData.destination.address
        },
        price: rideData.estimates.prices[rideData.category.id],
        distance: rideData.estimates.distance.value,
        duration: rideData.estimates.duration.value,
        paymentMethod: 'cash'
      };

      const ride = await requestRide(rideRequest);

      toast.dismiss('searching-drivers');
      toast.success('Corrida solicitada com sucesso!');
    } catch (error) {
      console.error('Erro ao solicitar corrida:', error);
      toast.dismiss('searching-drivers');
      toast.error('Erro ao solicitar corrida. Tente novamente.');
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case STEPS.SELECT_CATEGORY:
        setCurrentStep(STEPS.SELECT_DESTINATION);
        break;
      case STEPS.CONFIRM_RIDE:
        setCurrentStep(STEPS.SELECT_CATEGORY);
        break;
      default:
        navigate('/passenger');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.SELECT_DESTINATION:
        return (
          <SelectDestination
            onConfirm={handleDestinationSelect}
            onBack={handleBack}
          />
        );

      case STEPS.SELECT_CATEGORY:
        return (
          <SelectCategory
            estimates={rideData.estimates}
            onSelect={handleCategorySelect}
            onBack={handleBack}
          />
        );

      case STEPS.CONFIRM_RIDE:
        return (
          <ConfirmRide
            rideData={rideData}
            onConfirm={handleConfirmRide}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-move-gray"> {/* Usando a cor 'move-gray' do Tailwind */}
      {renderStep()}
      <div className="flex justify-between p-4">
        <button
          onClick={handleBack}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          // 🔧 Classe do botão 'Voltar' atualizada para:
          // bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400
        >
          Voltar
        </button>
        <button
          onClick={handleConfirmRide}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          // 🔧 Classe do botão 'Confirmar' atualizada para:
          // bg-green-500 text-white hover:bg-green-600 focus:ring-green-400
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default RideRequest;
