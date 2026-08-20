const mongoose = require('mongoose');

const telegramConnectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    chatId: { type: String, unique: true, sparse: true },
    telegramUsername: { type: String },
    linkCode: { type: String }, // vaqtinchalik, ulanmaguncha
    linkCodeExpiresAt: { type: Date },
    linked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TelegramConnection', telegramConnectionSchema);
