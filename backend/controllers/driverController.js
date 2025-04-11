const User = require('../models/User');
const Ride = require('../models/Ride');

exports.updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Coordenadas inválidas' });
    }

    const driver = await User.findByIdAndUpdate(
      req.user.id,
      {
        location: {
          type: 'Point',
          coordinates: coordinates
        }
      },
      { new: true }
    );

    res.json({ success: true, location: driver.location });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    res.status(500).json({ message: 'Erro ao atualizar localização' });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'Status de disponibilidade inválido' });
    }

    const driver = await User.findByIdAndUpdate(
      req.user.id,
      { isAvailable },
      { new: true }
    );

    res.json({ success: true, isAvailable: driver.isAvailable });
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({ message: 'Erro ao atualizar disponibilidade' });
  }
};

exports.getNearbyRides = async (req, res) => {
  try {
    console.log('Buscando corridas próximas...');
    
    const driver = await User.findById(req.user.id);
    console.log('Driver:', driver);

    if (!driver.location || !driver.location.coordinates) {
      return res.status(400).json({ 
        message: 'Localização do motorista não disponível',
        driver: driver
      });
    }

    // Busca corridas pendentes próximas
    const nearbyRides = await Ride.find({
      status: 'pending',
      'origin.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: driver.location.coordinates
          },
          $maxDistance: 10000 // 10km em metros
        }
      }
    })
    .populate('passenger', 'name phone')
    .limit(5);

    console.log('Corridas encontradas:', nearbyRides);
    res.json(nearbyRides);
  } catch (error) {
    console.error('Erro ao buscar corridas próximas:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar corridas próximas',
      error: error.message,
      stack: error.stack
    });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        status: 'pending'
      },
      {
        driver: req.user.id,
        status: 'accepted'
      },
      { new: true }
    ).populate('passenger', 'name phone');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada ou já aceita' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao aceitar corrida:', error);
    res.status(500).json({ message: 'Erro ao aceitar corrida' });
  }
}; 