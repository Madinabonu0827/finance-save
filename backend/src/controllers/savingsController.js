const SavingsGoal = require('../models/SavingsGoal');
const { notifyUser } = require('../utils/notify');
const { formatMoney } = require('../utils/format');

async function list(req, res) {
  try {
    const goals = await SavingsGoal.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function create(req, res) {
  try {
    const { name, targetAmount, deadline } = req.body;
    if (!name || !targetAmount || targetAmount <= 0) {
      return res.status(400).json({ message: 'Nom va maqsad summa (musbat son) majburiy' });
    }
    const goal = await SavingsGoal.create({
      user: req.userId,
      name,
      targetAmount,
      deadline: deadline || null,
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function addAmount(req, res) {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'amount musbat son bo\'lishi kerak' });

    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.userId });
    if (!goal) return res.status(404).json({ message: 'Jamg\'arma maqsadi topilmadi' });

    goal.currentAmount += amount;
    if (goal.currentAmount >= goal.targetAmount) {
      goal.currentAmount = goal.targetAmount;
      goal.completed = true;
    }
    await goal.save();

    if (goal.completed && !goal.completedNotified) {
      goal.completedNotified = true;
      await goal.save();
      await notifyUser(req.userId, {
        type: 'savings_goal_reached',
        title: `🎉 Tabriklaymiz! "${goal.name}" maqsadiga yetdingiz`,
        message: `Siz ${formatMoney(goal.targetAmount)} so'mlik jamg'arma maqsadingizga to'liq yetdingiz!`,
      });
    }

    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { list, create, addAmount };
