const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const { currentMonthKey } = require('./format');

function monthRange(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end };
}

// Berilgan user va oy uchun umumiy balans (barcha vaqt) va shu oy bo'yicha daromad/xarajat/kategoriya taqsimoti.
async function getUserStats(userId, monthKey = currentMonthKey()) {
  const { start, end } = monthRange(monthKey);

  const allTx = await Transaction.find({ user: userId });
  const balance = allTx.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  const monthTx = await Transaction.find({ user: userId, date: { $gte: start, $lt: end } }).populate('category');
  const totalIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const byCategoryMap = {};
  monthTx
    .filter((t) => t.type === 'expense' && t.category)
    .forEach((t) => {
      const name = `${t.category.emoji || ''} ${t.category.name}`.trim();
      byCategoryMap[name] = (byCategoryMap[name] || 0) + t.amount;
    });
  const byCategory = Object.entries(byCategoryMap).map(([name, amount]) => ({ name, amount }));

  const budgets = await Budget.find({ user: userId, month: monthKey }).populate('category');
  const budgetStats = budgets.map((b) => {
    const spent = monthTx
      .filter((t) => t.type === 'expense' && String(t.category?._id) === String(b.category._id))
      .reduce((s, t) => s + t.amount, 0);
    return { category: b.category.name, limit: b.limit, spent };
  });

  const savingsGoals = await SavingsGoal.find({ user: userId });

  return {
    balance,
    totalIncome,
    totalExpense,
    byCategory,
    budgets: budgetStats,
    savingsGoals: savingsGoals.map((g) => ({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
    })),
  };
}

module.exports = { getUserStats, monthRange };
