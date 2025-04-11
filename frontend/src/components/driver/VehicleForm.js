import React from 'react';

const VehicleForm = ({ data, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: value
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700">
          Modelo do veículo
        </label>
        <input
          type="text"
          name="model"
          id="model"
          value={data.model}
          onChange={handleChange}
          placeholder="Ex: Toyota Corolla"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
        />
      </div>

      <div>
        <label htmlFor="plate" className="block text-sm font-medium text-gray-700">
          Placa
        </label>
        <input
          type="text"
          name="plate"
          id="plate"
          value={data.plate}
          onChange={handleChange}
          placeholder="Ex: ABC1234"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
        />
      </div>

      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
          Ano
        </label>
        <input
          type="text"
          name="year"
          id="year"
          value={data.year}
          onChange={handleChange}
          placeholder="Ex: 2020"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
        />
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">
          Cor
        </label>
        <input
          type="text"
          name="color"
          id="color"
          value={data.color}
          onChange={handleChange}
          placeholder="Ex: Prata"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
        />
      </div>
    </div>
  );
};

export default VehicleForm; 