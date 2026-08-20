const router = require('express').Router();
const { summary } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

router.get('/summary', requireAuth, summary);

module.exports = router;
