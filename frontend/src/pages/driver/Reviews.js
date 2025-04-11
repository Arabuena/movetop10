import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ReviewCard from '../../components/driver/ReviewCard';
import ReviewStats from '../../components/driver/ReviewStats';

const Reviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, positive, negative

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await api.get('/driver/reviews');
        setReviews(response.data.reviews);
        setStats(response.data.stats);
      } catch (error) {
        setError('Erro ao carregar avaliações');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter(review => {
    if (filter === 'positive') return review.rating >= 4;
    if (filter === 'negative') return review.rating <= 2;
    return true;
  });

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
                Minhas avaliações
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {stats.total} avaliações recebidas
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
        {/* Estatísticas */}
        <ReviewStats stats={stats} />

        {/* Filtros */}
        <div className="mt-8 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filter === 'all'
                  ? 'bg-yellow-400 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('positive')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filter === 'positive'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Positivas
            </button>
            <button
              onClick={() => setFilter('negative')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filter === 'negative'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Negativas
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Lista de avaliações */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons-outlined text-4xl text-gray-400">
                star_outline
              </span>
              <p className="mt-2 text-gray-500">
                Nenhuma avaliação encontrada
              </p>
            </div>
          ) : (
            filteredReviews.map(review => (
              <ReviewCard key={review._id} review={review} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews; 