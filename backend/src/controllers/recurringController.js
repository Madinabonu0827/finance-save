const RecurringPayment = require('../models/RecurringPayment');
const Category = require('../models/Category');

async function list(req, res) {
  try {
    const payments = await RecurringPayment.find({ user: req.userId }).populate('category').sort({ dayOfMonth: 1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function create(req, res) {
  try {
    const { name, amount, categoryId, dayOfMonth } = req.body;
    if (!name || !amount || amount <= 0 || !categoryId || !dayOfMonth) {
      return res.status(400).json({ message: 'name, amount, categoryId, dayOfMonth majburiy' });
    }
    if (dayOfMonth < 1 || dayOfMonth > 28) {
      return res.status(400).json({ message: 'dayOfMonth 1-28 oralig\'ida bo\'lishi kerak' });
    }
    const category = await Category.findById(categoryId);
    if (!category) return res.status(400).json({ message: 'Kategoriya topilmadi' });

    const payment = await RecurringPayment.create({ user: req.userId, name, amount, category: categoryId, dayOfMonth });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function remove(req, res) {
  try {
    const payment = await RecurringPayment.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!payment) return res.status(404).json({ message: 'Topilmadi' });
    res.json({ message: 'O\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { list, create, remove };
