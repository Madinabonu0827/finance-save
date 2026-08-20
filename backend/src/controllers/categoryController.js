const Category = require('../models/Category');

async function list(req, res) {
  try {
    const categories = await Category.find({
      $or: [{ isDefault: true }, { user: req.userId }],
    }).sort({ isDefault: -1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi', error: err.message });
  }
}

module.exports = { list };
