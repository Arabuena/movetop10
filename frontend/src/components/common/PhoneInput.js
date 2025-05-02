import React, { forwardRef } from 'react';
import MaskedInput from './MaskedInput';

const PhoneInput = forwardRef(({ value, onChange, error, id, label, ...props }, ref) => {
  // Garantir que sempre temos um ID único
  const inputId = id || `phone-input-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-move-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <MaskedInput
        id={inputId}
        name={inputId} // Adicionar name para ajudar no autofill
        type="tel"
        mask="phone"
        value={value}
        onChange={handleChange}
        ref={ref}
        aria-labelledby={label ? inputId + '-label' : undefined}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-500 focus:ring-red-200'
            : 'border-move-gray-300 focus:ring-move-primary-200'
        }`}
        {...props}
      />
      {error && (
        <p 
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-500" 
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

// Adicionar displayName para melhor debugging
PhoneInput.displayName = 'PhoneInput';

export default PhoneInput; 