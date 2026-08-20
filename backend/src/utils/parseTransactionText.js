// Real LLM API kaliti berilmagani uchun (faqat MONGO/RENDER/BOT_TOKEN mavjud),
// ovozli/matnli kiritish so'z va raqamlarni tahlil qiluvchi qoida-asosli (rule-based) dvigatel bilan aniqlanadi.
// Format: "taksiga 20 ming sarfladim", "ovqatga 45000", "maosh 3 million tushdi"

const CATEGORY_KEYWORDS = {
  Ovqat: ['ovqat', 'taom', 'restoran', 'kafe', 'oshxona', 'market', 'oziq'],
  Transport: ['taksi', 'transport', 'benzin', 'yoqilg\'i', 'metro', 'avtobus', 'yandex'],
  'Uy-joy': ['ijara', 'kvartira', 'kommunal', 'uy-joy', 'svet', 'gaz', 'suv'],
  "Sog'liq": ['dori', 'shifokor', 'klinika', "sog'liq", 'apteka'],
  "Ko'ngilochar": ['kino', 'konsert', "o'yin", "ko'ngilochar", 'sayohat'],
  Kiyim: ['kiyim', 'poyabzal', 'kiyim-kechak'],
  "Ta'lim": ["ta'lim", 'kurs', 'kitob', "o'quv"],
};

const INCOME_KEYWORDS = ['maosh', 'daromad', 'tushdi', 'oldim', 'ish haqi', 'bonus', 'sovg\'a'];

function parseAmount(text) {
  const lower = text.toLowerCase();
  // "20 ming", "3 million", "45000", "45 ming so'm"
  const millionMatch = lower.match(/(\d+([.,]\d+)?)\s*mln|(\d+([.,]\d+)?)\s*million/);
  if (millionMatch) {
    const num = parseFloat((millionMatch[1] || millionMatch[3]).replace(',', '.'));
    return Math.round(num * 1_000_000);
  }
  const thousandMatch = lower.match(/(\d+([.,]\d+)?)\s*ming/);
  if (thousandMatch) {
    const num = parseFloat(thousandMatch[1].replace(',', '.'));
    return Math.round(num * 1_000);
  }
  const plainMatch = lower.match(/(\d{2,})/);
  if (plainMatch) {
    return parseInt(plainMatch[1], 10);
  }
  return null;
}

function parseType(text) {
  const lower = text.toLowerCase();
  return INCOME_KEYWORDS.some((kw) => lower.includes(kw)) ? 'income' : 'expense';
}

function parseCategoryName(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null; // topilmasa — chaqiruvchi default kategoriya tanlaydi
}

function parseTransactionText(text) {
  const amount = parseAmount(text);
  const type = parseType(text);
  const categoryName = parseCategoryName(text);
  return { amount, type, categoryName, raw: text, confident: amount !== null };
}

module.exports = { parseTransactionText };
