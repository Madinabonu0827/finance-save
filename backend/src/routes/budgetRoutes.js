const router = require('express').Router();
const { list, upsert } = require('../controllers/budgetController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, list);
router.post('/', requireAuth, upsert);

module.exports = router;
