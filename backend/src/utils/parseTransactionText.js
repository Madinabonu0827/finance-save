// Real LLM API kaliti berilmagani uchun (faqat MONGO/RENDER/BOT_TOKEN mavjud),
// ovozli/matnli kiritish so'z va raqamlarni tahlil qiluvchi qoida-asosli (rule-based) dvigatel bilan aniqlanadi.
// Format: "taksiga 20 ming sarfladim", "ovqatga 45000", "maosh 3 million tushdi",
// shuningdek Toshkent shevasidagi so'zlashuv shakllari: "besh ming ketvordi", "yarim lyam sarfladim".

const CATEGORY_KEYWORDS = {
  Ovqat: [
    'ovqat', 'taom', 'restoran', 'kafe', 'oshxona', 'market', 'oziq', 'nonushta', 'tushlik',
    'kechki ovqat', 'osh', 'palov', 'fastfud', 'fast food', 'burger', 'pitsa', 'pizza',
    'choyxona', 'supermarket', "do'kon", 'dokon', 'magazin', 'korzinka', 'oziq-ovqat',
    'sabzavot', 'meva', 'shashlik', 'lag\'mon', 'lagmon', 'somsa',
  ],
  Transport: [
    'taksi', 'taxi', 'transport', 'benzin', "yoqilg'i", 'yoqilgi', 'metro', 'avtobus',
    'marshrutka', 'yandex', 'uber', 'bolt', 'mashina', 'avtomobil', 'parkovka', 'shtraf',
    "moy almashtir", 'moy quyish',
  ],
  'Uy-joy': [
    'ijara', 'kvartira', 'kommunal', 'uy-joy', 'uy joy', 'svet', 'gaz', 'suv', 'elektr',
    'kommunalka', 'arenda', 'uy puli', 'internet', 'wifi',
  ],
  "Sog'liq": [
    'dori', 'shifokor', 'klinika', "sog'liq", 'sogliq', 'apteka', 'dorixona', 'stomatolog',
    'tish', 'vrach', 'doktor', 'tekshiruv', 'analiz', 'shifoxona',
  ],
  "Ko'ngilochar": [
    'kino', 'konsert', "o'yin", 'oyin', "ko'ngilochar", 'kongilochar', 'sayohat', 'bar',
    'disko', 'klub', 'bilyard', 'bowling', 'sport zali', 'gym', 'fitnes',
  ],
  Kiyim: ['kiyim', 'poyabzal', 'kiyim-kechak', 'krossovka', 'futbolka', 'shim', "ko'ylak", 'koylak', 'kurtka'],
  "Ta'lim": [
    "ta'lim", 'talim', 'kurs', 'kitob', "o'quv", 'oquv', 'repetitor', 'universitet',
    'maktab', "bog'cha", 'bogcha', 'litsey',
  ],
};

const INCOME_KEYWORDS = [
  'maosh', 'daromad', 'tushdi', 'oldim', 'ish haqi', 'bonus', "sovg'a", 'sovga', 'kirim',
  'pul tushdi', 'avans', 'foyda', 'sotdim', 'qarz qaytardi', 'stipendiya', 'grant',
];

// Toshkent shevasi/so'zlashuv tilidagi "xarajat qildim" ma'nosidagi fe'llar — parseType uchun
// ishlatilmaydi (default expense), lekin AI Maslahatchi va boshqa joylarda foydali bo'lishi mumkin.
const EXPENSE_VERBS = ['sarfladim', 'ketvordi', 'ketdi', "to'ladim", 'toladim', 'berdim', 'chiqdi', 'sotib oldim'];

// --- So'z bilan yozilgan/aytilgan sonlarni raqamga o'girish (ovozli kiritish uchun muhim) ---
const UNIT_WORDS = {
  bir: 1, ikki: 2, uch: 3, "to'rt": 4, tort: 4, besh: 5, olti: 6, yetti: 7, sakkiz: 8,
  "to'qqiz": 9, toqqiz: 9,
};
const TEN_WORDS = {
  "o'n": 10, on: 10, yigirma: 20, "o'ttiz": 30, ottiz: 30, qirq: 40, ellik: 50, oltmish: 60,
  yetmish: 70, sakson: 80, "to'qson": 90, toqson: 90,
};

// tokens ichidan startIdx'dan boshlab "besh yuz oltmish besh" kabi so'z-sonni o'qiydi.
function readNumberWords(tokens, startIdx) {
  let i = startIdx;
  let value = 0;
  const start = i;

  if (UNIT_WORDS[tokens[i]] !== undefined && tokens[i + 1] === 'yuz') {
    value += UNIT_WORDS[tokens[i]] * 100;
    i += 2;
  } else if (tokens[i] === 'yuz') {
    value += 100;
    i += 1;
  }
  if (TEN_WORDS[tokens[i]] !== undefined) {
    value += TEN_WORDS[tokens[i]];
    i += 1;
  }
  if (UNIT_WORDS[tokens[i]] !== undefined) {
    value += UNIT_WORDS[tokens[i]];
    i += 1;
  }

  return i > start ? { value, nextIdx: i } : null;
}

