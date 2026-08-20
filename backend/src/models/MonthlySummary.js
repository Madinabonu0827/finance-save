const mongoose = require('mongoose');

// Har oy uchun keshlangan xulosa — statistika sahifasini tezlashtirish uchun (ixtiyoriy optimallashtirish).
const monthlySummarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: String, required: true }, // "2026-08"
    totalIncome: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    byCategory: [
      {
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        amount: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

monthlySummarySchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlySummary', monthlySummarySchema);
