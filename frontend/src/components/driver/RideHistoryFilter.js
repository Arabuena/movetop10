import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const RideHistoryFilter = ({ filter, onChange }) => {
  const handleStatusChange = (e) => {
    onChange({ status: e.target.value });
  };

  const handleDateRangeChange = (e) => {
    const range = e.target.value;
    onChange({
      dateRange: range,
      customRange: range === 'custom' ? filter.customRange : { start: null, end: null }
    });
  };

  const handleCustomRangeChange = (type, date) => {
    onChange({
      customRange: {
        ...filter.customRange,
        [type]: date
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtro de status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={filter.status}
            onChange={handleStatusChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 rounded-md"
          >
            <option value="all">Todos</option>
            <option value="COMPLETED">Concluídas</option>
            <option value="CANCELLED">Canceladas</option>
            <option value="IN_PROGRESS">Em andamento</option>
          </select>
        </div>

        {/* Filtro de período */}
        <div>
          <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
            Período
          </label>
          <select
            id="dateRange"
            value={filter.dateRange}
            onChange={handleDateRangeChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 rounded-md"
          >
            <option value="today">Hoje</option>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {/* Período personalizado */}
        {filter.dateRange === 'custom' && (
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                De
              </label>
              <DatePicker
                selected={filter.customRange.start}
                onChange={(date) => handleCustomRangeChange('start', date)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 rounded-md"
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecione"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Até
              </label>
              <DatePicker
                selected={filter.customRange.end}
                onChange={(date) => handleCustomRangeChange('end', date)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 rounded-md"
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecione"
                minDate={filter.customRange.start}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistoryFilter; 