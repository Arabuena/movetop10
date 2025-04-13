import React from 'react';
import { MapPinIcon, UserIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { formatPrice, formatDuration } from '../../../utils/rideCalculator';

const ConfirmRide = ({ rideData, onConfirm, onBack }) => {
  const { origin, destination, category, estimates } = rideData;
  const price = estimates.prices[category.id];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <div className="p-4 bg-white">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Confirmar corrida
        </h1>
      </div>

      {/* Detalhes da corrida */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          {/* Endereços */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Origem</p>
                <p className="text-gray-900">{origin.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Destino</p>
                <p className="text-gray-900">{destination.address}</p>
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div className="flex items-center gap-3 pt-3 border-t">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-gray-900">{category.name}</p>
              <p className="text-sm text-gray-500">{category.description}</p>
            </div>
          </div>

          {/* Pagamento */}
          <div className="flex items-center gap-3 pt-3 border-t">
            <CreditCardIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-gray-900">Forma de pagamento</p>
              <p className="text-sm text-gray-500">Dinheiro</p>
            </div>
          </div>

          {/* Estimativas */}
          <div className="pt-3 border-t">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Distância</span>
              <span>{estimates.distance.text}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Tempo estimado</span>
              <span>{formatDuration(estimates.duration)}</span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <span className="text-gray-900">Valor total</span>
              <span className="text-xl font-medium text-gray-900">
                {formatPrice(price)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 text-white bg-99-primary rounded-lg hover:bg-99-primary/90"
          >
            Confirmar corrida
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRide; 