// Real LLM API kaliti taqdim etilmagani uchun (env'da faqat MONGO_URI/BOT_TOKEN/RENDER_TOKEN bor),
// AI Maslahatchi foydalanuvchining REAL ma'lumotlari (tranzaksiya/byudjet/jamg'arma) ustida
// qoida-asosli tahlil dvigateli sifatida ishlaydi. Fake/hardcoded raqam ishlatilmaydi — CLAUDE.md §6 talabiga mos.

const RISKY_KEYWORDS = ['kredit', 'qarz', 'investitsiya', 'aksiya', 'birja', 'kripto', 'soliq', 'foiz stavka'];

const DISCLAIMER =
  "Men moliyaviy maslahatchi o'rnini bosa olmayman. Muhim qarorlar uchun mutaxassisga murojaat qiling.";

function isRiskyQuestion(text) {
  const lower = text.toLowerCase();
  return RISKY_KEYWORDS.some((kw) => lower.includes(kw));
}

// stats: { totalIncome, totalExpense, balance, byCategory: [{name, amount}], budgets: [{category, limit, spent}], savingsGoals: [{name, targetAmount, currentAmount}] }
function buildAdvice(message, stats) {
  if (isRiskyQuestion(message)) {
    return `${DISCLAIMER}\n\nSizning joriy balansingiz: ${stats.balance.toLocaleString('uz-UZ')} so'm. Umumiy kuzatuv sifatida: xarajatlaringizni nazorat qilib, jamg'arma maqsadlaringizga ustuvorlik bering.`;
  }

  const lower = message.toLowerCase();

  if (lower.includes('tahlil') || lower.includes('xarajat')) {
    if (!stats.byCategory.length) {
      return "Hozircha tranzaksiyalar mavjud emas — tahlil qilish uchun avval xarajat/daromad kiriting.";
    }
    const top = [...stats.byCategory].sort((a, b) => b.amount - a.amount)[0];
    return `📊 Joriy oyda jami xarajat: ${stats.totalExpense.toLocaleString('uz-UZ')} so'm, daromad: ${stats.totalIncome.toLocaleString('uz-UZ')} so'm.\nEng ko'p sarflagan kategoriyangiz: ${top.name} (${top.amount.toLocaleString('uz-UZ')} so'm). Shu kategoriyaga byudjet limiti qo'yishni tavsiya qilaman.`;
  }

  if (lower.includes('tejash') || lower.includes('save') || lower.includes('maslahat')) {
    const savingsRate = stats.totalIncome > 0 ? Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100) : 0;
    return `💡 Joriy oyda daromadingizning ${savingsRate}%ini tejayapsiz.\nTavsiya: har oy daromadning kamida 20%ini jamg'armaga ajrating. Eng katta xarajat kategoriyangizni kuzatib, undagi ortiqcha sarfni qisqartirishga harakat qiling.`;
  }

  if (lower.includes('byudjet')) {
    if (!stats.budgets.length) {
      return "Hozircha byudjet limitlari o'rnatilmagan. Byudjet bo'limidan kategoriya uchun oylik limit belgilang — men sizga sarfingizni kuzatib boraman.";
    }
    const overLimit = stats.budgets.filter((b) => b.spent >= b.limit);
    const near = stats.budgets.filter((b) => b.spent < b.limit && b.spent / b.limit >= 0.8);
    let msg = '📋 Byudjet holati:\n';
    stats.budgets.forEach((b) => {
      const pct = Math.round((b.spent / b.limit) * 100);
      msg += `• ${b.category}: ${b.spent.toLocaleString('uz-UZ')} / ${b.limit.toLocaleString('uz-UZ')} so'm (${pct}%)\n`;
    });
    if (overLimit.length) msg += `\n⚠️ ${overLimit.map((b) => b.category).join(', ')} limitdan oshib ketgan!`;
    else if (near.length) msg += `\n⚠️ ${near.map((b) => b.category).join(', ')} limitga yaqinlashmoqda.`;
    else msg += '\n✅ Barcha kategoriyalar limit doirasida.';
    return msg;
  }

  if (lower.includes('jamg')) {
    if (!stats.savingsGoals.length) {
      return "Hozircha jamg'arma maqsadingiz yo'q. Yangi maqsad yarating — men progressni kuzatib boraman.";
    }
    let msg = "🎯 Jamg'arma maqsadlaringiz:\n";
    stats.savingsGoals.forEach((g) => {
      const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
      msg += `• ${g.name}: ${pct}% (${g.currentAmount.toLocaleString('uz-UZ')} / ${g.targetAmount.toLocaleString('uz-UZ')} so'm)\n`;
    });
    return msg;
  }

  return `Salom! Men sizning real moliyaviy ma'lumotlaringiz asosida yordam beraman. Joriy balansingiz: ${stats.balance.toLocaleString('uz-UZ')} so'm. "Xarajatlarimni tahlil qil", "Pul tejash bo'yicha maslahat" yoki "Byudjetim ahvoli qanday?" deb so'rashingiz mumkin.`;
}

module.exports = { buildAdvice, DISCLAIMER, isRiskyQuestion };
