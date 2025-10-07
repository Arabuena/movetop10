import React, { useState } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import PlacesAutocomplete from '../../components/PlacesAutocomplete';
import logger from '../../../utils/logger';

const PassengerHome = () => {
  const { requestRide } = useSocket();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectedCar, setSelectedCar] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isRequesting, setIsRequesting] = useState(false);

  const handleConfirmRide = async () => {
    if (!origin || !destination) {
      logger.warn('Origem ou destino não selecionados');
      alert('Por favor, selecione origem e destino');
      return;
    }

    setIsRequesting(true);
    logger.debug('Iniciando solicitação de corrida...', { origin, destination, selectedCar, paymentMethod });

    try {
      const rideData = {
        origin,
        destination,
        carType: selectedCar,
        paymentMethod
      };

      logger.debug('Dados da corrida:', rideData);
      const response = await requestRide(rideData);
      logger.debug('Corrida solicitada com sucesso:', response);
      alert('Corrida solicitada! Aguarde um motorista aceitar.');
    } catch (error) {
      logger.error('Erro ao solicitar corrida:', error);
      alert('Erro ao solicitar corrida. Tente novamente.');
    } finally {
      setIsRequesting(false);
    }
  };

  const carTypes = [
    { id: 'standard', name: 'Padrão', price: 'R$ 8,50' },
    { id: 'comfort', name: 'Conforto', price: 'R$ 12,00' },
    { id: 'premium', name: 'Premium', price: 'R$ 18,00' }
  ];

  const paymentMethods = [
    { id: 'cash', name: 'Dinheiro' },
    { id: 'card', name: 'Cartão' },
    { id: 'pix', name: 'PIX' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Solicitar Corrida
        </h1>

        {/* Origem */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            De onde você está saindo?
          </label>
          <input
            type="text"
            placeholder="Digite o endereço de origem"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => {
              const value = e.target.value;
              setOrigin(value ? { address: value, lat: -16.6869, lng: -49.2648 } : null);
              logger.debug('Origem selecionada:', value);
            }}
          />
        </div>

        {/* Destino */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Para onde você vai?
          </label>
          <input
            type="text"
            placeholder="Digite o endereço de destino"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => {
              const value = e.target.value;
              setDestination(value ? { address: value, lat: -16.6869, lng: -49.2648 } : null);
              logger.debug('Destino selecionado:', value);
            }}
          />
        </div>

        {/* Seleção de Carro */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Escolha o tipo de carro
          </label>
          <div className="space-y-2">
            {carTypes.map((car) => (
              <div
                key={car.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCar === car.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => {
                  setSelectedCar(car.id);
                  logger.debug('Carro selecionado:', car.name);
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{car.name}</span>
                  <span className="text-green-600 font-bold">{car.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Forma de pagamento
          </label>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => {
                  setPaymentMethod(method.id);
                  logger.debug('Forma de pagamento selecionada:', method.name);
                }}
              >
                <span className="font-medium">{method.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botão de Confirmação */}
        <button
          onClick={handleConfirmRide}
          disabled={isRequesting || !origin || !destination}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            isRequesting || !origin || !destination
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isRequesting ? 'Solicitando...' : 'Confirmar Corrida'}
        </button>

        {/* Status */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {origin && destination ? (
            <span className="text-green-600">✓ Endereços preenchidos</span>
          ) : (
            <span>Preencha origem e destino para continuar</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PassengerHome;