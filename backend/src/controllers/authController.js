const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const TelegramConnection = require('../models/TelegramConnection');
const { signToken } = require('../utils/jwt');

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Ism, email va parol majburiy' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Bu email allaqachon ro\'yxatdan o\'tgan' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency, theme: user.theme, language: user.language },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email va parol majburiy' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Email yoki parol noto\'g\'ri' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Email yoki parol noto\'g\'ri' });

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency, theme: user.theme, language: user.language },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

// Telegram Mini App initData'ni rasmiy sxema bo'yicha tekshirish:
// secret_key = HMAC_SHA256(key="WebAppData", message=BOT_TOKEN)
// hash      = HMAC_SHA256(key=secret_key, message=data_check_string)
function validateInitData(initData) {
  if (!initData || typeof initData !== 'string') return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !process.env.BOT_TOKEN) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (computed !== hash) return null;

  // auth_date 24 soatdan eski bo'lmasin (replay hujumidan himoya)
  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;

  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

// Mini App'dan chaqiriladi — Telegram imzosini tekshirib, ulangan hisobga JWT beradi.
async function telegramAuth(req, res) {
  try {
    const tgUser = validateInitData(req.body?.initData);
    if (!tgUser || !tgUser.id) {
      return res.status(401).json({ message: "Telegram imzosi noto'g'ri yoki eskirgan" });
    }

    const connection = await TelegramConnection.findOne({ chatId: String(tgUser.id), linked: true });
    if (!connection) {
      return res.status(404).json({
        message: "Bu Telegram hisob hali ulanmagan. Web ilovada 'Telegramni ulash' kodi olib, botga /start <kod> yuboring.",
      });
    }

    const user = await User.findById(connection.user);
    if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency, theme: user.theme, language: user.language },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { register, login, me, telegramAuth };
