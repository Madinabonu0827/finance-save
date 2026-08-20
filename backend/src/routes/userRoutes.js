const router = require('express').Router();
const { updateSettings, exportData, importData, clearData } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.patch('/settings', requireAuth, updateSettings);
router.get('/export', requireAuth, exportData);
router.post('/import', requireAuth, importData);
router.delete('/data', requireAuth, clearData);

module.exports = router;
