const Debt = require('../models/Debt');

async function list(req, res) {
  try {
    const { type, status } = req.query;
    const query = { user: req.userId };
    if (type === 'borrowed' || type === 'lent') query.type = type;
    if (status === 'pending' || status === 'paid') query.status = status;

    const debts = await Debt.find(query).sort({ status: 1, dueDate: 1, createdAt: -1 });
    res.json(debts);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function create(req, res) {
  try {
    const { type, personName, amount, date, dueDate, note } = req.body;
    if (!type || !['borrowed', 'lent'].includes(type)) {
      return res.status(400).json({ message: 'type "borrowed" yoki "lent" bo\'lishi kerak' });
    }
    if (!personName || !personName.trim()) {
      return res.status(400).json({ message: 'Ism/tashkilot nomi majburiy' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'amount musbat son bo\'lishi kerak' });
    }

    const debt = await Debt.create({
      user: req.userId,
      type,
      personName: personName.trim(),
      amount,
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      note: note || '',
    });
    res.status(201).json(debt);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function update(req, res) {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.userId });
    if (!debt) return res.status(404).json({ message: 'Topilmadi' });

    const { personName, amount, date, dueDate, note } = req.body;
    if (personName !== undefined) debt.personName = personName.trim();
    if (amount !== undefined) {
      if (!amount || amount <= 0) return res.status(400).json({ message: 'amount musbat son bo\'lishi kerak' });
      debt.amount = amount;
    }
    if (date !== undefined) debt.date = new Date(date);
    if (dueDate !== undefined) debt.dueDate = dueDate ? new Date(dueDate) : null;
    if (note !== undefined) debt.note = note;

    await debt.save();
    res.json(debt);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

// Qarz qaytarildi/qaytarib olindi deb belgilash.
async function markPaid(req, res) {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, user: req.userId });
    if (!debt) return res.status(404).json({ message: 'Topilmadi' });

    debt.status = 'paid';
    debt.paidAt = new Date();
    await debt.save();
    res.json(debt);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

async function remove(req, res) {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!debt) return res.status(404).json({ message: 'Topilmadi' });
    res.json({ message: 'O\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { list, create, update, markPaid, remove };
