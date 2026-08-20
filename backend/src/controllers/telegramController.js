const { customAlphabet } = require('nanoid');
const User = require('../models/User');
const TelegramConnection = require('../models/TelegramConnection');
const { getUserStats } = require('../utils/stats');

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

// Web'dan chaqiriladi (JWT bilan) — "Telegramni ulash" tugmasi bosilganda unique kod yaratadi.
async function generateLinkCode(req, res) {
  try {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 daqiqa amal qiladi

    await TelegramConnection.findOneAndUpdate(
      { user: req.userId },
      { user: req.userId, linkCode: code, linkCodeExpiresAt: expiresAt },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    res.json({ code, expiresAt, botUsername: 'AIFinanceUzBot' });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

// Bot'dan chaqiriladi — /start <code>
async function link(req, res) {
  try {
    const { code, chatId, telegramUsername } = req.body;
    if (!code || !chatId) return res.status(400).json({ message: 'code va chatId majburiy' });

    const connection = await TelegramConnection.findOne({ linkCode: code });
    if (!connection) return res.status(404).json({ message: 'Kod noto\'g\'ri yoki eskirgan' });
    if (connection.linkCodeExpiresAt && connection.linkCodeExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Kod muddati o\'tgan, Web ilovadan qayta so\'rang' });
    }

    connection.chatId = String(chatId);
    connection.telegramUsername = telegramUsername || '';
    connection.linked = true;
    connection.linkCode = null;
    connection.linkCodeExpiresAt = null;
    await connection.save();

    const user = await User.findById(connection.user);
    const stats = await getUserStats(connection.user);

    res.json({ name: user.name, balance: stats.balance });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function getConnectionOr404(chatId, res) {
  const connection = await TelegramConnection.findOne({ chatId: String(chatId), linked: true });
  if (!connection) {
    res.status(404).json({ message: 'Bu Telegram hisob ulanmagan' });
    return null;
  }
  return connection;
}

async function me(req, res) {
  try {
    const connection = await getConnectionOr404(req.params.chatId, res);
    if (!connection) return;
    const user = await User.findById(connection.user);
    const stats = await getUserStats(connection.user);
    res.json({ name: user.name, balance: stats.balance });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function summary(req, res) {
  try {
    const connection = await getConnectionOr404(req.params.chatId, res);
    if (!connection) return;
    const stats = await getUserStats(connection.user);
    res.json({ balance: stats.balance, income: stats.totalIncome, expense: stats.totalExpense });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function budget(req, res) {
  try {
    const connection = await getConnectionOr404(req.params.chatId, res);
    if (!connection) return;
    const stats = await getUserStats(connection.user);
    res.json({ categories: stats.budgets.map((b) => ({ name: b.category, limit: b.limit, spent: b.spent })) });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function savings(req, res) {
  try {
    const connection = await getConnectionOr404(req.params.chatId, res);
    if (!connection) return;
    const stats = await getUserStats(connection.user);
    res.json({
      goals: stats.savingsGoals.map((g) => ({ name: g.name, target: g.targetAmount, current: g.currentAmount })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { generateLinkCode, link, me, summary, budget, savings };
