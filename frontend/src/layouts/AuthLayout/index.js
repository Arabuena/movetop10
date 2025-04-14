import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthHeader from '../../components/common/AuthHeader';
import Logo from '../../components/common/Logo';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-move-gray-50">
      <AuthHeader />
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 