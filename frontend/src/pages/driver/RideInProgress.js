import SharedRideMap from '../../../components/SharedRideMap';

const RideInProgress = ({ ride }) => {
  // ... outros estados e efeitos ...

  return (
    <div className="flex flex-col h-screen">
      {/* Barra de status */}
      <div className="bg-white shadow-sm p-4 z-10">
        {/* ... */}
      </div>

      {/* Mapa compartilhado */}
      <div className="flex-1 relative">
        <SharedRideMap
          ride={ride}
          origin={ride.origin}
          destination={ride.destination}
          directions={directions}
          driverDirections={driverDirections}
          center={ride.driver.location}
        />
      </div>

      {/* Botões de ação */}
      {/* ... */}
    </div>
  );
}; 