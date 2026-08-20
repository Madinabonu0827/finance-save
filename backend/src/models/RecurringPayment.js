const mongoose = require('mongoose');

const recurringPaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    dayOfMonth: { type: Number, required: true, min: 1, max: 28 },
    lastNotifiedMonth: { type: String, default: null }, // "2026-08" — bir oyda bitta marta eslatma
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecurringPayment', recurringPaymentSchema);
