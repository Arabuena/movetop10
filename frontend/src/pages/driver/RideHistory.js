import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRide } from '../../contexts/RideContext';
import RideHistoryCard from '../../components/driver/RideHistoryCard';
import RideHistoryFilter from '../../components/driver/RideHistoryFilter';

const RideHistory = () => {
  const navigate = useNavigate();
  const { getRideHistory } = useRide();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    status: 'all',
    dateRange: 'week',
    customRange: {
      start: null,
      end: null
    }
  });

  useEffect(() => {
    const fetchRides = async () => {
      try {
        setLoading(true);
        const response = await getRideHistory(filter);
        setRides(response.rides);
      } catch (error) {
        setError('Erro ao carregar histórico');
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [filter, getRideHistory]);

  const handleFilterChange = (newFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

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
                Histórico de corridas
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {rides.length} corridas encontradas
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

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <RideHistoryFilter
          filter={filter}
          onChange={handleFilterChange}
        />

        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Lista de corridas */}
        <div className="space-y-4">
          {rides.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons-outlined text-4xl text-gray-400">
                history
              </span>
              <p className="mt-2 text-gray-500">
                Nenhuma corrida encontrada
              </p>
            </div>
          ) : (
            rides.map(ride => (
              <RideHistoryCard
                key={ride._id}
                ride={ride}
                onClick={() => navigate(`/driver/rides/${ride._id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RideHistory; 