const Debt = require('../models/Debt');
const { notifyUser } = require('./notify');
const { formatMoney } = require('./format');

// Muddati bugun yoki o'tib ketgan, hali qaytarilmagan (pending) qarzlar uchun bir martalik
// eslatma yuboradi (reminderSent orqali takrorlanishning oldi olinadi).
async function checkDebtReminders() {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  try {
    const dueDebts = await Debt.find({
      status: 'pending',
      reminderSent: false,
      dueDate: { $ne: null, $lte: endOfToday },
    });

    for (const debt of dueDebts) {
      const isBorrowed = debt.type === 'borrowed';
      await notifyUser(debt.user, {
        type: 'debt_due',
        title: isBorrowed ? `⏰ Qarz qaytarish muddati keldi` : `⏰ Qarzni undirish muddati keldi`,
        message: isBorrowed
          ? `${debt.personName}ga ${formatMoney(debt.amount)} so'm qarzingizni qaytarish muddati keldi.`
          : `${debt.personName} sizga ${formatMoney(debt.amount)} so'm qarzini qaytarish muddati keldi.`,
      });
      debt.reminderSent = true;
      await debt.save();
    }
  } catch (err) {
    console.error('❌ checkDebtReminders xatosi:', err.message);
  }
}

module.exports = { checkDebtReminders };
