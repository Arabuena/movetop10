import React from 'react';

const periodLabels = {
  day: 'hoje',
  week: 'esta semana',
  month: 'este mês'
};

const EarningsSummary = ({ total, rides, average, period }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">
          Total ganho {periodLabels[period]}
        </h3>
        <p className="mt-2 flex items-baseline">
          <span className="text-3xl font-semibold text-gray-900">
            R$ {total.toFixed(2)}
          </span>
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">
          Corridas realizadas
        </h3>
        <p className="mt-2 flex items-baseline">
          <span className="text-3xl font-semibold text-gray-900">
            {rides}
          </span>
          <span className="ml-2 text-sm text-gray-500">
            corridas
          </span>
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500">
          Média por corrida
        </h3>
        <p className="mt-2 flex items-baseline">
          <span className="text-3xl font-semibold text-gray-900">
            R$ {average.toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  );
};

export default EarningsSummary; 