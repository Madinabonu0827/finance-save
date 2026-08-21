// Finance AI — Telegram bot
// Alohida DB ishlatmaydi, hamma narsa backend REST API orqali (./api.js) amalga oshadi.

require("dotenv").config();
const http = require("http");
const { Telegraf, Markup } = require("telegraf");
const api = require("./api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || "https://financesave-web.vercel.app";

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN topilmadi. .env faylida BOT_TOKEN ni sozlang.");
  process.exit(1);
}

// Render'ning bepul tarifida faqat Web Service (portga ulanadigan) xizmatlar ruxsat etiladi —
// Background Worker yo'q. Bot uzoq so'rovlar (long polling) bilan ishlaydi, lekin Render uni
// "tirik" deb bilishi uchun shu oddiy health-check server $PORT'ga ulanadi.
const PORT = process.env.PORT || 3001;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Finance AI bot ishlamoqda");
  })
  .listen(PORT, () => console.log(`🌐 Health-check server ${PORT} portida`));

const bot = new Telegraf(BOT_TOKEN);

// Foydalanuvchi holati (keyingi matnni nima deb kutyapmiz) — oddiy in-memory Map, DB shart emas.
// state: "awaiting_expense" | "awaiting_income" | "awaiting_ai_question"
const userState = new Map();

// --- Tugma nomlari (bir joyda, hears bilan mos kelishi uchun) ---
const BTN_BALANCE = "💰 Balans";
const BTN_ADD_EXPENSE = "➕ Xarajat qo'shish";
const BTN_ADD_INCOME = "➕ Daromad qo'shish";
const BTN_BUDGET = "📊 Byudjet";
const BTN_SAVINGS = "🎯 Jamg'armalar";
const BTN_DEBTS = "💳 Qarzlar";
const BTN_AI = "🤖 AI Maslahatchi";
const BTN_WEB_APP = "🌐 Web ilova";

const mainMenu = Markup.keyboard([
  [BTN_BALANCE, BTN_BUDGET],
  [BTN_SAVINGS, BTN_DEBTS],
  [BTN_ADD_EXPENSE, BTN_ADD_INCOME],
  [BTN_AI, Markup.button.webApp(BTN_WEB_APP, WEB_APP_URL)],
]).resize();

// --- Yordamchi funksiyalar ---

function formatSum(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("ru-RU")} so'm`;
}

function progressBar(percent) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = Math.round(p / 20);
  return "█".repeat(filled) + "░".repeat(5 - filled) + ` ${p}%`;
}

async function handleApiError(ctx, err) {
  const status = err.response?.status;
  if (status === 401 || status === 404) {
    await ctx.reply(
      "🔒 Avval hisobingizni ulang: Web ilovada \"Telegramni ulash\" tugmasini bosing."
    );
    return;
  }
  console.error("API xatolik:", err.message);
  await ctx.reply("❌ Xatolik yuz berdi, birozdan so'ng qayta urinib ko'ring.");
}

// --- /start ---

function welcomeText(firstName, extraNote) {
  return (
    `Salom, ${firstName}!\n\n` +
    `🤖 AI Finance Bot — shaxsiy moliyaviy maslahatchingizga xush kelibsiz.\n\n` +
    `Bizning imkoniyatlarimiz:\n` +
    `✅ Daromad va xarajatlarni oson kiritish\n` +
    `✅ Oylik limitlar (byudjetlar) o'rnatish\n` +
    `✅ Moliyaviy statistika va grafiklar\n` +
    `✅ Sun'iy intellektdan shaxsiy maslahatlar\n\n` +
    `📱 Qulay Telegram Mini App interfeysi\n\n` +
    `Mini App'ga kirish uchun quyidagi tugmani bosing:` +
    (extraNote ? `\n\n${extraNote}` : "")
  );
}

bot.start(async (ctx) => {
  const chatId = String(ctx.chat.id);
  const code = ctx.startPayload && ctx.startPayload.trim();
  const telegramUsername = ctx.from.username || ctx.from.first_name || "";
  const firstName = ctx.from.first_name || "do'st";

  if (code) {
    try {
      const res = await api.linkTelegram({ code, chatId, telegramUsername });
      const name = res.data?.name || firstName;
      await ctx.reply(
        `Salom, ${name}!\n\n✅ Hisobingiz muvaffaqiyatli ulandi!`,
        Object.assign({}, mainMenu, {
          reply_markup: Object.assign({}, mainMenu.reply_markup, {
            inline_keyboard: [[Markup.button.webApp("🚀 Mini Appni ochish", WEB_APP_URL)]],
          }),
        })
      );
    } catch (err) {
      await handleApiError(ctx, err);
    }
    return;
  }

  let extraNote = "";
  try {
    await api.getMe(chatId);
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 404) {
      extraNote =
        '🔗 Hisobingizni ulash uchun Web ilovada "Telegramni ulash" tugmasini bosib, olingan kodni yuboring:\n/start <kod>';
    }
  }

  await ctx.reply(
    welcomeText(firstName, extraNote),
    Object.assign({}, mainMenu, {
      reply_markup: Object.assign({}, mainMenu.reply_markup, {
        inline_keyboard: [[Markup.button.webApp("🚀 Mini Appni ochish", WEB_APP_URL)]],
      }),
    })
  );
});

// --- 💰 Balans ---

bot.hears(BTN_BALANCE, async (ctx) => {
  const chatId = String(ctx.chat.id);
  try {
    const res = await api.getSummary(chatId);
    const { balance, income, expense } = res.data || {};
    const text =
      `💰 Balans: ${formatSum(balance)}\n` +
      `📈 Daromad: ${formatSum(income)}\n` +
      `📉 Xarajat: ${formatSum(expense)}`;
    await ctx.reply(text);
  } catch (err) {
    await handleApiError(ctx, err);
  }
});

