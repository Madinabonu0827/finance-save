const router = require('express').Router();
const { generateLinkCode, link, me, summary, budget, savings, status } = require('../controllers/telegramController');
const { requireAuth } = require('../middleware/auth');

router.get('/status', requireAuth, status); // Web chaqiradi — ulanish holatini tekshirish
router.post('/link-code', requireAuth, generateLinkCode); // Web chaqiradi
router.post('/link', link); // Bot chaqiradi
router.get('/me/:chatId', me);
router.get('/summary/:chatId', summary);
router.get('/budget/:chatId', budget);
router.get('/savings/:chatId', savings);

module.exports = router;
