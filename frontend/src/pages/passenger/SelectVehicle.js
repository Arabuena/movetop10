import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useRide } from '../../contexts/RideContext';

const vehicleCategories = [
  {
    id: 'pop',
    name: 'Pop',
    description: 'Carros compactos e econômicos',
    basePrice: 5.0,
    pricePerKm: 1.4,
    pricePerMinute: 0.26,
    icon: '/images/vehicles/pop.png',
    eta: '5 min'
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'Carros espaçosos e confortáveis',
    basePrice: 7.0,
    pricePerKm: 1.8,
    pricePerMinute: 0.3,
    icon: '/images/vehicles/comfort.png',
    eta: '7 min'
  },
  {
    id: 'top',
    name: 'Top',
    description: 'Carros de luxo com motoristas experientes',
    basePrice: 10.0,
    pricePerKm: 2.2,
    pricePerMinute: 0.35,
    icon: '/images/vehicles/top.png',
    eta: '8 min'
  }
];

const SelectVehicle = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { requestRide } = useRide();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { origin, destination } = location.state || {};

  useEffect(() => {
    if (!origin || !destination) {
      navigate('/passenger/home');
      return;
    }

    // Calcular rota e preço estimado
    const calculateRoute = async () => {
      const directionsService = new window.google.maps.DirectionsService();
      
      try {
        const result = await directionsService.route({
          origin: new window.google.maps.LatLng(origin.coordinates.lat, origin.coordinates.lng),
          destination: new window.google.maps.LatLng(destination.coordinates.lat, destination.coordinates.lng),
          travelMode: window.google.maps.TravelMode.DRIVING
        });

        const route = result.routes[0].legs[0];
        setRouteDetails({
          distance: route.distance.value / 1000, // em km
          duration: route.duration.value / 60, // em minutos
          path: result.routes[0].overview_path.map(point => ({
            lat: point.lat(),
            lng: point.lng()
          }))
        });
      } catch (error) {
        setError('Erro ao calcular rota');
      }
    };

    calculateRoute();
  }, [origin, destination, navigate]);

  const calculatePrice = (category) => {
    if (!routeDetails) return null;

    const { distance, duration } = routeDetails;
    const { basePrice, pricePerKm, pricePerMinute } = category;

    const price = basePrice + (distance * pricePerKm) + (duration * pricePerMinute);
    return price.toFixed(2);
  };

  const handleConfirmRide = async () => {
    if (!selectedCategory) return;

    try {
      setLoading(true);
      const rideData = {
        origin,
        destination,
        vehicleCategory: selectedCategory.id,
        estimatedPrice: calculatePrice(selectedCategory),
        estimatedDistance: routeDetails.distance,
        estimatedDuration: routeDetails.duration
      };

      const ride = await requestRide(rideData);
      navigate(`/passenger/rides/${ride._id}`);
    } catch (error) {
      setError('Erro ao solicitar corrida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Mapa com a rota */}
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={origin.coordinates}
          zoom={13}
          options={{ 
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          <Marker position={origin.coordinates} />
          <Marker position={destination.coordinates} />
          {routeDetails?.path && (
            <Polyline
              path={routeDetails.path}
              options={{
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 3
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Lista de categorias */}
      <div className="bg-white shadow-lg rounded-t-3xl p-4 space-y-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>Distância: {routeDetails?.distance?.toFixed(1)} km</div>
          <div>Tempo estimado: {routeDetails?.duration?.toFixed(0)} min</div>
        </div>

        <div className="space-y-3">
          {vehicleCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className={`w-full flex items-center p-3 rounded-lg border-2 transition-colors ${
                selectedCategory?.id === category.id
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img src={category.icon} alt={category.name} className="w-12 h-12" />
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{category.name}</h3>
                  <span className="font-medium">
                    R$ {calculatePrice(category)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{category.description}</p>
                <div className="text-sm text-gray-500">
                  Chegada em {category.eta}
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirmRide}
          disabled={!selectedCategory || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
            !selectedCategory || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-500'
          }`}
        >
          {loading ? 'Solicitando...' : 'Confirmar categoria'}
        </button>
      </div>
    </div>
  );
};

export default SelectVehicle; 