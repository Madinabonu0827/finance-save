const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { currentMonthKey, formatMoney } = require('../utils/format');
const { monthRange } = require('../utils/stats');
const { notifyUser } = require('../utils/notify');

async function list(req, res) {
  try {
    const month = req.query.month || currentMonthKey();
    const { start, end } = monthRange(month);

    const budgets = await Budget.find({ user: req.userId, month }).populate('category');
    const result = await Promise.all(
      budgets.map(async (b) => {
        const spent = await Transaction.aggregate([
          { $match: { user: b.user, category: b.category._id, type: 'expense', date: { $gte: start, $lt: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return {
          id: b._id,
          category: { id: b.category._id, name: b.category.name, emoji: b.category.emoji },
          limit: b.limit,
          spent: spent[0]?.total || 0,
          month: b.month,
        };
      })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function upsert(req, res) {
  try {
    const { categoryId, limit, month } = req.body;
    if (!categoryId || limit == null || limit < 0) {
      return res.status(400).json({ message: 'Kategoriya va limit (musbat son) majburiy' });
    }
    const category = await Category.findById(categoryId);
    if (!category) return res.status(400).json({ message: 'Kategoriya topilmadi' });

    const monthKey = month || currentMonthKey();
    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, category: categoryId, month: monthKey },
      { limit, $setOnInsert: { alertSent80: false, alertSent100: false } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    ).populate('category');

    res.json({
      id: budget._id,
      category: { id: budget.category._id, name: budget.category.name, emoji: budget.category.emoji },
      limit: budget.limit,
      month: budget.month,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

// Tranzaksiya qo'shilgandan keyin chaqiriladi — limit 80%/100%ga yetsa real Telegram notification yuboradi.
async function checkBudgetThresholds(userId, categoryId, date = new Date()) {
  const monthKey = currentMonthKey(date);
  const budget = await Budget.findOne({ user: userId, category: categoryId, month: monthKey }).populate('category');
  if (!budget || budget.limit <= 0) return;

  const { start, end } = monthRange(monthKey);
  const spentAgg = await Transaction.aggregate([
    { $match: { user: budget.user, category: budget.category._id, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const spent = spentAgg[0]?.total || 0;
  const pct = spent / budget.limit;

  if (pct >= 1 && !budget.alertSent100) {
    budget.alertSent100 = true;
    await budget.save();
    await notifyUser(userId, {
      type: 'budget_100',
      title: `🔴 ${budget.category.name} byudjeti oshib ketdi!`,
      message: `Bu oy ${budget.category.name} kategoriyasida ${formatMoney(spent)} so'm sarfladingiz — belgilangan limit ${formatMoney(budget.limit)} so'm edi.`,
    });
  } else if (pct >= 0.8 && !budget.alertSent80) {
    budget.alertSent80 = true;
    await budget.save();
    await notifyUser(userId, {
      type: 'budget_80',
      title: `🟠 ${budget.category.name} byudjeti tugayapti`,
      message: `Bu oy ${budget.category.name} kategoriyasida allaqachon ${formatMoney(spent)} so'm sarfladingiz — bu limitning ${Math.round(pct * 100)}%i (${formatMoney(budget.limit)} so'm).`,
    });
  }
}

module.exports = { list, upsert, checkBudgetThresholds };
