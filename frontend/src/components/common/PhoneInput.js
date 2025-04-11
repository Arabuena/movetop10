import React from 'react';
import InputMask from 'react-input-mask';

const PhoneInput = ({ value, onChange, placeholder, error }) => {
  return (
    <div>
      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
        Telefone
      </label>
      <div className="mt-1">
        <InputMask
          id="phone"
          type="tel"
          mask="(99) 99999-9999"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none block w-full px-3 py-2 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm`}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default PhoneInput; 