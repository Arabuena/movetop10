import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { formatPrice } from '../../utils/rideCalculator';
import { MapPinIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useDriver } from '../../driver/contexts/DriverContext';

const DriverRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const { cancelRide, isUpdating } = useDriver();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await api.get('/driver/rides');
        if (isMounted) setRides(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao buscar corridas do motorista:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAddress = (location) => {
    // Se for string, retorna direto
    if (typeof location === 'string') return location;
    
    // Se for objeto com address
    if (location?.address) return location.address;
    
    // Se for objeto com coordinates
    if (location?.coordinates) {
      return `${location.coordinates[1]}, ${location.coordinates[0]}`;
    }
    
    return 'Endereço não disponível';
  };

  const filteredRides = useMemo(() => {
    const base = rides.filter((r) => {
      if (statusFilter === 'all') return true;
      return r.status === statusFilter;
    });
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter((r) => {
      const o = typeof r.origin === 'string' ? r.origin : r.origin?.address || '';
      const d = typeof r.destination === 'string' ? r.destination : r.destination?.address || '';
      return String(o).toLowerCase().includes(q) || String(d).toLowerCase().includes(q);
    });
  }, [rides, statusFilter, query]);

  const refreshRides = async () => {
    try {
      const { data } = await api.get('/driver/rides');
      setRides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao atualizar lista de corridas:', err);
    }
  };

  const cancelAllInProgress = async () => {
    const toCancel = rides.filter(r => r.status === 'in_progress');
    if (toCancel.length === 0) return;
    for (const r of toCancel) {
      try {
        await cancelRide(r._id);
      } catch (e) {
        console.error('Falha ao cancelar corrida', r._id, e);
      }
    }
    await refreshRides();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-99-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Histórico de Corridas</h1>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'accepted', label: 'Aceitas' },
            { key: 'in_progress', label: 'Em andamento' },
            { key: 'completed', label: 'Finalizadas' },
            { key: 'cancelled', label: 'Canceladas' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === tab.key
                  ? 'bg-99-primary text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por endereço"
          className="flex-1 px-3 py-2 rounded border border-gray-300"
        />
        <button
          onClick={cancelAllInProgress}
          disabled={isUpdating}
          className={`px-3 py-2 rounded text-sm border transition ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'border-red-600 text-red-700 hover:bg-red-50'}`}
        >
          Cancelar corridas em andamento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {filteredRides.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhuma corrida realizada ainda.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRides.map((ride) => (
              <div key={ride._id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ride.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : ride.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : ride.status === 'accepted'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                      {ride.status === 'completed' ? 'Finalizada' : ride.status === 'in_progress' ? 'Em andamento' : ride.status === 'accepted' ? 'Aceita' : 'Cancelada'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(ride.createdAt)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Origem</p>
                      <p className="text-gray-900">{getAddress(ride.origin)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Destino</p>
                      <p className="text-gray-900">{getAddress(ride.destination)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">
                        {Math.round((ride.duration || ride.estimatedTime) / 60)} min
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900 font-medium">
                        {formatPrice(ride.price || ride.estimatedPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRides;