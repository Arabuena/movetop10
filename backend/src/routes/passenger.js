const router = require('express').Router();
const auth = require('../middleware/auth');
const PassengerController = require('../controllers/PassengerController');

// Todas as rotas precisam de autenticação
router.use(auth);

// Rotas do passageiro
router.get('/profile', PassengerController.getProfile);
router.put('/profile', PassengerController.updateProfile);
router.get('/rides', PassengerController.getRides);
router.post('/rides', PassengerController.requestRide);
router.get('/rides/:id', PassengerController.getRideDetails);
router.post('/demand-multiplier', PassengerController.getDemandMultiplier);

module.exports = router; 