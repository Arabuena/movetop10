const router = require('express').Router();
const auth = require('../middleware/auth');
const DriverController = require('../controllers/DriverController');

// Todas as rotas precisam de autenticação
router.use(auth);

// Rotas do motorista
router.get('/profile', DriverController.getProfile);
router.put('/profile', DriverController.updateProfile);
router.get('/rides', DriverController.getRides);
router.get('/earnings', DriverController.getEarnings);
router.put('/status', DriverController.updateStatus);

module.exports = router; 