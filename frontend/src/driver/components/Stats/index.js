import React from 'react';
import { formatCurrency } from '../../../utils/format';

const Stats = ({ data }) => {
  const { totalRides, rating, todayEarnings } = data;

  return (
    <div className="flex gap-6">
      <div className="text-center">
        <p className="text-sm text-gray-600">Hoje</p>
        <p className="text-lg font-semibold">{formatCurrency(todayEarnings)}</p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600">Corridas</p>
        <p className="text-lg font-semibold">{totalRides}</p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600">Avaliação</p>
        <p className="text-lg font-semibold">{rating.toFixed(1)}⭐</p>
      </div>
    </div>
  );
};

export default Stats; 