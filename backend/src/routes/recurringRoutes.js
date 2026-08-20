const router = require('express').Router();
const { list, create, remove } = require('../controllers/recurringController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, list);
router.post('/', requireAuth, create);
router.delete('/:id', requireAuth, remove);

module.exports = router;
