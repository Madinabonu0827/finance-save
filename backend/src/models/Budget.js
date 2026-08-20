const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    limit: { type: Number, required: true, min: 0 },
    month: { type: String, required: true }, // "2026-08" formatida
    alertSent80: { type: Boolean, default: false },
    alertSent100: { type: Boolean, default: false },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
