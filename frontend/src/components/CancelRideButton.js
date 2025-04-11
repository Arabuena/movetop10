import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CancelRideButton = ({ rideId, onCancel }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const cancelReasons = [
    'Mudei de ideia',
    'Tempo de espera muito longo',
    'Endereço incorreto',
    'Emergência',
    'Outro'
  ];

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post(`/api/rides/${rideId}/cancel`, {
        reason: reason || 'Cancelado pelo passageiro'
      });

      if (response.data) {
        setIsModalOpen(false);
        if (onCancel) {
          onCancel();
        }
        navigate('/'); // ou para onde você quiser redirecionar após o cancelamento
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao cancelar corrida');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
      >
        Cancelar Corrida
      </button>

      {/* Modal de Cancelamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Cancelar Corrida</h2>
            
            <p className="mb-4">Por que você deseja cancelar a corrida?</p>
            
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">Selecione um motivo</option>
              {cancelReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {error && (
              <p className="text-red-600 mb-4">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isLoading}
              >
                Voltar
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading || !reason}
                className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 
                  ${(isLoading || !reason) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CancelRideButton; 