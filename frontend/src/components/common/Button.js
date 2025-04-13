import React from 'react';

const Button = ({ children, loading, fullWidth, variant = 'primary', ...props }) => {
  const baseClasses = "flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "text-white bg-99-primary hover:bg-99-primary/90 focus:ring-99-primary",
    secondary: "text-99-primary bg-white border-99-primary hover:bg-99-gray-50 focus:ring-99-primary"
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      disabled={loading}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 