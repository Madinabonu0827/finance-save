const RecurringPayment = require('../models/RecurringPayment');
const { notifyUser } = require('./notify');
const { formatMoney, currentMonthKey } = require('./format');

// Bugungi kunga to'g'ri keladigan takrorlanuvchi to'lovlarni tekshirib, bir oyda bir marta eslatma yuboradi.
async function checkRecurringPayments() {
  const today = new Date();
  const day = today.getDate();
  const monthKey = currentMonthKey(today);

  try {
    const due = await RecurringPayment.find({ active: true, dayOfMonth: day, lastNotifiedMonth: { $ne: monthKey } }).populate(
      'category'
    );

    for (const payment of due) {
      await notifyUser(payment.user, {
        type: 'recurring_payment',
        title: `⏰ To'lov eslatmasi: ${payment.name}`,
        message: `Bugun "${payment.name}" to'lovini amalga oshirish vaqti keldi — ${formatMoney(payment.amount)} so'm (${payment.category.name}).`,
      });
      payment.lastNotifiedMonth = monthKey;
      await payment.save();
    }
  } catch (err) {
    console.error('❌ checkRecurringPayments xatosi:', err.message);
  }
}

module.exports = { checkRecurringPayments };
