const { getUserStats } = require('../utils/stats');

async function summary(req, res) {
  try {
    const stats = await getUserStats(req.userId);
    res.json({ balance: stats.balance, income: stats.totalIncome, expense: stats.totalExpense });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { summary };
