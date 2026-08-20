const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const RecurringPayment = require('../models/RecurringPayment');
const Debt = require('../models/Debt');

async function updateSettings(req, res) {
  try {
    const { currency, theme, language, name } = req.body;
    const update = {};
    if (currency) update.currency = currency;
    if (theme && ['light', 'dark', 'system'].includes(theme)) update.theme = theme;
    if (language) update.language = language;
    if (name) update.name = name;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function exportData(req, res) {
  try {
    const [transactions, budgets, savingsGoals, recurringPayments, debts] = await Promise.all([
      Transaction.find({ user: req.userId }),
      Budget.find({ user: req.userId }),
      SavingsGoal.find({ user: req.userId }),
      RecurringPayment.find({ user: req.userId }),
      Debt.find({ user: req.userId }),
    ]);
    res.json({ exportedAt: new Date(), transactions, budgets, savingsGoals, recurringPayments, debts });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function importData(req, res) {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ message: 'transactions massiv bo\'lishi kerak' });
    }
    const docs = transactions
      .filter((t) => t.amount > 0 && ['expense', 'income'].includes(t.type) && t.category)
      .map((t) => ({
        user: req.userId,
        type: t.type,
        amount: t.amount,
        category: t.category,
        note: t.note || '',
        date: t.date ? new Date(t.date) : new Date(),
        source: 'web',
      }));
    const created = await Transaction.insertMany(docs);
    res.json({ message: `${created.length} ta tranzaksiya import qilindi` });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function clearData(req, res) {
  try {
    await Promise.all([
      Transaction.deleteMany({ user: req.userId }),
      Budget.deleteMany({ user: req.userId }),
      SavingsGoal.deleteMany({ user: req.userId }),
      RecurringPayment.deleteMany({ user: req.userId }),
      Debt.deleteMany({ user: req.userId }),
    ]);
    res.json({ message: 'Barcha ma\'lumotlar tozalandi' });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { updateSettings, exportData, importData, clearData };
