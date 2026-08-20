// Backend REST API bilan ishlaydigan yagona joy.
// Bot hech qanday DB ishlatmaydi — hamma narsa shu axios instance orqali backendga boradi.

const axios = require("axios");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

/**
 * Telegram chatni web hisobga ulash.
 * POST /telegram/link
 * body: { code, chatId, telegramUsername }
 * response (kutilayotgan): { name, balance }
 */
function linkTelegram({ code, chatId, telegramUsername }) {
  return api.post("/telegram/link", { code, chatId, telegramUsername });
}

/**
 * Chat allaqachon ulanganmi, ulangan bo'lsa user ma'lumotini olish.
 * GET /telegram/me/:chatId
 * response (kutilayotgan): { name, balance, ... }
 */
function getMe(chatId) {
  return api.get(`/telegram/me/${chatId}`);
}

/**
 * Balans/daromad/xarajat xulosasi.
 * GET /telegram/summary/:chatId
 * response (kutilayotgan): { balance, income, expense, currency? }
 */
function getSummary(chatId) {
  return api.get(`/telegram/summary/${chatId}`);
}

/**
 * Byudjet holati (kategoriya bo'yicha limit/sarf).
 * GET /telegram/budget/:chatId
 * response (kutilayotgan): { categories: [{ name, limit, spent }] }
 */
function getBudget(chatId) {
  return api.get(`/telegram/budget/${chatId}`);
}

/**
 * Jamg'arma maqsadlari.
 * GET /telegram/savings/:chatId
 * response (kutilayotgan): { goals: [{ name, target, current }] }
 */
function getSavings(chatId) {
  return api.get(`/telegram/savings/${chatId}`);
}

/**
 * Qarzlar ro'yxati (kim qarzdor, kimga qarzdorsiz).
 * GET /telegram/debts/:chatId
 * response (kutilayotgan): { iOwe, owedToMe, items: [{ type, personName, amount, dueDate }] }
 */
function getDebts(chatId) {
  return api.get(`/telegram/debts/${chatId}`);
}

/**
 * Erkin matndan (masalan "ovqatga 45 ming") tranzaksiya yaratish.
 * Backend AI/regex bilan summa+kategoriyani aniqlaydi.
 * POST /transactions/voice-parse
 * body: { chatId, text, type } — type: "expense" | "income"
 * response (kutilayotgan): { amount, category, type, description }
 */
function parseVoiceTransaction({ chatId, text, type }) {
  return api.post("/transactions/voice-parse", { chatId, text, type });
}

/**
 * AI moliyaviy maslahatchi bilan erkin suhbat.
 * POST /ai/chat
 * body: { chatId, message }
 * response (kutilayotgan): { reply }
 */
function aiChat({ chatId, message }) {
  return api.post("/ai/chat", { chatId, message });
}

module.exports = {
  linkTelegram,
  getMe,
  getSummary,
  getBudget,
  getSavings,
  getDebts,
  parseVoiceTransaction,
  aiChat,
};