function parseAmount(text) {
  const lower = text.toLowerCase();

  // Raqamli shakllar (eng aniq): "20 ming", "3 million", "45000".
  const millionMatch = lower.match(/(\d+([.,]\d+)?)\s*mln\b|(\d+([.,]\d+)?)\s*million\b/);
  if (millionMatch) {
    const num = parseFloat((millionMatch[1] || millionMatch[3]).replace(',', '.'));
    return Math.round(num * 1_000_000);
  }
  // So'zlashuv slengi: "lyam"/"lyame" = million.
  const lyamMatch = lower.match(/(\d+([.,]\d+)?)\s*lyam(e|ni)?\b/);
  if (lyamMatch) {
    return Math.round(parseFloat(lyamMatch[1].replace(',', '.')) * 1_000_000);
  }
  const thousandMatch = lower.match(/(\d+([.,]\d+)?)\s*ming\b/);
  if (thousandMatch) {
    return Math.round(parseFloat(thousandMatch[1].replace(',', '.')) * 1_000);
  }
  // So'zlashuv slengi: "shtuka"/"kusok" = ming.
  const shtukaMatch = lower.match(/(\d+([.,]\d+)?)\s*(shtuka|kusok)\b/);
  if (shtukaMatch) {
    return Math.round(parseFloat(shtukaMatch[1].replace(',', '.')) * 1_000);
  }

  // So'z bilan yozilgan/aytilgan sonlar: "besh ming", "o'n besh ming", "ikki yarim million".
  // Standalone "yarim X" (ma'no: "0.5 X")dan OLDIN tekshiriladi, aks holda "ikki yarim ming"
  // ichidagi "yarim ming" qismi "ikki"ni hisobga olmay noto'g'ri ushlanib qolar edi.
  const tokens = lower.replace(/[.,!?]/g, '').split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const numWord = readNumberWords(tokens, i);
    if (!numWord) continue;

    let { value, nextIdx } = numWord;
    let isHalf = false;
    if (tokens[nextIdx] === 'yarim') {
      isHalf = true;
      nextIdx += 1;
    }

    const unitToken = tokens[nextIdx];
    let multiplier = null;
    if (unitToken === 'million' || unitToken === 'mln' || unitToken?.startsWith('lyam')) multiplier = 1_000_000;
    else if (unitToken === 'ming' || unitToken === 'shtuka' || unitToken === 'kusok') multiplier = 1_000;

    if (multiplier) {
      const finalValue = isHalf ? value + 0.5 : value;
      return Math.round(finalValue * multiplier);
    }
  }

  // Standalone "yarim million" = 500 000, "yarim ming" = 500, "yarim lyam" = 500 000
  // (oldida son so'zi yo'q holat — yuqoridagi tsikl bunday holatni ushlamaydi).
  const yarimUnitMatch = lower.match(/\byarim\s*(million|mln|lyam(e)?|ming|shtuka|kusok)\b/);
  if (yarimUnitMatch) {
    const unit = yarimUnitMatch[1];
    const base = unit.startsWith('mil') || unit.startsWith('lyam') ? 1_000_000 : 1_000;
    return Math.round(base / 2);
  }

  // Oddiy raqam (kamida 2 xonali) — "45000" kabi.
  const plainMatch = lower.match(/(\d{2,})/);
  if (plainMatch) {
    return parseInt(plainMatch[1], 10);
  }
  return null;
}

// Oddiy .includes() o'rniga so'z BOSHIDAN mos kelishini tekshiradi — aks holda "maosh" so'zi
// ichidagi "osh" kabi tasodifiy substring noto'g'ri kategoriyani ushlab qolar edi. O'zbek tilida
// qo'shimchalar so'zga bevosita ulanadi ("taksi" + "ga" = "taksiga"), shuning uchun faqat CHAP
// tarafdan chegara talab qilinadi — o'ng tarafda qo'shimcha kelishi normal holat.
function hasWord(lower, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-zA-Z'ʻ])${escaped}`, 'i').test(lower);
}

function parseType(text) {
  const lower = text.toLowerCase();
  return INCOME_KEYWORDS.some((kw) => hasWord(lower, kw)) ? 'income' : 'expense';
}

function parseCategoryName(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => hasWord(lower, kw))) return category;
  }
  return null; // topilmasa — chaqiruvchi default kategoriya tanlaydi
}

function parseTransactionText(text) {
  const amount = parseAmount(text);
  const type = parseType(text);
  const categoryName = parseCategoryName(text);
  return { amount, type, categoryName, raw: text, confident: amount !== null };
}

module.exports = { parseTransactionText, EXPENSE_VERBS };
