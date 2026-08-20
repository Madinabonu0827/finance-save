const router = require('express').Router();
const { list, create, addAmount } = require('../controllers/savingsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, list);
router.post('/', requireAuth, create);
router.post('/:id/add', requireAuth, addAmount);

module.exports = router;
