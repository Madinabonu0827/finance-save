const AIConversation = require('../models/AIConversation');
const AIMessage = require('../models/AIMessage');
const { getUserStats } = require('../utils/stats');
const { buildAdvice } = require('../utils/aiAdvisor');

// req.userId `resolveUser` middleware orqali (JWT yoki chatId) aniqlangan bo'ladi — Web va Telegram umumiy.
async function chat(req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: 'message majburiy' });

    const stats = await getUserStats(req.userId);
    const reply = buildAdvice(message, stats);

    let conversation = await AIConversation.findOne({ user: req.userId }).sort({ createdAt: -1 });
    if (!conversation) conversation = await AIConversation.create({ user: req.userId });

    await AIMessage.create({ conversation: conversation._id, user: req.userId, role: 'user', content: message });
    await AIMessage.create({ conversation: conversation._id, user: req.userId, role: 'assistant', content: reply });

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function history(req, res) {
  try {
    const conversation = await AIConversation.findOne({ user: req.userId }).sort({ createdAt: -1 });
    if (!conversation) return res.json([]);
    const messages = await AIMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { chat, history };
