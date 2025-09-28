import React from 'react';
import Button from './Button';

/**
 * Componente para exibir erros de geolocalização e fornecer ações para o usuário
 * @param {Object} props - Propriedades do componente
 * @param {string} props.error - Mensagem de erro
 * @param {function} props.onRequestPermission - Função para solicitar permissão de localização
 * @param {function} props.onContinueWithDefault - Função para continuar com localização padrão
 * @param {string} props.permissionStatus - Status atual da permissão ('granted', 'denied', 'prompt')
 */
const LocationError = ({ 
  error, 
  onRequestPermission, 
  onContinueWithDefault,
  permissionStatus = 'prompt'
}) => {
  if (!error) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-center mb-2">Problema de Localização</h3>
        
        <p className="text-gray-600 text-center mb-6">{error}</p>
        
        <div className="space-y-3">
          {permissionStatus !== 'granted' && (
            <Button 
              onClick={onRequestPermission}
              className="w-full bg-primary"
            >
              Permitir Acesso à Localização
            </Button>
          )}
          
          <Button 
            onClick={onContinueWithDefault}
            className="w-full bg-gray-500"
          >
            Continuar com Localização Aproximada
          </Button>
          
          {permissionStatus === 'denied' && (
            <div className="text-sm text-gray-500 text-center mt-4">
              <p>Se o problema persistir, verifique as configurações do seu navegador:</p>
              <ol className="list-decimal list-inside mt-2 text-left">
                <li>Acesse as configurações do navegador</li>
                <li>Procure por "Permissões" ou "Privacidade"</li>
                <li>Habilite o acesso à localização para este site</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationError;