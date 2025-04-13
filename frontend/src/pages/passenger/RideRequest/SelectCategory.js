import React from 'react';
import { formatPrice, formatDuration } from '../../../utils/rideCalculator';
import { 
  UserGroupIcon, // Carro popular
  SparklesIcon, // Comfort
  StarIcon // Premium
} from '@heroicons/react/24/outline';

const CATEGORIES = [
  {
    id: 'standard',
    name: '99Pop',
    description: 'Carros populares, econômico',
    icon: UserGroupIcon,
    seats: '4 pessoas'
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'Carros espaçosos, mais conforto',
    icon: SparklesIcon,
    seats: '4 pessoas'
  },
  {
    id: 'premium',
    name: 'TOP',
    description: 'Carros premium, experiência exclusiva',
    icon: StarIcon,
    seats: '4 pessoas'
  }
];

const SelectCategory = ({ estimates, onSelect, onBack }) => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="p-4 bg-white">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Escolha sua categoria
        </h1>

        {/* Estimativas */}
        <div className="flex justify-between text-sm text-gray-500 mb-4">
          <span>{estimates.distance.text}</span>
          <span>{formatDuration(estimates.duration)}</span>
        </div>
      </div>

      {/* Lista de categorias */}
      <div className="flex-1 p-4 space-y-3">
        {CATEGORIES.map((category) => {
          const price = estimates.prices[category.id];
          const Icon = category.icon;

          return (
            <button
              key={category.id}
              onClick={() => onSelect(category)}
              className="w-full p-4 bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {category.seats}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-gray-900">
                        {formatPrice(price)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Botão voltar */}
      <div className="p-4 bg-white border-t">
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default SelectCategory; 