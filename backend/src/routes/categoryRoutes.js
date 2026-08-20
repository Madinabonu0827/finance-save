const router = require('express').Router();
const { list } = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, list);

module.exports = router;