// --- ➕ Xarajat / Daromad qo'shish ---

bot.hears(BTN_ADD_EXPENSE, async (ctx) => {
  const chatId = String(ctx.chat.id);
  userState.set(chatId, "awaiting_expense");
  await ctx.reply('✍️ Xarajatni yozing, masalan: "ovqatga 45 ming"');
});

bot.hears(BTN_ADD_INCOME, async (ctx) => {
  const chatId = String(ctx.chat.id);
  userState.set(chatId, "awaiting_income");
  await ctx.reply('✍️ Daromadni yozing, masalan: "maosh 3 million"');
});

// --- 📊 Byudjet ---

bot.hears(BTN_BUDGET, async (ctx) => {
  const chatId = String(ctx.chat.id);
  try {
    const res = await api.getBudget(chatId);
    const categories = res.data?.categories || [];
    if (categories.length === 0) {
      await ctx.reply("📊 Hozircha byudjet limiti belgilanmagan.");
      return;
    }
    const lines = categories.map((c) => {
      const percent = c.limit > 0 ? (c.spent / c.limit) * 100 : 0;
      return `${c.name}\n${progressBar(percent)}\n${formatSum(c.spent)} / ${formatSum(c.limit)}`;
    });
    await ctx.reply(`📊 Byudjet holati:\n\n${lines.join("\n\n")}`);
  } catch (err) {
    await handleApiError(ctx, err);
  }
});

// --- 🎯 Jamg'armalar ---

bot.hears(BTN_SAVINGS, async (ctx) => {
  const chatId = String(ctx.chat.id);
  try {
    const res = await api.getSavings(chatId);
    const goals = res.data?.goals || [];
    if (goals.length === 0) {
      await ctx.reply("🎯 Hozircha jamg'arma maqsadi yo'q.");
      return;
    }
    const lines = goals.map((g) => {
      const percent = g.target > 0 ? (g.current / g.target) * 100 : 0;
      return `🎯 ${g.name}\n${progressBar(percent)}\n${formatSum(g.current)} / ${formatSum(g.target)}`;
    });
    await ctx.reply(lines.join("\n\n"));
  } catch (err) {
    await handleApiError(ctx, err);
  }
});

// --- 💳 Qarzlar ---

bot.hears(BTN_DEBTS, async (ctx) => {
  const chatId = String(ctx.chat.id);
  try {
    const res = await api.getDebts(chatId);
    const { iOwe, owedToMe, items } = res.data || {};
    if (!items || items.length === 0) {
      await ctx.reply("💳 Hozircha qarz yozuvi yo'q.");
      return;
    }
    let text = `💳 Sizning qarzingiz: ${formatSum(iOwe)}\n💳 Sizga qaytarilishi kerak: ${formatSum(owedToMe)}\n\n`;
    text += items
      .map((d) => {
        const arrow = d.type === "borrowed" ? "➖" : "➕";
        const due = d.dueDate ? ` (muddat: ${new Date(d.dueDate).toLocaleDateString("uz-UZ")})` : "";
        return `${arrow} ${d.personName} — ${formatSum(d.amount)}${due}`;
      })
      .join("\n");
    await ctx.reply(text);
  } catch (err) {
    await handleApiError(ctx, err);
  }
});

// --- 🤖 AI Maslahatchi ---

bot.hears(BTN_AI, async (ctx) => {
  const chatId = String(ctx.chat.id);
  userState.set(chatId, "awaiting_ai_question");
  await ctx.reply("🤖 Savolingizni erkin matn ko'rinishida yozing.");
});

// --- Erkin matn (holatga qarab: xarajat/daromad yoki AI savol) ---

bot.on("text", async (ctx) => {
  const chatId = String(ctx.chat.id);
  const state = userState.get(chatId);
  const text = ctx.message.text;

  if (!state) return; // Kutilayotgan holat yo'q — tugmalar yuqorida hears bilan ushlanadi.

  if (state === "awaiting_expense" || state === "awaiting_income") {
    userState.delete(chatId);
    const type = state === "awaiting_expense" ? "expense" : "income";
    try {
      const res = await api.parseVoiceTransaction({ chatId, text, type });
      const { amount, category, description } = res.data || {};
      const emoji = type === "expense" ? "📉" : "📈";
      const label = category || description || "";
      await ctx.reply(`${emoji} Qo'shildi: ${formatSum(amount)}${label ? " — " + label : ""}`);
    } catch (err) {
      await handleApiError(ctx, err);
    }
    return;
  }

  if (state === "awaiting_ai_question") {
    userState.delete(chatId);
    try {
      const res = await api.aiChat({ chatId, message: text });
      const reply = res.data?.reply || "Javob topilmadi.";
      await ctx.reply(`🤖 ${reply}`);
    } catch (err) {
      await handleApiError(ctx, err);
    }
    return;
  }
});

// --- Ishga tushirish ---

bot.launch();

// Telegram chap pastki (☰) menyu tugmasini Mini App'ga bog'lash —
// botni ochgan har foydalanuvchi bitta bosishda web ilovani ko'radi.
bot.telegram
  .setChatMenuButton({ menu_button: { type: "web_app", text: "🌐 Web ilova", web_app: { url: WEB_APP_URL } } })
  .then(() => console.log(`🌐 Mini App menyu tugmasi o'rnatildi: ${WEB_APP_URL}`))
  .catch((e) => console.error("Mini App menyu tugmasini o'rnatishda xatolik:", e.message));

console.log("🤖 Finance AI bot ishga tushdi...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
