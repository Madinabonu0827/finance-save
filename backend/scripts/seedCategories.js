require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Ovqat', emoji: '🍔', type: 'expense' },
  { name: 'Transport', emoji: '🚗', type: 'expense' },
  { name: 'Uy-joy', emoji: '🏠', type: 'expense' },
  { name: "Sog'liq", emoji: '💊', type: 'expense' },
  { name: "Ko'ngilochar", emoji: '🎮', type: 'expense' },
  { name: 'Kiyim', emoji: '👕', type: 'expense' },
  { name: "Ta'lim", emoji: '📚', type: 'expense' },
  { name: 'Boshqa', emoji: '📦', type: 'expense' },
  { name: 'Maosh', emoji: '💵', type: 'income' },
];

async function seedCategories() {
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate(
      { name: cat.name, isDefault: true },
      { ...cat, isDefault: true, user: null },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }
  console.log(`✅ ${DEFAULT_CATEGORIES.length} ta standart kategoriya seed qilindi`);
}

// To'g'ridan-to'g'ri ishga tushirilsa (`node scripts/seedCategories.js`) o'zi ulanadi va yakunlaydi.
if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(seedCategories)
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error('❌ Xato:', err.message);
      process.exit(1);
    });
}

module.exports = { seedCategories, DEFAULT_CATEGORIES };
