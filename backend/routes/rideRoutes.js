const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  requestRide,
  getAvailableRides,
  acceptRide,
  startRide,
  completeRide,
  cancelRide,
  getCurrentRide,
  rateRide,
  arrivedAtPickup,
  checkActiveRide,
  updateRideStatus
} = require('../controllers/rideController');
const Ride = require('../models/Ride');

// Todas as rotas precisam de autenticação
router.use(auth);

// Rotas para passageiros
router.post('/request', requestRide);
router.get('/current', getCurrentRide);
router.post('/:rideId/cancel', cancelRide);
router.post('/:rideId/rate', rateRide);

// Rotas para motoristas
router.get('/available', getAvailableRides);
router.post('/:rideId/accept', acceptRide);
router.post('/:rideId/arrived', arrivedAtPickup);
router.post('/:rideId/start', startRide);
router.post('/:rideId/complete', completeRide);

// Adicionar nova rota para verificar corrida ativa
router.get('/active', checkActiveRide);

// Adicionar rota para atualizar status
router.put('/:rideId/status', updateRideStatus);

// Rota para buscar uma corrida específica
router.get('/:rideId', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('passenger driver', 'name phone');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    // Verifica se o usuário tem permissão para ver esta corrida
    if (ride.passenger.toString() !== req.user.id && 
        (!ride.driver || ride.driver.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Sem permissão para ver esta corrida' });
    }

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rota para buscar o status de uma corrida
router.get('/status/:rideId', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('passenger', 'name')
      .populate('driver', 'name')
      .select('status origin destination driver passenger createdAt');

    if (!ride) {
      return res.status(404).json({ message: 'Corrida não encontrada' });
    }

    // Verifica se o usuário tem permissão para ver esta corrida
    if (ride.passenger._id.toString() !== req.user.id && 
        (!ride.driver || ride.driver._id.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Sem permissão para ver esta corrida' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Erro ao buscar status da corrida:', error);
    res.status(500).json({ message: 'Erro ao buscar status da corrida' });
  }
});

module.exports = router; 