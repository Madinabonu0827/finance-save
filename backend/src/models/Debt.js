const mongoose = require('mongoose');

// type: 'borrowed' — foydalanuvchi qarz OLDI (u qaytarishi kerak)
//       'lent'     — foydalanuvchi qarz BERDI (unga qaytarishlari kerak)
const debtSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['borrowed', 'lent'], required: true },
    personName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now }, // qachon olindi/berildi
    dueDate: { type: Date, default: null }, // qachon qaytarilishi kerak (ixtiyoriy)
    note: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt: { type: Date, default: null },
    reminderSent: { type: Boolean, default: false }, // muddat eslatmasi bir marta yuborilishi uchun
  },
  { timestamps: true }
);

debtSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Debt', debtSchema);
