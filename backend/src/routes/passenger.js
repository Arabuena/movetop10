const router = require('express').Router();
const auth = require('../middleware/auth');
const PassengerController = require('../controllers/PassengerController');
const upload = require('../middleware/upload');

// Todas as rotas precisam de autenticação
router.use(auth);

// Rotas do passageiro
router.get('/profile', PassengerController.getProfile);
router.put('/profile', PassengerController.updateProfile);
router.post('/avatar', upload.single('avatar'), PassengerController.updateAvatar);
router.get('/rides', PassengerController.getRides);
router.post('/rides', PassengerController.requestRide);
router.get('/rides/:id', PassengerController.getRideDetails);
// Avaliação de corrida (passageiro avalia motorista)
router.post('/rides/:id/rate', PassengerController.rateRide);
router.post('/demand-multiplier', PassengerController.getDemandMultiplier);

module.exports = router;