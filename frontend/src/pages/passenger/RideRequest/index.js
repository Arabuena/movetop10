import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import SelectDestination from './SelectDestination';
import SelectCategory from './SelectCategory';
import SelectPayment from './SelectPayment';
import ConfirmRide from './ConfirmRide';
import { calculateRideEstimates } from '../../../utils/rideCalculator';

const STEPS = {
  ORIGIN: 'origin',
  SELECT_DESTINATION: 'select_destination',
  SELECT_CATEGORY: 'select_category',
  SELECT_PAYMENT: 'select_payment',
  CONFIRM_RIDE: 'confirm_ride',
  WAITING_DRIVER: 'waiting_driver'
};

const RideRequest = () => {
  const navigate = useNavigate();
  const { requestRide, socket } = useSocket();
  
  const [step, setStep] = useState(STEPS.ORIGIN);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [estimates, setEstimates] = useState(null);
  const [category, setCategory] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [ride, setRide] = useState(null);
  const [error, setError] = useState(null);
  const [waitingTime, setWaitingTime] = useState(0);
  const [noDriversFound, setNoDriversFound] = useState(false);

  // Efeito para monitorar o tempo de espera quando estiver procurando motorista
  useEffect(() => {
    let interval;
    if (step === STEPS.WAITING_DRIVER && !noDriversFound) {
      interval = setInterval(() => {
        setWaitingTime(prev => {
          const newTime = prev + 1;
          // Após 30 segundos, considerar que não há motoristas disponíveis
          if (newTime >= 30) {
            setNoDriversFound(true);
            clearInterval(interval);
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, noDriversFound]);

  // Ouvir eventos de aceitação de corrida
  useEffect(() => {
    if (!socket) return;

    const handleRideAccepted = (response) => {
      console.log('Corrida aceita pelo motorista:', response);
      if (response && response.ride) {
        toast.success('Um motorista aceitou sua corrida!');
        // Redirecionar para a tela de acompanhamento
        const rideId = response.ride._id || response.ride.id;
        if (rideId) {
          navigate(`/passenger/rides/${rideId}`);
        } else {
          console.error('ID da corrida não encontrado na resposta:', response);
          toast.error('Erro ao processar corrida aceita. Tente novamente.');
        }
      } else {
        console.error('Dados da corrida incompletos na resposta:', response);
      }
    };

    socket.on('ride:accepted', handleRideAccepted);
    socket.on('passenger:rideAccepted', handleRideAccepted);

    return () => {
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('passenger:rideAccepted', handleRideAccepted);
    };
  }, [socket, navigate]);

  const handleDestinationSelect = async (data) => {
    try {
      // Calcular estimativas
      const estimates = await calculateRideEstimates(data.origin, data.destination);
      
      setOrigin(data.origin);
      setDestination(data.destination);
      setEstimates(estimates);
      
      setStep(STEPS.SELECT_CATEGORY);
    } catch (error) {
      console.error('Erro ao calcular estimativas:', error);
      toast.error('Erro ao calcular valor da corrida');
    }
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setStep(STEPS.SELECT_PAYMENT);
  };
  
  const handlePaymentSelect = (method) => {
    setPaymentMethod(method);
    setStep(STEPS.CONFIRM_RIDE);
  };

  const handleRequestRide = async () => {
    try {
      toast.loading('Buscando motoristas próximos...', { id: 'searching-drivers' });
      
      // Validar dados antes de enviar
      if (!origin || !destination || !estimates || !category) {
        toast.dismiss('searching-drivers');
        toast.error('Dados incompletos. Verifique o endereço de origem e destino.');
        return;
      }

      const rideRequest = {
        origin: {
          lat: Number(origin.lat),
          lng: Number(origin.lng),
          address: origin.address || ''
        },
        destination: {
          lat: Number(destination.lat),
          lng: Number(destination.lng),
          address: destination.address || ''
        },
        carType: category.id,
        price: Number(estimates.prices[category.id]),
        distance: Number(estimates.distance.value),
        duration: Number(estimates.duration.value),
        paymentMethod: paymentMethod || 'cash'
      };

      const response = await requestRide(rideRequest);
      
      toast.dismiss('searching-drivers');
      
      if (!response || !response.ride) {
        toast.error('Não foi possível criar a corrida. Tente novamente.');
        return;
      }
      
      toast.success('Corrida solicitada com sucesso!');
      console.log('Resposta da solicitação de corrida:', response);
      
      // Atualizar o estado para mostrar a tela de espera
      setRide(response.ride);
      setStep(STEPS.WAITING_DRIVER);
    } catch (error) {
      console.error('Erro ao solicitar corrida:', error);
      toast.dismiss('searching-drivers');
      toast.error(`Erro ao solicitar corrida: ${error.message || 'Tente novamente.'}`);
    }
  };

  const handleBack = () => {
    switch (step) {
      case STEPS.SELECT_CATEGORY:
        setStep(STEPS.SELECT_DESTINATION);
        break;
      case STEPS.SELECT_PAYMENT:
        setStep(STEPS.SELECT_CATEGORY);
        break;
      case STEPS.CONFIRM_RIDE:
        setStep(STEPS.SELECT_PAYMENT);
        break;
      default:
        navigate('/passenger');
    }
  };

  // Função para cancelar a corrida
  const handleCancelRide = async () => {
    try {
      if (socket && ride?._id) {
        socket.emit('passenger:cancelRide', { rideId: ride._id }, (response) => {
          if (response.success) {
            toast.success('Corrida cancelada com sucesso');
          } else {
            toast.error('Erro ao cancelar corrida: ' + (response.error || 'Tente novamente'));
          }
          navigate('/passenger');
        });
      } else {
        navigate('/passenger');
      }
    } catch (error) {
      console.error('Erro ao cancelar corrida:', error);
      navigate('/passenger');
    }
  };

  const renderStep = () => {
    switch (step) {
      case STEPS.ORIGIN:
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
            estimates={estimates}
            onSelect={handleCategorySelect}
            onBack={handleBack}
          />
        );
      
      case STEPS.SELECT_PAYMENT:
        return (
          <SelectPayment
            onConfirm={handlePaymentSelect}
            onBack={handleBack}
          />
        );
      
      case STEPS.CONFIRM_RIDE:
        return (
          <ConfirmRide
            origin={origin}
            destination={destination}
            estimates={estimates}
            category={category}
            paymentMethod={paymentMethod}
            onConfirm={handleRequestRide}
            onBack={handleBack}
          />
        );
      
      case STEPS.WAITING_DRIVER:
        return (
          <WaitingDriver 
            ride={ride} 
            waitingTime={waitingTime}
            noDriversFound={noDriversFound}
            onCancel={handleCancelRide}
            onBack={() => navigate('/passenger')}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-screen">
      {renderStep()}
    </div>
  );
};

// Componente para mostrar enquanto aguarda um motorista aceitar a corrida
const WaitingDriver = ({ ride, waitingTime, noDriversFound, onCancel, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white p-4">
      <div className="animate-pulse mb-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      
      {noDriversFound ? (
        <>
          <h2 className="text-xl font-semibold mb-2 text-orange-500">Nenhum motorista encontrado</h2>
          <p className="text-gray-600 text-center mb-4">
            Não encontramos motoristas disponíveis no momento. Tente novamente mais tarde.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-2">Procurando motorista...</h2>
          <p className="text-gray-600 text-center mb-4">
            Aguarde enquanto encontramos um motorista próximo para sua corrida
          </p>
        </>
      )}
      
      <div className="w-full max-w-md bg-gray-100 p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Origem:</span>
          <span className="font-medium">{ride?.origin?.address}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Destino:</span>
          <span className="font-medium">{ride?.destination?.address}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tempo de espera:</span>
          <span className="font-medium">{Math.floor(waitingTime / 60)}:{(waitingTime % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>
      
      <div className="mt-4 flex space-x-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Cancelar
        </button>
        
        {noDriversFound && (
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  );
};

export default RideRequest;