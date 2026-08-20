const router = require('express').Router();
const { list, create, remove, voiceParse, parseOnly } = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');
const { resolveUser } = require('../middleware/resolveUser');

router.get('/', requireAuth, list);
router.post('/', requireAuth, create);
router.delete('/:id', requireAuth, remove);
router.post('/voice-parse', resolveUser, voiceParse); // Telegram bot chaqiradi (chatId orqali)
router.post('/parse', requireAuth, parseOnly); // Web ovozli/tezkor kiritish — faqat aniqlaydi, saqlamaydi

module.exports = router;
