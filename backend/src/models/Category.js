const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: '💰' },
    type: { type: String, enum: ['expense', 'income'], default: 'expense' },
    isDefault: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = standart kategoriya (hammaga umumiy)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
