# Hackathon loyihasi — 2 soatlik runbook

Mavzu sessiya boshida beriladi, vaqt **atigi 2 soat**. Maqsad — ishlaydigan, ozoda demo qilsa bo'ladigan mahsulotni eng qisqa vaqtda yig'ish. Bu fayl vaqt bosqichlariga qarab tartiblangan — bosim ostida tepadan pastga o'qib boraverish mumkin.

## Doim amal qiladigan qoidalar (butun 2 soat davomida)

**Tez VA sifatli, oshiqcha emas:**
- Uzoq tushuntirish/reja/muhokamaga vaqt sarflama — to'g'ridan-to'g'ri kodga o't.
- Sinab ko'rmagan kodni commit qilma — har katta qadamdan keyin ishga tushirib tekshir.
- Scope **kichik ushla**: 1-2 feature to'liq va toza ishlasin — bu 10 ta yarim-ishlaydigan feature'dan yaxshiroq. Scope o'sib ketsa: "bu demo uchun majburiymi?" — yo'q bo'lsa tashla.

**To'liq vakolat — yes/no savol berib o'tirma:** Quyidagilarning **hech biri bo'yicha tasdiq so'ralmaydi**, o'zing qaror qilib darhol bajar:
- Kutubxona/paket tanlovi, fayl/papka nomlari, kod strukturasi
- UI rang sxemasi, font, layout detali (pastdagi "UI/UX standart"ga tayan)
- Mock/placeholder data, kichik feature'ni soddalashtirish
- Git commit, oraliq fayl yaratish/o'chirish, dependency o'rnatish

Faqat **2 holatda** to'xtab so'ra:
1. Qaror **qaytarib bo'lmaydigan/xarajat-xavf tug'diruvchi** (real pullik xizmat, production credential, haqiqiy pullik tashqi API so'rovi).
2. Loyiha **qamrovi/yo'nalishini tubdan o'zgartiradigan** tanlov va aniq standart yo'q (masalan mavzu ikki xil talqin qilinadi).

Ikkilanib qolsang — **o'zing eng oqilona variantni tanla, bir qatorda nima qaror qilganingni ayt**, javob kutib o'tirma. Har mayda qadamda tasdiq so'rash — eng katta vaqt yeguvchi odat.

---

## Bosqich 1 — 0–10 daqiqa: reja va scaffold

1. Mavzuni o'qi, kerakli qism(lar)ni aniqla: `landing` / `web` / `backend` / `bot` — hammasi shart emas, mavzuga qarab.
2. Bir nechta mustaqil qism bo'lsa → **monorepo** ("Monorepo va deploy" bo'limiga qara), papkalarni darhol och.
3. Muhitni tekshir: `node -v`, kerakli portlar band emasmi (`lsof -i :PORT`), `mongod`/`opencode` bormi.
4. Mustaqil qismlarni subagent/opencode'ga taqsimlashni rejalashtir ("Kuch multiplikatorlari" bo'limiga qara) va darhol boshla.

**Tayyor scaffold buyruqlari — qo'lda yozib o'tirmasdan shundan boshla:**

```bash
# web (Next.js + Tailwind + shadcn/ui)
npx create-next-app@latest web --typescript --tailwind --eslint --app --import-alias "@/*" --use-npm
cd web && npx shadcn@latest init -d && cd ..

# landing (alohida so'ralgan bo'lsa — xuddi web kabi, alohida papka)
npx create-next-app@latest landing --typescript --tailwind --eslint --app --import-alias "@/*" --use-npm

# backend (Express + Mongoose)
mkdir backend && cd backend && npm init -y
npm install express mongoose cors dotenv
npm install -D nodemon
cd ..

# bot (Telegraf)
mkdir bot && cd bot && npm init -y
npm install telegraf dotenv mongoose
cd ..
```

---

## Bosqich 2 — 10–90 daqiqa: qurish

### Tech stack (standart tanlovlar — aniq tayinlanmasa shulardan boshla)
- Til: **JavaScript/TypeScript**, DB: **MongoDB**, Backend deploy: **Render**, Frontend deploy: **Vercel**
- Frontend: Next.js (yoki faqat landing bo'lsa Vite+React ham bo'ladi)
- Backend: Express + Mongoose
- Auth kerak bo'lsa: soddaroq yechim (JWT) — murakkab provayderlarga vaqt ketkazma

### Loyiha turi bo'yicha yondashuv
- **Landing** — statik/marketing, backend shart emas, bitta buyruq bilan Vercel'ga.
- **Web (full-stack)** — frontend (Vercel) + backend (Render) + MongoDB. Avval backend CRUD, keyin frontend ula.
- **Bot** — Node skript, Render'da Background Worker/Web Service (webhook kerak bo'lsa web service).
- **Backend (faqat API)** — Express+Mongoose, Postman/curl bilan tez tekshir.

