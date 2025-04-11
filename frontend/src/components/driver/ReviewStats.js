import React from 'react';

const ReviewStats = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Média geral */}
        <div className="flex items-center justify-center md:justify-start">
          <div className="text-center md:text-left">
            <div className="flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">
                {stats.average.toFixed(1)}
              </span>
              <span className="ml-2 text-xl text-gray-500">/5</span>
            </div>
            <div className="mt-2 flex items-center">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`material-icons-outlined ${
                    i < Math.round(stats.average)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  star
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Baseado em {stats.total} avaliações
            </p>
          </div>
        </div>

        {/* Distribuição */}
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(rating => {
            const percentage = stats.total > 0
              ? (stats.distribution[rating] / stats.total) * 100
              : 0;

            return (
              <div key={rating} className="flex items-center">
                <div className="flex items-center w-12">
                  <span className="text-sm text-gray-600">{rating}</span>
                  <span className="material-icons-outlined text-sm text-yellow-400 ml-1">
                    star
                  </span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right">
                  <span className="text-sm text-gray-500">
                    {stats.distribution[rating]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewStats; 