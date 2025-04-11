import React, { useState } from 'react';

const FAQSection = () => {
  const [openItem, setOpenItem] = useState(null);

  const faqs = [
    {
      question: 'Como funciona o sistema de pagamento?',
      answer: 'Os pagamentos são processados automaticamente após cada corrida. O valor é transferido para sua conta bancária cadastrada em até 2 dias úteis.'
    },
    {
      question: 'O que fazer em caso de acidente?',
      answer: 'Em caso de acidente: 1. Verifique se há feridos e chame socorro se necessário; 2. Acione o seguro através do app; 3. Tire fotos do ocorrido; 4. Entre em contato com nosso suporte.'
    },
    {
      question: 'Como alterar meus dados bancários?',
      answer: 'Acesse seu perfil, clique em "Dados Bancários" e siga as instruções para atualizar suas informações. A alteração pode levar até 24h para ser processada.'
    },
    // ... mais FAQs
  ];

  return (
    <div className="bg-white shadow rounded-lg divide-y">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900">
          Perguntas Frequentes
        </h2>
      </div>
      <div className="divide-y">
        {faqs.map((faq, index) => (
          <div key={index} className="p-6">
            <button
              onClick={() => setOpenItem(openItem === index ? null : index)}
              className="flex justify-between items-center w-full text-left"
            >
              <span className="text-sm font-medium text-gray-900">
                {faq.question}
              </span>
              <span className="material-icons-outlined text-gray-400">
                {openItem === index ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {openItem === index && (
              <p className="mt-2 text-sm text-gray-500">
                {faq.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection; 