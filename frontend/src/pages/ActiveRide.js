import React from 'react';
import CancelRideButton from '../components/CancelRideButton';

const ActiveRide = ({ ride, onRideUpdate }) => {
  // Só mostra o botão de cancelar se a corrida estiver em um estado cancelável
  const canCancel = ['PENDING', 'ACCEPTED', 'ARRIVED'].includes(ride.status);

  return (
    <div>
      {/* Outras informações da corrida */}
      
      {canCancel && (
        <div className="mt-4">
          <CancelRideButton 
            rideId={ride._id} 
            onCancel={() => {
              // Callback após o cancelamento
              if (onRideUpdate) {
                onRideUpdate();
              }
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default ActiveRide; 