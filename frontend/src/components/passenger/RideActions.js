import React, { useState } from 'react';
import Chat from './Chat';
import ShareRide from './ShareRide';

const RideActions = ({ ride, onCancel, onChat, onCall, onShare }) => {
  const [showChat, setShowChat] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleChatClick = () => {
    setShowChat(true);
  };

  const handleShareClick = () => {
    setShowShare(true);
  };

  return (
    <>
      <div className="p-4 space-y-4">
        <div className="flex justify-around">
          <button
            onClick={handleChatClick}
            className="flex flex-col items-center text-gray-600"
          >
            <span className="material-icons-outlined mb-1">chat</span>
            <span className="text-sm">Mensagem</span>
          </button>

          <button
            onClick={onCall}
            className="flex flex-col items-center text-gray-600"
          >
            <span className="material-icons-outlined mb-1">phone</span>
            <span className="text-sm">Ligar</span>
          </button>

          <button
            onClick={handleShareClick}
            className="flex flex-col items-center text-gray-600"
          >
            <span className="material-icons-outlined mb-1">share</span>
            <span className="text-sm">Compartilhar</span>
          </button>
        </div>

        {ride.status === 'PENDING' && (
          <button
            onClick={onCancel}
            className="w-full py-3 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
          >
            Cancelar corrida
          </button>
        )}
      </div>

      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute inset-0 sm:inset-4 bg-white rounded-lg flex flex-col overflow-hidden">
            <Chat
              rideId={ride._id}
              driverName={ride.driver?.name}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {showShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ShareRide
              ride={ride}
              onClose={() => setShowShare(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RideActions; 