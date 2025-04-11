import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import EarningsChart from '../../components/driver/EarningsChart';
import EarningsSummary from '../../components/driver/EarningsSummary';
import RideList from '../../components/driver/RideList';

const Earnings = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('week'); // day, week, month
  const [earnings, setEarnings] = useState({
    total: 0,
    rides: 0,
    average: 0,
    history: [],
    chartData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/driver/earnings?period=${period}`);
        setEarnings(response.data);
      } catch (error) {
        setError('Erro ao carregar ganhos');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [period]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Meus ganhos
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Acompanhe seus rendimentos
              </p>
            </div>
            <button
              onClick={() => navigate('/driver/home')}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <span className="material-icons-outlined">arrow_back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Seletor de período */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setPeriod('day')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                period === 'day'
                  ? 'bg-yellow-400 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                period === 'week'
                  ? 'bg-yellow-400 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Esta semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                period === 'month'
                  ? 'bg-yellow-400 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Este mês
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Resumo dos ganhos */}
        <EarningsSummary
          total={earnings.total}
          rides={earnings.rides}
          average={earnings.average}
          period={period}
        />

        {/* Gráfico */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Histórico de ganhos
          </h2>
          <EarningsChart data={earnings.chartData} period={period} />
        </div>

        {/* Lista de corridas */}
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Últimas corridas
          </h2>
          <RideList rides={earnings.history} />
        </div>
      </div>
    </div>
  );
};

export default Earnings; 