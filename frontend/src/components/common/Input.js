import React from 'react';
import InputMask from 'react-input-mask';

const Input = ({ label, id, mask, error, ...props }) => {
  const inputProps = {
    id,
    className: `appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-99-gray-400 focus:outline-none focus:ring-99-primary focus:border-99-primary ${
      error 
        ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
        : 'border-99-gray-300'
    }`,
    ...props
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-99-gray-700">
          {label}
        </label>
      )}
      <div className="mt-1">
        {mask ? (
          <InputMask mask={mask} {...inputProps} />
        ) : (
          <input {...inputProps} />
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input; 