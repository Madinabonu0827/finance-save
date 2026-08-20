const { verifyToken } = require('../utils/jwt');
const TelegramConnection = require('../models/TelegramConnection');

// AI chat kabi Web VA Telegram ikkalasidan ham chaqiriladigan endpointlar uchun:
// Authorization header bo'lsa JWT orqali, aks holda body.chatId orqali (bog'langan bo'lsa) userni aniqlaydi.
async function resolveUser(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.userId = decoded.id;
      return next();
    } catch {
      return res.status(401).json({ message: 'Token yaroqsiz yoki muddati o\'tgan' });
    }
  }

  const chatId = req.body?.chatId || req.params?.chatId;
  if (!chatId) return res.status(401).json({ message: 'Avtorizatsiya yoki chatId talab qilinadi' });

  try {
    const connection = await TelegramConnection.findOne({ chatId, linked: true });
    if (!connection) return res.status(404).json({ message: 'Bu Telegram hisob ulanmagan' });
    req.userId = connection.user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { resolveUser };
