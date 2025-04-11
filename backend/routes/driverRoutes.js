const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const driverController = require('../controllers/driverController');

// Middleware para verificar se é motorista
const isDriver = (req, res, next) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ message: 'Acesso negado. Apenas motoristas podem acessar esta rota.' });
  }
  next();
};

// Rotas do motorista
router.post('/location', auth, isDriver, driverController.updateLocation);
router.post('/availability', auth, isDriver, driverController.updateAvailability);
router.get('/rides/nearby', auth, isDriver, driverController.getNearbyRides);

module.exports = router; 