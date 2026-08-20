const Notification = require('../models/Notification');
const TelegramConnection = require('../models/TelegramConnection');
const { sendTelegramMessage } = require('./telegramNotify');

// User uchun Notification yozuvi yaratadi va bog'langan bo'lsa Telegramga real push yuboradi.
async function notifyUser(userId, { type, title, message }) {
  const notification = await Notification.create({ user: userId, type, title, message });

  try {
    const connection = await TelegramConnection.findOne({ user: userId, linked: true });
    if (connection?.chatId) {
      const sent = await sendTelegramMessage(connection.chatId, `<b>${title}</b>\n${message}`);
      if (sent) {
        notification.sentToTelegram = true;
        await notification.save();
      }
    }
  } catch (err) {
    console.error('❌ notifyUser xatosi:', err.message);
  }

  return notification;
}

module.exports = { notifyUser };
