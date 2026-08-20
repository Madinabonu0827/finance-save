const { verifyToken } = require('../utils/jwt');

// Web uchun qat'iy JWT auth — Authorization: Bearer <token> shart.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
  try {
    const decoded = verifyToken(token);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Token yaroqsiz yoki muddati o\'tgan' });
  }
}

module.exports = { requireAuth };
