const PRICE_PER_KM = 2.0;
const BASE_PRICE = 7.0;
const MIN_PRICE = 10.0;

// Multiplicadores de preço
const MULTIPLIERS = {
  TRAFFIC: 1.2,     // Trânsito intenso
  PEAK_HOURS: 1.3,  // Horário de pico
  NIGHT: 1.2,       // Tarifa noturna (22h - 6h)
  RAIN: 1.15,       // Clima chuvoso
  HIGH_DEMAND: 1.4, // Alta demanda
  EVENTS: 1.25      // Eventos especiais
};

// Categorias de veículos
const CATEGORIES = {
  standard: { name: '99Pop', multiplier: 1.0 },
  comfort: { name: 'Comfort', multiplier: 1.3 },
  luxury: { name: 'TOP', multiplier: 1.8 }
};

// Verifica se é horário de pico
const isPeakHour = () => {
  const hour = new Date().getHours();
  const weekday = new Date().getDay();
  
  // Segunda a Sexta
  if (weekday >= 1 && weekday <= 5) {
    // Manhã: 7h-9h, Tarde: 17h-19h
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }
  return false;
};

// Verifica se é horário noturno
const isNightTime = () => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
};

// Obter multiplicador de demanda da API
const getDemandMultiplier = async (location) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/passenger/demand-multiplier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ location })
    });

    if (!response.ok) {
      throw new Error('Erro ao obter multiplicador');
    }

    const data = await response.json();
    return data.multiplier || 1.0;
  } catch (error) {
    console.warn('Usando multiplicador padrão:', error);
    return 1.0;
  }
};

export const calculateRideEstimates = async (origin, destination) => {
  // Criar serviço de direções do Google Maps
  const directionsService = new window.google.maps.DirectionsService();

  try {
    // Obter rota
    const result = await directionsService.route({
      origin: new window.google.maps.LatLng(origin.lat, origin.lng),
      destination: new window.google.maps.LatLng(destination.lat, destination.lng),
      travelMode: window.google.maps.TravelMode.DRIVING,
    });

    // Extrair distância e duração
    const distance = result.routes[0].legs[0].distance;
    const duration = result.routes[0].legs[0].duration;

    // Calcular preços para cada categoria
    const basePrice = 5; // Taxa base
    const pricePerKm = 2; // Preço por km
    const pricePerMinute = 0.5; // Preço por minuto

    const distanceInKm = distance.value / 1000;
    const durationInMinutes = duration.value / 60;

    const standardPrice = (
      basePrice +
      (distanceInKm * pricePerKm) +
      (durationInMinutes * pricePerMinute)
    ).toFixed(2);

    // Retornar estimativas
    return {
      distance,
      duration,
      prices: {
        standard: parseFloat(standardPrice),
        comfort: parseFloat((standardPrice * 1.2).toFixed(2)), // 20% mais caro
        premium: parseFloat((standardPrice * 1.5).toFixed(2)), // 50% mais caro
      }
    };
  } catch (error) {
    console.error('Erro ao calcular rota:', error);
    throw new Error('Não foi possível calcular a rota');
  }
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

export const formatDuration = (duration) => {
  if (!duration) return '';
  
  const minutes = Math.floor(duration.value / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}; 