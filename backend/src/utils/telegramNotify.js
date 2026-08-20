const axios = require('axios');

// Backend to'g'ridan-to'g'ri Telegram Bot API orqali xabar yuboradi — bot process bunga aralashmaydi.
async function sendTelegramMessage(chatId, text) {
  if (!chatId || !process.env.BOT_TOKEN) return false;
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
    return true;
  } catch (err) {
    console.error('❌ Telegram xabar yuborishda xato:', err.response?.data?.description || err.message);
    return false;
  }
}

module.exports = { sendTelegramMessage };
