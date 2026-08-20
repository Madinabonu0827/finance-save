# Finance AI — Telegram Bot

Finance AI loyihasining Telegram bot qismi. Telegraf (Node.js) asosida yozilgan, alohida
database ISHLATMAYDI — hamma narsa backend REST API orqali (`BACKEND_URL`) amalga oshiriladi.
Bot faqat HTTP client sifatida backendga so'rov yuboradi.

Notification (byudjet limit, jamg'arma, to'lov eslatmasi) backend tomonidan to'g'ridan-to'g'ri
Telegram Bot API orqali yuboriladi, bot process bunga aralashmaydi.

## Ishga tushirish

```bash
npm install
cp .env.example .env
# .env faylida BOT_TOKEN va BACKEND_URL ni sozlang
npm run dev     # nodemon bilan (development)
npm start       # oddiy node bilan (production)
```

## .env

```
BOT_TOKEN=your_telegram_bot_token
BACKEND_URL=http://localhost:5000/api
```

## Funksionallik

- `/start <code>` — web ilovadan olingan kod bilan Telegram hisobni ulash.
- `/start` (kodsiz) — ulangan bo'lsa asosiy menyu, bo'lmasa ulash yo'riqnomasi.
- 💰 Balans — joriy balans, daromad, xarajat xulosasi.
- ➕ Xarajat qo'shish / ➕ Daromad qo'shish — erkin matn orqali tranzaksiya qo'shish
  (masalan "ovqatga 45 ming"), backend AI/regex bilan summa va kategoriyani aniqlaydi.
- 📊 Byudjet — kategoriya bo'yicha limit/sarf progress bar bilan.
- 🎯 Jamg'armalar — jamg'arma maqsadlari va progress foizi.
- 🤖 AI Maslahatchi — erkin savol-javob rejimi (backend AI orqali).

## Backend bog'liqligi (kutilayotgan endpointlar)

Barcha chaqiruvlar `bot/src/api.js` faylida joylashgan.

| Method | Path | Body | Kutilayotgan response |
|---|---|---|---|
| POST | `/telegram/link` | `{ code, chatId, telegramUsername }` | `{ name, balance }` |
| GET | `/telegram/me/:chatId` | — | `{ name, balance, ... }` (chat ulanmagan bo'lsa 401/404) |
| GET | `/telegram/summary/:chatId` | — | `{ balance, income, expense }` |
| GET | `/telegram/budget/:chatId` | — | `{ categories: [{ name, limit, spent }] }` |
| GET | `/telegram/savings/:chatId` | — | `{ goals: [{ name, target, current }] }` |
| POST | `/transactions/voice-parse` | `{ chatId, text, type }` (`type`: `expense`\|`income`) | `{ amount, category, description }` |
| POST | `/ai/chat` | `{ chatId, message }` | `{ reply }` |

Ulanmagan chatId uchun (401/404) bot foydalanuvchiga hisobni ulashni so'raydi.
