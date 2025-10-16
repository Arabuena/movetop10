// Componente: PassengerRides
import React, { useState, useEffect, useMemo } from 'react';
import { formatPrice } from '../../utils/rideCalculator';
import { 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const PassengerRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Novos estados: filtro e busca
  const [filterStatus, setFilterStatus] = useState('all');
  const [query, setQuery] = useState('');

  // Ordenação por data (desc) e filtro por status + busca por endereço
  const ridesSorted = useMemo(() => {
    return [...rides].sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0);
      const db = new Date(b.updatedAt || b.createdAt || 0);
      return db - da;
    });
  }, [rides]);

  const normalizeStatus = (s) => {
    if (!s) return 'unknown';
    const n = s.toLowerCase();
    if (n === 'cancelled') return 'canceled';
    return n;
  };

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
    if (typeof location === 'string') return location;
    if (location?.address) return location.address;
    if (location?.coordinates) {
      return `${location.coordinates[1]}, ${location.coordinates[0]}`;
    }
    return 'Endereço não disponível';
  };

  const matchesQuery = (ride) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const origin = getAddress(ride.origin).toLowerCase();
    const destination = getAddress(ride.destination).toLowerCase();
    return origin.includes(q) || destination.includes(q);
  };

  const ridesFiltered = useMemo(() => {
    return ridesSorted.filter((r) => {
      const status = normalizeStatus(r.status);
      return filterStatus === 'all' ? true : status === filterStatus;
    }).filter(matchesQuery);
  }, [ridesSorted, filterStatus, query]);

  // Resumo por status
  const stats = useMemo(() => {
    const base = { all: rides.length, completed: 0, canceled: 0, in_progress: 0, accepted: 0 };
    rides.forEach((r) => {
      const s = normalizeStatus(r.status);
      if (base[s] !== undefined) base[s] += 1;
    });
    return base;
  }, [rides]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchRides = async () => {
      try {
        const res = await api.get('/passenger/rides');
        if (mounted) {
          setRides(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Erro ao carregar corridas do passageiro:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRides();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Minhas Corridas</h1>
        <div className="grid gap-4">
          <div className="animate-pulse rounded-lg bg-gray-100 h-24"></div>
          <div className="animate-pulse rounded-lg bg-gray-100 h-24"></div>
          <div className="animate-pulse rounded-lg bg-gray-100 h-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Minhas Corridas</h1>

      {/* Barra de filtros e busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: `Todas (${stats.all})` },
            { key: 'completed', label: `Finalizadas (${stats.completed})` },
            { key: 'canceled', label: `Canceladas (${stats.canceled})` },
            { key: 'in_progress', label: `Em andamento (${stats.in_progress})` },
            { key: 'accepted', label: `Aceitas (${stats.accepted})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1 rounded-full text-sm border ${
                filterStatus === tab.key 
                  ? 'bg-99-primary text-white border-99-primary' 
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto w-full sm:w-64">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por endereço..."
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {ridesFiltered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhuma corrida encontrada com os filtros.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {ridesFiltered.map((ride) => (
              <div key={ride._id} className="p-6 hover:bg-gray-50">
                {/* Cabeçalho com status e data */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      normalizeStatus(ride.status) === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : normalizeStatus(ride.status) === 'canceled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {normalizeStatus(ride.status) === 'completed' 
                        ? 'Finalizada' 
                        : normalizeStatus(ride.status) === 'canceled'
                          ? 'Cancelada'
                          : 'Em andamento'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(ride.updatedAt || ride.createdAt)}
                  </span>
                </div>

                {/* Informações do motorista */}
                {ride.driver && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ride.driver.name}</p>
                      {ride.rating?.driver && (
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-gray-600">
                            {ride.rating.driver.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Endereços */}
                <div className="space-y-3 mb-4">
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
                </div>

                {/* Detalhes da corrida + ação */}
                <div className="flex items-center gap-6">
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

                  <Link 
                    to={`/passenger/rides/${ride._id}`} 
                    className="ml-auto inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-99-primary text-white hover:bg-99-primary/90"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerRides;