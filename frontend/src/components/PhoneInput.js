import React, { forwardRef } from 'react';
import InputMask from 'react-input-mask';

const PhoneInput = forwardRef(({ value, onChange, ...props }, ref) => {
  return (
    <InputMask
      mask="(99) 99999-9999"
      value={value}
      onChange={onChange}
      ref={ref}
      {...props}
    >
      {(inputProps) => (
        <input
          type="tel"
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder="(11) 99999-9999"
          {...inputProps}
        />
      )}
    </InputMask>
  );
});

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput; 