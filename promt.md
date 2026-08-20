# FINANCE AI — SHAXSIY MOLIYA EKOTIZIMI (Hackathon MVP)

> Bu fayl loyihaning **domenga xos** talablarini beradi (nima qurish kerak).
> Qanday qurish kerakligi (stack, UI standart, vakolat chegaralari, deploy, git, xato-bardoshlik) — **CLAUDE.md**'da, bu yerda takrorlanmaydi.

## 1. G'oya

Hackathon mavzusi: **"Finance"** (moliyani to'g'irlash / tartibga solish)

Bot nomi: **Finance AI**, Telegram username: **@AIFinanceUzBot**

Finance AI — foydalanuvchining kundalik xarajat/daromadlarini, byudjetini va moliyaviy tahlilini **Web ilova va Telegram bot** orqali, bitta accountga bog'langan holda boshqaradigan platforma. Quyida (§2) referens sifatida ko'rilgan **ishlaydigan funksional** va ustiga **qo'shilishi kerak bo'lgan yangi modullar** (§3) aniq ajratilgan.

## 2. Mavjud funksional (referens sifatida tekshirilgan, saqlanadi/takomillashtiriladi)

Quyidagi funksional referens sifatida tekshirilgan bitta interfeysdan (5 tabli: `Bosh sahifa · Statistika · Byudjet · AI · Sozlamalar`) olingan — **Web ilovada shu bo'limlar to'liq sahifalar sifatida** qayta quriladi, **Telegram botda esa** tugmali menyu orqali tezkor versiyasi (tranzaksiya qo'shish, balans/byudjet ko'rish, AI chat, notification qabul qilish) beriladi.

**Bosh sahifa:**

- Foydalanuvchi ismi bilan salomlashish, "Joriy balans" (yirik raqam).
- Ikkita karta: Daromadlar (+summa) va Xarajatlar (-summa).
- Ikkita tezkor tugma: "Xarajat qo'shish" / "Daromad qo'shish".
- **Ovozli kiritish tugmasi (mikrofon)** — foydalanuvchi ovoz orqali tranzaksiya kirita oladi (masalan "taksiga 20 ming sarfladim" → AI summani va kategoriyani avtomatik aniqlaydi).
- "So'nggi amallar" — oxirgi tranzaksiyalar ro'yxati.

**Statistika:**

- Davr filtri: Hafta / Oy / Yil.
- Xarajatlar / Daromadlar tab almashtirish.
- 3 ta xulosa karta: Daromad, Xarajat, Balans.
- "Xarajatlar taqsimoti" — kategoriya bo'yicha doira diagramma (ma'lumot bo'lmasa "Ushbu davrda xarajatlar mavjud emas" bo'sh holat).
- "Top xarajatlar" — eng ko'p sarflangan kategoriyalar ro'yxati.

**Byudjet:**

- Har kategoriya uchun oylik xarajat limiti o'rnatish (bosilganda limit kiritish formasi ochiladi).
- Standart kategoriyalar: 🍔 Ovqat, 🚗 Transport, 🏠 Uy-joy, 💊 Sog'liq, 🎮 Ko'ngilochar, 👕 Kiyim, 📚 Ta'lim.
- Har kategoriyada joriy sarf / limit ko'rsatiladi ("0 / Limit yo'q" — limit qo'yilmagan holat).

**AI (AI Maslahatchi):**

- Chat interfeysi, salomlashish xabari bilan boshlanadi.
- "Tezkor savollar" tugmalari: "Xarajatlarimni tahlil qil", "Pul tejash bo'yicha maslahat", "Byudjetim ahvoli qanday?".
- Erkin matn kiritish maydoni.

**Sozlamalar:**

- Asosiy valyuta (standart UZS).
- Mavzu (Qorong'u/Yorug'/Tizim).
- Til (O'zbek va h.k.).
- Ma'lumotlarni eksport qilish (JSON yuklab olish) va Zaxiradan tiklash (JSON import).
- Ilova haqida.
- Ma'lumotlarni tozalash (barcha tranzaksiyalarni o'chirish).

## 3. Yangi qo'shiladigan modullar (mavjudda yo'q, zarur)

Mavjud versiya faqat **kuzatuv va tahlil** qiladi — pulni qayerga yig'ish yoki kelajakni rejalashtirish imkoniyati yo'q. Shuning uchun quyidagi 3 modul qo'shiladi, chunki ular hackathon mavzusidagi "moliyani to'g'irlash" g'oyasini **faol harakatga** aylantiradi (faqat kuzatuvdan farqli):