**"Landing" va "web" alohida so'ralsa**, ikkita mustaqil loyiha qil, bittaga qo'shib yuborma: landing = tanishtiruv (hero, xususiyatlar, CTA → web/bot'ga link), web = mahsulotning o'zi. Ikkalasi alohida papka, alohida `package.json`, alohida Vercel deploy.

### UI/UX standart (majburiy — bonus emas)
Juri avval **ko'rinishga** qarab baholaydi:
- Tayyor dizayn tizimi (Tailwind + shadcn/ui) — noldan CSS yozma.
- Izchillik: 1 spacing shkala (4/8px), 1 font (Inter/system), 1 aksent rang + neytral fonlar.
- **3 holat har doim**: loading (spinner/skeleton), empty (tushunarli xabar), error (foydalanuvchiga tushunarli, stack trace emas) — hech qachon oq/bo'sh/qotgan ekran yo'q.
- Vizual hierarchiya (sarlavha/matn o'lchamlari aniq farqlansin, CTA ko'zga tashlansin), hover/active + 150–200ms transition.
- Responsive majburiy (~375px va desktop), real kontent bilan sina (Lorem ipsum emas).

### Xatolarni oldini olish (kam xato — ishonchli demo)
- Har tashqi chaqiruv (API/DB/fayl) **try/catch** bilan — xato ilovani qulatmasin.
- Backend validatsiya: noto'g'ri so'rovga 500 emas, aniq 400 + tushunarli xabar.
- Frontend network xatoni ushlaydi, UI qulamaydi (error state ko'rsatiladi).
- Har katta qadamdan keyin darhol ishga tushirib sina — "ishlaydi deb o'ylayman" bilan o'tma.
- Deploydan oldin `npm run build` (TS bo'lsa `tsc --noEmit`) xatosiz o'tishi shart.
- Brauzer konsolida qizil xato bo'lmasligini har muhim qadamdan keyin tekshir, faqat demo oldiga qoldirma.

### Anti-patternlar — bularga vaqt sarflama
- Custom auth tizimi yozish (shart bo'lmasa) — oddiy JWT yetarli.
- Mikroservis arxitektura — monolit yetarli, splitting ortiqcha murakkablik.
- To'liq test suite yozish — vaqt yo'q, faqat qo'lda smoke test.
- CI/CD pipeline sozlash — to'g'ridan-to'g'ri deploy qil.
- Custom UI komponent kutubxonasi yozish — tayyorini (shadcn) ishlat.
- "Kelajakda kerak bo'lishi mumkin" abstraksiya/config — YAGNI, faqat hozir kerak bo'lganini yoz.

### Kuch multiplikatorlari: opencode + AI subagentlar
Eng katta cheklov — **vaqt va e'tibor**, token emas.

**AI subagentlar (Agent tool):** loyiha bir nechta mustaqil qismga bo'linsa (landing/web/backend/bot), birinchi 10 daqiqada qismlarga bo'l, mustaqil qismlarni fon rejimida (`run_in_background: true`) subagentlarga bir vaqtda topshir, o'zing eng murakkab/integratsion qismda qol. Har subagentga aniq kontekst va chegara (qaysi papkaga tegishi/tegmasligi) ber. Natijani integratsiyadan oldin ko'rib chiq va sina.

**opencode CLI** (`/Users/dilbek/.opencode/bin/opencode`, v1.18.13) — alohida bepul dastur, Claude tokenlarini yemaydi:
```bash
opencode run "vazifa matni" --format json --model opencode/big-pickle
```
Modellar: `big-pickle`, `deepseek-v4-flash-free`, `hy3-free`, `laguna-s-2.1-free`, `ling-3.0-tiny-free`, `mimo-v2.5-free`, `nemotron-3-ultra-free`, `nemotron-3.5-lightning-free` (yangilash: `opencode models`). Fonda ishga tushir (`run_in_background: true`), boshqa ish bilan davom et, keyin natijani o'qi.

Nimani berish mumkin: boilerplate/skelet kod, takrorlanuvchi fayllar, oddiy config/README qoralamasi, mock data. Nimani o'zim qilaman: arxitektura, murakkab mantiq, integratsiya, debugging, deploy, scope qarorlari.

**MUHIM:** opencode/subagent natijasini **ishlatishdan oldin har doim ko'zdan kechir va ishga tushirib sina** — ko'rmasdan qo'shish keyinroq ko'proq debugging vaqtini yeydi. Oqim: (1) tor va aniq vazifa ber → (2) natijani tez ko'rib chiq → (3) qo'shib darhol sina (build/run/curl) → (4) xato bo'lsa o'zim tuzataman, opencode'ga qayta-qayta bermayman.

**Brauzer:** referens dizayn/docs ko'rish uchun ruxsatsiz foydalanish mumkin (login/parol/to'lov kiritmaslik siyosati baribir amal qiladi).

---

## Bosqich 3 — 90–110 daqiqa: integratsiya va deploy

### Monorepo va deploy
Bir nechta mustaqil qism bo'lsa, hammasi **bitta GitHub repo**ning ildizida alohida papkalarda turadi — taqdimotga bitta repo linki yetarli, har bir qism platformada **alohida deploy** bo'ladi:
```
repo/
├── web/       (asosiy ilova frontend)
├── landing/   (marketing sayti, agar alohida so'ralgan bo'lsa)
├── backend/   (API server)
└── bot/       (Telegram/boshqa bot)
```
- Har papka o'z `package.json`iga ega, mustaqil (bir-biriga import qilinmaydi).
- Deploy'da platforma sozlamasida **"Root Directory"** shu papkaga ko'rsatiladi (Render va Vercel ikkalasi ham qo'llaydi):
  - `web/`/`landing/` → Vercel project (Root Directory = mos papka)
  - `backend/`/`bot/` → Render Web Service/Background Worker (Root Directory = mos papka)
- Har service GitHub'ga ulansa, `git push` bilan avtomatik qayta deploy — qo'lda qayta yuklash shart emas.
- README'da har qismning nomi va live URL'i alohida yozilsin (Web — link, Landing — link, Backend API — link, Bot — @username).

### Deploy cheklist
- **Backend (Render):** `render.yaml` yoki qo'lda web service, `PORT` env'dan o'qiladi, MongoDB connection string env variable orqali.
- **Frontend (Vercel):** `vercel deploy` yoki GitHub repo ulab avtomatik; backend URL env variable orqali (`NEXT_PUBLIC_API_URL`).
- Ikkalasini ham **vaqtida** (oxirgi 15 daqiqaga qoldirmay) deploy qil va tekshir — juri live link'ni tekshiradi.
- Render bepul tarifida cold start bo'ladi — demo oldidan bir marta so'rov yuborib "isit".

---

## Bosqich 4 — 110–120 daqiqa: yakuniy tekshiruv

Bu bosqich ko'p ball vaqt tugashi yoki oxirgi daqiqada nimadir buzilishidan yo'qolishining oldini oladi:

- **Live URL'ni yangi/incognito oynada och** (lokal kesh aldamasin), asosiy oqimni boshidan oxirigacha qo'lda sina, konsolda xato yo'qligini tekshir, mobil o'lchamda ham qara.
- **Yarim ishlagan narsani yashir:** to'liq tuzatilmagan narsani UI'dan olib tashla — ishlamaydigan tugma ko'rsatish, feature umuman yo'qligidan yomonroq.
- **Zaxira reja:** live demo ishlamay qolishidan xavotirlansang, oldindan tayyorlangan qisqa GIF/screenshot qo'lda tursin.
- Screenshot/GIF, taqdimotga tayyor bo'l.

**Har doimgi ehtiyot choralar (loyiha boshidanoq amal qiladi):**
- **Git checkpointlari:** boshida `git init`, har ishlagan bosqichdan keyin commit (masalan "backend CRUD ishladi") — oxirida tez orqaga qaytarish uchun.
- **Muhit preflight:** boshlashdan oldin versiya/port/vositalarni tekshir — o'rtada band port bilan vaqt yo'qotma.
- **Fayl/papka gigienasi:** muhim fayllar (ayniqsa `CLAUDE.md`) toza nomlarda — ko'rinmas belgilar vositalarni buzadi.
- **Ruxsat rejimi:** sessiya har bash/tool chaqiruvida alohida tasdiq so'rasa, boshida erkinroq ruxsat rejimiga (accept edits/bypass permissions) o'tishni so'ra.

## Qo'shimcha ball strategiyasi (bonus)
UI/UX va xato-bardoshlik yuqorida **majburiy**. Bulardan tashqari, tez qo'shsa bo'ladigan, ko'zga tashlanadigan narsalar: qisqa aniq README (nima qilingani, ishga tushirish, stack, live URL'lar), `.env.example` fayli, aniq setup qadamlari.

## Eslatma
Bu fayl loyiha ildiziga `CLAUDE.md` nomi bilan qo'yilsa, Claude Code sessiya boshida uni avtomatik o'qiydi — qayta tushuntirishga hojat qolmaydi.
