const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { parseTransactionText } = require('../utils/parseTransactionText');
const { checkBudgetThresholds } = require('./budgetController');

async function list(req, res) {
  try {
    const { type, limit } = req.query;
    const query = { user: req.userId };
    if (type === 'expense' || type === 'income') query.type = type;

    let q = Transaction.find(query).populate('category').sort({ date: -1 });
    if (limit) q = q.limit(Number(limit));
    const transactions = await q;
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function create(req, res) {
  try {
    const { type, amount, categoryId, note, date, source } = req.body;
    if (!type || !['expense', 'income'].includes(type)) {
      return res.status(400).json({ message: 'type "expense" yoki "income" bo\'lishi kerak' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'amount musbat son bo\'lishi kerak' });
    }
    if (!categoryId) return res.status(400).json({ message: 'categoryId majburiy' });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(400).json({ message: 'Kategoriya topilmadi' });

    const transaction = await Transaction.create({
      user: req.userId,
      type,
      amount,
      category: categoryId,
      note: note || '',
      date: date ? new Date(date) : new Date(),
      source: source || 'web',
    });

    if (type === 'expense') {
      await checkBudgetThresholds(req.userId, categoryId, transaction.date);
    }

    const populated = await transaction.populate('category');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function remove(req, res) {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!transaction) return res.status(404).json({ message: 'Tranzaksiya topilmadi' });
    res.json({ message: 'O\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

// Telegram bot orqali erkin matndan tranzaksiya yaratish ("ovqatga 45 ming").
// req.userId `resolveUser` middleware orqali chatId asosida aniqlangan bo'ladi.
async function voiceParse(req, res) {
  try {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ message: 'text majburiy' });

    const parsed = parseTransactionText(text);
    if (!parsed.amount) {
      return res.status(400).json({ message: 'Summani aniqlab bo\'lmadi. Masalan: "ovqatga 45 ming" deb yozing.' });
    }

    const finalType = type === 'income' || type === 'expense' ? type : parsed.type;

    let category = null;
    if (parsed.categoryName) {
      category = await Category.findOne({ name: parsed.categoryName, isDefault: true });
    }
    if (!category) {
      category = await Category.findOne({ name: 'Boshqa', isDefault: true });
    }

    const transaction = await Transaction.create({
      user: req.userId,
      type: finalType,
      amount: parsed.amount,
      category: category._id,
      note: text,
      source: 'voice',
    });

    if (finalType === 'expense') {
      await checkBudgetThresholds(req.userId, category._id, transaction.date);
    }

    res.status(201).json({
      amount: parsed.amount,
      category: `${category.emoji} ${category.name}`,
      type: finalType,
      description: text,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { list, create, remove, voiceParse };
