import React, { forwardRef } from 'react';

const MaskedInput = forwardRef(({ value, onChange, mask, ...props }, ref) => {
  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // Aplicar máscara
    if (mask === 'phone') {
      // Remove tudo que não é número
      const numbersOnly = newValue.replace(/\D/g, '');
      
      // Aplica a máscara (99) 99999-9999
      if (numbersOnly.length <= 11) {
        if (numbersOnly.length > 2) {
          newValue = `(${numbersOnly.slice(0, 2)}) ${numbersOnly.slice(2)}`;
        }
        if (numbersOnly.length > 7) {
          newValue = `(${numbersOnly.slice(0, 2)}) ${numbersOnly.slice(2, 7)}-${numbersOnly.slice(7)}`;
        }
      }
    }

    // Criar novo evento com valor mascarado
    const maskedEvent = {
      ...e,
      target: {
        ...e.target,
        value: newValue
      }
    };

    if (onChange) {
      onChange(maskedEvent);
    }
  };

  return (
    <input
      ref={ref}
      value={value || ''}
      onChange={handleChange}
      maxLength={mask === 'phone' ? 15 : undefined}
      {...props}
    />
  );
});

MaskedInput.displayName = 'MaskedInput';

export default MaskedInput; 