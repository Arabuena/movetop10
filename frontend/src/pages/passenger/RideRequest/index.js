import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import SelectDestination from './SelectDestination';
import SelectCategory from './SelectCategory';
import ConfirmRide from './ConfirmRide';
import { calculateRideEstimates } from '../../../utils/rideCalculator';
import RideStatus from './RideStatus';

const STEPS = {
  SELECT_DESTINATION: 'select_destination',
  SELECT_CATEGORY: 'select_category',
  CONFIRM_RIDE: 'confirm_ride'
};

const RideRequest = () => {
  const [currentRide, setCurrentRide] = useState(null);
  const { socket, requestRide } = useSocket();
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_DESTINATION);
  const [rideData, setRideData] = useState({
    origin: null,
    destination: null,
    category: null,
    estimates: null
  });
  const [rideDirections, setRideDirections] = useState(null);

  // Carregar dados da corrida
  useEffect(() => {
    if (!rideId) return;
    
    // Buscar dados da corrida
    fetch(`/api/rides/${rideId}`)
      .then(res => res.json())
      .then(data => {
        console.log('Dados da corrida carregados:', data);
        setCurrentRide(data);
      })
      .catch(err => console.error('Erro ao carregar corrida:', err));
  }, [rideId]);

  // Ouvir atualizações da corrida
  useEffect(() => {
    if (!socket) return;

    socket.on('ride:updated', (updatedRide) => {
      console.log('Corrida atualizada:', updatedRide);
      
      // Manter as directions ao atualizar a corrida
      setCurrentRide({
        ...updatedRide,
        directions: rideDirections
      });
    });

    return () => {
      socket.off('ride:updated');
    };
  }, [socket, rideDirections]);

  const handleDestinationSelect = async (data) => {
    try {
      // Calcular estimativas
      const estimates = await calculateRideEstimates(data.origin, data.destination);
      
      setRideData(prev => ({
        ...prev,
        origin: data.origin,
        destination: data.destination,
        estimates
      }));
      
      // Guardar as directions
      setRideDirections(data.directions);
      
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
      
      // Atualizar o estado da corrida atual
      setCurrentRide(ride);
      
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

  const renderContent = () => {
    // Se já existe uma corrida, mostrar o status dela
    if (currentRide) {
      switch (currentRide.status) {
        case 'accepted':
        case 'collecting':
        case 'in_progress':
          return (
            <RideStatus
              ride={currentRide}
              origin={currentRide.origin}
              destination={currentRide.destination}
              initialDirections={rideDirections}
            />
          );
        case 'completed':
        case 'cancelled':
          navigate('/passenger/home');
          return null;
      }
    }

    // Se não existe corrida ou está pendente, mostrar fluxo de solicitação
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
    <div className="h-screen">
      {renderContent()}
    </div>
  );
};

export default RideRequest; 