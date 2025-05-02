import React, { useState, useEffect } from 'react';

const DriverMap = () => {
  const [mapError, setMapError] = useState(false);
  
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (!window.google || !window.google.maps) {
        console.error('Google Maps failed to load');
        setMapError(true);
      }
    };

    // Check after a delay to ensure we catch loading issues
    const timer = setTimeout(checkGoogleMaps, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (mapError) {
    return (
      <div className="map-error-container">
        <h3>Não foi possível carregar o mapa</h3>
        <button onClick={() => window.location.reload()}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  // ... resto do código existente do mapa ...
};

export default DriverMap; 