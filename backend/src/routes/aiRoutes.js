const router = require('express').Router();
const { chat, history } = require('../controllers/aiController');
const { resolveUser } = require('../middleware/resolveUser');

router.post('/chat', resolveUser, chat); // Web (JWT) yoki Telegram (chatId) ikkalasidan ham
router.get('/history', resolveUser, history);

module.exports = router;
