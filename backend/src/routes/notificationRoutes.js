const router = require('express').Router();
const { list } = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, list);

module.exports = router;
