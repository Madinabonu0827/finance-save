const router = require('express').Router();
const { register, login, me, telegramAuth } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/telegram', telegramAuth);
router.get('/me', requireAuth, me);

module.exports = router;
