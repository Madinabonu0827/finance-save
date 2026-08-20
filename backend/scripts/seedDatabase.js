require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Transaction = require('../src/models/Transaction');
const Budget = require('../src/models/Budget');
const SavingsGoal = require('../src/models/SavingsGoal');
const RecurringPayment = require('../src/models/RecurringPayment');
const Debt = require('../src/models/Debt');
const { seedCategories } = require('./seedCategories');
const { currentMonthKey } = require('../src/utils/format');

const DEMO_EMAIL = 'demo@financeai.uz';
const DEMO_PASSWORD = 'demo123456';

function randomDayInLast30() {
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function seedDatabase() {
  await seedCategories();

  const categories = await Category.find({ isDefault: true });
  const byName = Object.fromEntries(categories.map((c) => [c.name, c]));

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
    user = await User.create({ name: 'Demo Foydalanuvchi', email: DEMO_EMAIL, password: hashed });
    console.log(`✅ Demo user yaratildi: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } else {
    console.log(`ℹ️ Demo user allaqachon mavjud: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }

  // Tozalab qaytadan seed qilamiz (demo takrorlanib ishlatilishi mumkin).
  await Promise.all([
    Transaction.deleteMany({ user: user._id }),
    Budget.deleteMany({ user: user._id }),
    SavingsGoal.deleteMany({ user: user._id }),
    RecurringPayment.deleteMany({ user: user._id }),
    Debt.deleteMany({ user: user._id }),
  ]);

  // --- 20+ tranzaksiya (oxirgi 30 kun) ---
  const expenseCategories = ['Ovqat', 'Transport', 'Uy-joy', "Sog'liq", "Ko'ngilochar", 'Kiyim', "Ta'lim"];
  const transactions = [];

  for (let i = 0; i < 22; i++) {
    const catName = expenseCategories[i % expenseCategories.length];
    transactions.push({
      user: user._id,
      type: 'expense',
      amount: Math.floor(Math.random() * 400_000) + 20_000,
      category: byName[catName]._id,
      note: `${catName} uchun xarajat`,
      source: 'web',
      date: randomDayInLast30(),
    });
  }

  // Ovqat kategoriyasini 80%+ holatiga olib kelish uchun qo'shimcha maqsadli xarajatlar —
  // sana ataylab JORIY OYga (bugun/kecha) belgilanadi, chunki byudjet foizi faqat joriy oy
  // doirasida hisoblanadi va tasodifiy 30-kunlik sana oldingi oyga tushib qolishi mumkin.
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  transactions.push(
    { user: user._id, type: 'expense', amount: 350_000, category: byName['Ovqat']._id, note: 'Katta xarid', source: 'web', date: today },
    { user: user._id, type: 'expense', amount: 300_000, category: byName['Ovqat']._id, note: 'Restoran', source: 'web', date: yesterday }
  );

  transactions.push(
    { user: user._id, type: 'income', amount: 8_000_000, category: byName['Maosh']._id, note: 'Oylik maosh', source: 'web', date: randomDayInLast30() },
    { user: user._id, type: 'income', amount: 500_000, category: byName['Maosh']._id, note: "Qo'shimcha daromad", source: 'web', date: randomDayInLast30() }
  );

  await Transaction.insertMany(transactions);
  console.log(`✅ ${transactions.length} ta tranzaksiya seed qilindi`);

  // --- Byudjet limitlari (biri 80%+ holatda) ---
  // MUHIM: backend byudjet sarfini faqat JORIY OY doirasida hisoblaydi (monthRange), 30 kunlik
  // tasodifiy sanalar esa oldingi oyga ham tushishi mumkin — shuning uchun foiz shu oyga tushgan
  // tranzaksiyalar asosida hisoblanadi, aks holda 80% chegarasi demo vaqtida ishonchli chiqmaydi.
  const monthKey = currentMonthKey();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const ovqatSpent = transactions
    .filter((t) => t.type === 'expense' && String(t.category) === String(byName['Ovqat']._id) && t.date >= monthStart)
    .reduce((s, t) => s + t.amount, 0);

  await Budget.insertMany([
    { user: user._id, category: byName['Ovqat']._id, limit: Math.round(ovqatSpent / 0.85), month: monthKey }, // ~85% — demo uchun
    { user: user._id, category: byName['Transport']._id, limit: 1_000_000, month: monthKey },
    { user: user._id, category: byName['Kiyim']._id, limit: 500_000, month: monthKey },
  ]);
  console.log('✅ 3 ta byudjet limiti seed qilindi (Ovqat ~85% holatda)');

  // --- Jamg'arma maqsadlari ---
  await SavingsGoal.insertMany([
    { user: user._id, name: "Yangi noutbuk", targetAmount: 12_000_000, currentAmount: 4_500_000, deadline: new Date(Date.now() + 60 * 86400000) },
    { user: user._id, name: "Sayohat jamg'armasi", targetAmount: 5_000_000, currentAmount: 5_000_000, completed: true, completedNotified: true },
  ]);
  console.log("✅ 2 ta jamg'arma maqsadi seed qilindi (biri to'liq, biri qisman)");

  // --- Takrorlanuvchi to'lov (yaqin sanada) ---
  const nearDay = new Date().getDate() < 28 ? new Date().getDate() + 1 : 1;
  await RecurringPayment.create({
    user: user._id,
    name: 'Uy ijarasi',
    amount: 2_500_000,
    category: byName['Uy-joy']._id,
    dayOfMonth: nearDay,
  });
  console.log(`✅ Takrorlanuvchi to'lov seed qilindi (har oyning ${nearDay}-kuni)`);

  // --- Qarzlar (biri yaqin muddatli "men oldim", biri uzoqroq "men berdim") ---
  await Debt.insertMany([
    {
      user: user._id,
      type: 'borrowed',
      personName: 'Aziz',
      amount: 800_000,
      date: new Date(Date.now() - 5 * 86400000),
      dueDate: new Date(Date.now() + 2 * 86400000), // 2 kundan keyin — tez orada eslatma
      note: "Shoshilinch qarz",
    },
    {
      user: user._id,
      type: 'lent',
      personName: 'Malika',
      amount: 350_000,
      date: new Date(Date.now() - 15 * 86400000),
      dueDate: new Date(Date.now() + 20 * 86400000),
      note: "Kitob puli",
    },
  ]);
  console.log("✅ 2 ta qarz yozuvi seed qilindi (biri qaytarish muddati yaqinlashgan)");

  console.log('\n🎉 Seed tugadi. Demo login: ' + DEMO_EMAIL + ' / ' + DEMO_PASSWORD);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(seedDatabase)
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error('❌ Seed xatosi:', err.message);
    process.exit(1);
  });
