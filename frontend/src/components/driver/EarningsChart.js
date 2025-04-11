import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const EarningsChart = ({ data, period }) => {
  const formatXAxis = (value) => {
    if (period === 'day') {
      return `${value}h`;
    }
    if (period === 'week') {
      return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][value];
    }
    return `${value + 1}`;
  };

  const formatTooltip = (value) => {
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            tickFormatter={formatXAxis}
            stroke="#6B7280"
          />
          <YAxis
            tickFormatter={(value) => `R$ ${value}`}
            stroke="#6B7280"
          />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={formatXAxis}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: '#F59E0B' }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EarningsChart; 