1. **Jamg'arma maqsadlari (Savings Goals)** — yangi tab yoki Byudjet ichida bo'lim: nom, maqsad summa, joriy summa, muddat (ixtiyoriy), progress %. Pul qo'shish tugmasi. Maqsadga yetganda tabriknoma. _Sabab: mavjud ilova faqat "qancha sarfladim"ni ko'rsatadi, lekin "nimaga jamg'aryapman"ni ko'rsatmaydi — bu hackathon jurisiga eng ko'zga tashlanadigan farq bo'ladi._
2. **Takrorlanuvchi to'lovlar / eslatmalar (Recurring Payments)** — masalan ijara, internet, abonent to'lovlari: nom, summa, sana (har oy). Belgilangan kunda Telegram push-notification yuboriladi. _Sabab: real hayotda foydalanuvchini har kuni qaytarib turadigan asosiy sabab shu — CLAUDE.md talabidagi "odam har kuni ishlatadigan mahsulot" shartiga mos._
3. **Byudjet ogohlantirish tizimi (real notification)** — Byudjet bo'limida limit qo'yilgan kategoriya 80%ga yetganda va 100%dan oshganda Telegramga real push-notification keladi (hozirgi versiyada limit faqat UI'da ko'rinadi, push yo'q). _Sabab: bu "bog'langan sistema" (Byudjet → Notification → Telegram) ekanligini isbotlaydigan eng oddiy va kuchli demo hodisasi._

## 4. Scope — nima MUST, nima vaqt qolsa

**MUST (2 soatlik demo zanjiri):**
Web Auth (register/login) → Telegramni ulash (linking) → Web Dashboard (balans, tranzaksiya qo'shish) → Telegram orqali ham tranzaksiya qo'shish va Web'da darhol ko'rinishi (real sync isboti) → Byudjet (kategoriya limiti) → Limit 80%/100%ga yetganda **real Telegram notification** → Jamg'arma maqsadi yaratish va unga pul qo'shish

**Vaqt qolsa qo'shiladi (shu tartibda):**

1. AI Maslahatchi (Web + Telegramda ham ishlaydigan)
2. Statistika (diagramma, davr filtri, top xarajatlar)
3. Ovozli kiritish, Takrorlanuvchi to'lovlar, Sozlamalar (valyuta, tema, export/import)

## 5. Arxitektura — WEB va TELEGRAM bitta sistema

Ikkita **mustaqil interfeys** (Web ilova va Telegram bot), lekin **bitta backend va bitta database** orqali ishlaydi — Mini App emas, klassik ikki interfeysli arxitektura.

```
              WEB APP        TELEGRAM BOT (@AIFinanceUzBot)
                  |                |
                  └───────┬────────┘
                          |
                    BACKEND API  ← yagona source of truth
                          |
                       MONGODB   ← yagona database
                          |
                     FINANCE AI
```

- Web va Telegram **alohida database yoki logic ishlatmaydi** — bitta backend, bitta MongoDB.
- **Account sync:** Web'da register (email/parol, JWT) → "Telegramni ulash" → unique linking code/QR → Telegram `/start <code>` → backend accountlarni bog'laydi. Shundan keyin ikkalasi bir xil accountga tegishli.
- **Web** = to'liq interfeys: Dashboard, Statistika (diagramma), Byudjet, Jamg'arma, AI Maslahatchi, Sozlamalar — §2 va §3'dagi barcha modullar shu yerda to'liq ishlaydi.
- **Telegram bot** = ikkinchi to'liq interfeys, lekin tezkor foydalanish uchun: tugmali menyu orqali tez tranzaksiya kiritish (shu jumladan ovozli xabar orqali ham), balans/byudjet holatini so'rash, AI Maslahatchi bilan chat, va **notification** qabul qilish (limit ogohlantirishi, to'lov eslatmasi, jamg'arma tabrigi).
- **Real-time ta'sir:** Web'da qo'shilgan tranzaksiya Telegramda darhol ko'rinadi (masalan botdan "Balans" so'ralganda) va aksincha — Telegram orqali kiritilgan tranzaksiya Web dashboardda avtomatik paydo bo'ladi. **Fake/hardcoded sync yoki fake notification qilinmaydi** — hammasi backend orqali real oqim.

## 6. AI qoidalari (majburiy, xavfsizlikka aloqador)

- AI backend orqali **real user data** (tranzaksiyalar, byudjet, jamg'arma) bilan ishlaydi, o'zicha fake raqam yaratmaydi.
- AI **investitsiya tavsiyasi, aniq moliyaviy/soliq maslahati bermaydi**, kredit/qarz olish bo'yicha qaror qabul qilmaydi.
- Jiddiy moliyaviy savolga standart javob: _"Men moliyaviy maslahatchi o'rnini bosa olmayman. Muhim qarorlar uchun mutaxassisga murojaat qiling."_ — shundan keyin foydalanuvchining o'z ma'lumotlari asosida umumiy kuzatuv beradi.
- Ovozli kiritishda AI noto'g'ri summa/kategoriya aniqlasa, foydalanuvchi tasdiqlashdan oldin tahrirlay olishi kerak (avtomatik saqlanmaydi).
- Bir userning moliyaviy ma'lumoti va AI konteksti boshqa userga hech qachon ko'rinmaydi.

## 7. Ma'lumotlar modeli (Mongoose)

`User, TelegramConnection, Transaction, Category, Budget, SavingsGoal, RecurringPayment, Notification, AIConversation, AIMessage, MonthlySummary`

`User` — Web orqali email/parol (JWT) bilan register qiladi. `TelegramConnection` — shu userni Telegram `chatId`siga bog'laydi (linking code orqali). Notification yuborilganda backend shu bog'lanish orqali qaysi `chatId`ga xabar borishini aniqlaydi.

Standart kategoriyalar seed qilinadi: Ovqat, Transport, Uy-joy, Sog'liq, Ko'ngilochar, Kiyim, Ta'lim (emoji bilan, yuqoridagi §2'dagi ro'yxat).

## 8. Demo uchun seed data

`backend/scripts/seedDatabase.js`: 20+ tranzaksiya (oxirgi 30 kun), 2–3 byudjet limiti (biri 80%+ holatda — notification demo uchun), 1–2 jamg'arma maqsadi (biri qisman to'ldirilgan), 1 takrorlanuvchi to'lov (yaqin sanada).

## 9. Domenga xos maxfiylik

- Financial data isolation: faqat egasi (o'z FINANCE AI accounti orqali — Web login yoki bog'langan Telegram) o'z ma'lumotini ko'radi.
- Karta raqami kabi haqiqiy to'lov ma'lumotlari saqlanmaydi/kiritilmaydi.
- AI conversation isolation: bir userning konteksti boshqasiga oqmaydi.

## 10. Demo stsenariy (2 soatlik taqdimot uchun)

1. Web'da login → Dashboard (balans)
2. "Telegramni ulash" → Telegram botda `/start` → hisoblar bog'langani ko'rsatiladi
3. Telegram orqali tez tranzaksiya kiritish ("Ovqatga 45 ming sarfladim") → Web dashboard yangi oynada darhol yangilanganini ko'rsatish (real sync — asosiy "wow" moment #1)
4. Byudjet bo'limida shu kategoriya limitiga yaqinlashganini ko'rsatish
5. Limit oshganda **real Telegram notification** kelganini ko'rsatish (wow moment #2)
6. Jamg'arma maqsadi yaratish va pul qo'shish, progress yangilanishi
7. AI Maslahatchi (Web yoki Telegramda): "Byudjetim ahvoli qanday?" → real tahlil javobi

Vaqt qolsa: Statistika diagrammasi, ovozli kiritish, takrorlanuvchi to'lov eslatmasi, Sozlamalar (export/import) qo'shiladi.

## 11. Loyihaga xos ENV o'zgaruvchilar

```
GITHUB_REPO=https://github.com/SANJAR-RSE/financesave.git
MONGO_URI=mongodb+srv://rasulberdievsanjar_db_user:aGVDb7zpYK8D9MqE@cluster0.k6qlvor.mongodb.net/?appName=Cluster0
MONGO_USER=rasulberdievsanjar_db_user
MONGO_PASSWORD=aGVDb7zpYK8D9MqE
RENDER_TOKEN=rnd_2eNNC9OnUAqdC1FRt6Oe0PHDQSdp
BOT_TOKEN=8672511551:AAGLxHyLw7nuP1TQ16RtuocHa11BbLaZpPs
```

`BOT_TOKEN` — BotFather'da `@AIFinanceUzBot` uchun olingan token shu yerga kiritiladi. Bot Node.js + Telegraf orqali backend'dan foydalanadi, alohida database ishlatmaydi.

---

**Eslatma:** Project structure, UI/UX standart, xato-bardoshlik, xavfsizlik (JWT/bcrypt umumiy qismi), deploy, git checkpoint, README talablari va vakolat chegaralari — barchasi **CLAUDE.md**'da mavjud, Claude Code buni sessiya boshida avtomatik o'qiydi.
