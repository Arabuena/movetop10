const calculatePrice = (distance, duration) => {
  // Preço base
  const baseFare = 5.00;
  
  // Taxa por km (R$ 2.00 por km)
  const distanceRate = 2.00;
  const distanceCost = distance * distanceRate;
  
  // Taxa por minuto (R$ 0.50 por minuto)
  const timeRate = 0.50;
  const timeCost = duration * timeRate;
  
  // Preço total
  const totalPrice = baseFare + distanceCost + timeCost;
  
  // Arredonda para 2 casas decimais
  return Math.round(totalPrice * 100) / 100;
};

module.exports = { calculatePrice }; 