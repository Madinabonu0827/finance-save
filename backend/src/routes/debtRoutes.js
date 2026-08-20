const router = require('express').Router();
const { list, create, update, markPaid, remove } = require('../controllers/debtController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, list);
router.post('/', requireAuth, create);
router.patch('/:id', requireAuth, update);
router.post('/:id/paid', requireAuth, markPaid);
router.delete('/:id', requireAuth, remove);

module.exports = router;
