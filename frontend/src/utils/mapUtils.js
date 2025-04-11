/* global google */

export const calculateDistance = async (origin, destination) => {
  try {
    const service = new window.google.maps.DistanceMatrixService();
    
    const originLatLng = new window.google.maps.LatLng(origin[1], origin[0]);
    const destLatLng = new window.google.maps.LatLng(destination[1], destination[0]);

    const response = await service.getDistanceMatrix({
      origins: [originLatLng],
      destinations: [destLatLng],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC
    });

    if (response.rows[0].elements[0].status === 'OK') {
      return response.rows[0].elements[0].distance.value / 1000; // Converte para km
    }
    return null;
  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    return null;
  }
};

export const calculateDuration = async (origin, destination) => {
  try {
    const service = new window.google.maps.DistanceMatrixService();
    
    const originLatLng = new window.google.maps.LatLng(origin[1], origin[0]);
    const destLatLng = new window.google.maps.LatLng(destination[1], destination[0]);

    const response = await service.getDistanceMatrix({
      origins: [originLatLng],
      destinations: [destLatLng],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC
    });

    if (response.rows[0].elements[0].status === 'OK') {
      return Math.round(response.rows[0].elements[0].duration.value / 60); // Converte para minutos
    }
    return null;
  } catch (error) {
    console.error('Erro ao calcular duração:', error);
    return null;
  }
}; 