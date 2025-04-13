import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { formatPrice } from '../../utils/rideCalculator';
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  StarIcon,
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';

const DriverEarnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) {
      console.log('Socket não disponível');
      return;
    }

    console.log('Solicitando dados de ganhos...');
    socket.emit('driver:getEarnings', {}, (response) => {
      console.log('Resposta recebida:', response);
      if (response.success) {
        setEarnings(response.earnings);
      }
      setLoading(false);
    });
  }, [socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-99-primary"></div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="text-center text-gray-500 mt-8">
        Nenhum dado de ganhos disponível
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Ganhos</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ganhos Totais</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(earnings.total)}</p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-99-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Corridas Realizadas</p>
              <p className="text-2xl font-bold text-gray-900">{earnings.totalRides}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-99-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Média por Corrida</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(earnings.averagePerRide)}</p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-99-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avaliação Média</p>
              <p className="text-2xl font-bold text-gray-900">{earnings.rating.toFixed(1)} ★</p>
            </div>
            <StarIcon className="h-8 w-8 text-99-primary" />
          </div>
        </div>
      </div>

      {/* Histórico de ganhos por dia */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Histórico Diário</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="divide-y divide-gray-200">
            {earnings.dailyEarnings.map((day) => (
              <div key={day.date} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        day: '2-digit', 
                        month: 'long' 
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {day.rides} corridas realizadas
                    </p>
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    {formatPrice(day.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings; 