# Finance AI — Shaxsiy moliya ekotizimi

Foydalanuvchining kundalik xarajat/daromadlarini, byudjetini, jamg'arma maqsadlarini va
moliyaviy tahlilini **Web ilova** va **Telegram bot** orqali, bitta accountga bog'langan
holda boshqaradigan platforma. Ikkala interfeys ham **bitta backend va bitta MongoDB**
orqali ishlaydi.

## Tuzilma (monorepo)

```
finance save/
├── web/       — Next.js (TypeScript, Tailwind, shadcn/ui) — to'liq web interfeys
├── backend/   — Express + Mongoose REST API — yagona source of truth
└── bot/       — Telegraf — Telegram @finance_save_bot
```

Har papka mustaqil `package.json`ga ega va bir-biriga import qilinmaydi — bitta backend
va MongoDB orqali bog'lanadi.

## Stack

- **Til:** JavaScript/TypeScript
- **DB:** MongoDB (Atlas)
- **Backend:** Express + Mongoose, JWT auth (bcrypt bilan)
- **Frontend:** Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui (Base UI asosida)
- **Bot:** Telegraf, alohida DB ishlatmaydi — backend REST API orqali

## Ishga tushirish (lokal)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # MONGO_URI, JWT_SECRET, BOT_TOKEN sozlang
npm run seed            # demo user + 20+ tranzaksiya, byudjet, jamg'arma seed qiladi
npm run dev              # http://localhost:5000
```

Demo login: `demo@financeai.uz` / `demo123456`

### 2. Web

```bash
cd web
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL
npm run dev                   # http://localhost:3000
```

### 3. Telegram bot

```bash
cd bot
npm install
cp .env.example .env   # BOT_TOKEN, BACKEND_URL
npm run dev
```

## Asosiy funksional

**Web (5+1 bo'lim):** Bosh sahifa (balans, tezkor tranzaksiya qo'shish — matn/ovoz orqali
avtomatik summa+kategoriya aniqlash), Statistika (davr filtri, doira diagramma, top
xarajatlar), Byudjet (kategoriya limitlari, 80%/100% ogohlantirish), Jamg'arma (maqsadlar,
progress, tabriknoma), AI Maslahatchi (real ma'lumot asosida tahlil), Sozlamalar
(Telegramni ulash, valyuta/mavzu/til, eksport/import, ma'lumotlarni tozalash).

**Telegram bot:** tugmali menyu orqali tezkor tranzaksiya kiritish, balans/byudjet/jamg'arma
so'rash, AI Maslahatchi bilan chat, real-time push-notification qabul qilish.

**Real sinxronizatsiya:** Web'da register → "Telegramni ulash" kodi → botda `/start <kod>` →
hisoblar bog'lanadi. Shundan keyin ikkala interfeysdagi tranzaksiyalar bir xil accountga
tegishli va darhol ko'rinadi. Byudjet limiti 80%/100%ga yetganda backend to'g'ridan-to'g'ri
Telegram Bot API orqali real push-notification yuboradi — fake/hardcoded emas.

## AI haqida eslatma

Loyihaga real LLM API kaliti (OpenAI/Anthropic va h.k.) berilmagani — faqat `MONGO_URI`,
`BOT_TOKEN`, `RENDER_TOKEN` mavjud edi — AI Maslahatchi foydalanuvchining **real** moliyaviy
ma'lumotlari (tranzaksiya, byudjet, jamg'arma) ustida ishlaydigan qoida-asosli (rule-based)
tahlil dvigateli sifatida amalga oshirilgan (`backend/src/utils/aiAdvisor.js`). Fake/hardcoded
raqam ishlatilmaydi. Xuddi shu tarzda, ovozli/matnli tranzaksiya kiritish
(`backend/src/utils/parseTransactionText.js`) kalit so'z va raqam aniqlashga asoslangan
qoida-asosli parser.

## Deploy

- **Backend** → Render (Web Service), Root Directory = `backend`, `PORT` env'dan o'qiladi.
- **Web** → Vercel, Root Directory = `web`, `NEXT_PUBLIC_API_URL` = backend'ning live URL'i (`web/.env.production`).
- **Bot** → Render (Web Service — bepul tarifda Background Worker mavjud emas, shuning uchun bot
  ichida oddiy health-check HTTP server ham ishga tushadi, asosiy funksiyaga ta'sir qilmaydi).

**Live URL'lar:**

- Web — https://financesave-web.vercel.app
- Backend API — https://financeai-backend-2npf.onrender.com/api
- Bot — [@finance_save_bot](https://t.me/finance_save_bot) _(eslatma: `BOT_TOKEN` haqiqiy egasi shu bot — nomi promt.md'dagi "@AIFinanceUzBot"dan farq qiladi)_

> Render bepul tarifida ~15 daqiqa faolsizlikdan keyin server "uxlab qoladi" — demo oldidan
> `curl https://financeai-backend-2npf.onrender.com/api/health` bilan bir marta "isitib" oling.
