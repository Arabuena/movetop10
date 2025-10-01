import React, { useState } from 'react';
import {
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

const PaymentMethod = ({ id, icon: Icon, title, description, selected, onClick }) => (
  <div
    onClick={() => onClick(id)}
    className={`flex items-center p-4 border rounded-lg mb-3 cursor-pointer transition-colors ${
      selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
    }`}
  >
    <div className="mr-4">
      <Icon className={`h-8 w-8 ${selected ? 'text-purple-500' : 'text-gray-400'}`} />
    </div>
    <div className="flex-1">
      <h3 className={`font-medium ${selected ? 'text-purple-700' : 'text-gray-900'}`}>{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <div className="ml-2">
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        selected ? 'border-purple-500' : 'border-gray-300'
      }`}>
        {selected && <div className="w-3 h-3 rounded-full bg-purple-500"></div>}
      </div>
    </div>
  </div>
);

const SelectPayment = ({ onConfirm, onBack }) => {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  
  const paymentMethods = [
    {
      id: 'cash',
      icon: BanknotesIcon,
      title: 'Dinheiro',
      description: 'Pague em dinheiro ao final da corrida'
    },
    {
      id: 'credit_card',
      icon: CreditCardIcon,
      title: 'Cartão de Crédito',
      description: 'Visa, Mastercard, Elo, American Express'
    },
    {
      id: 'debit_card',
      icon: CreditCardIcon,
      title: 'Cartão de Débito',
      description: 'Visa, Mastercard, Elo'
    },
    {
      id: 'pix',
      icon: DevicePhoneMobileIcon,
      title: 'PIX',
      description: 'Pagamento instantâneo'
    }
  ];

  const handleSelectMethod = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handleConfirm = () => {
    onConfirm(selectedMethod);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho */}
      <div className="p-4 bg-white">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Forma de pagamento
        </h1>
      </div>

      {/* Lista de métodos de pagamento */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Selecione como deseja pagar</h2>
          
          {paymentMethods.map((method) => (
            <PaymentMethod
              key={method.id}
              {...method}
              selected={selectedMethod === method.id}
              onClick={handleSelectMethod}
            />
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={() => {}}
            className="flex items-center text-purple-600 font-medium"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Adicionar nova forma de pagamento
          </button>
        </div>
      </div>

      {/* Botões */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectPayment;