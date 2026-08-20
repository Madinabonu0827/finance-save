const router = require('express').Router();
const { list, create, remove, voiceParse } = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');
const { resolveUser } = require('../middleware/resolveUser');

router.get('/', requireAuth, list);
router.post('/', requireAuth, create);
router.delete('/:id', requireAuth, remove);
router.post('/voice-parse', resolveUser, voiceParse); // Telegram bot chaqiradi (chatId orqali)

module.exports = router;
