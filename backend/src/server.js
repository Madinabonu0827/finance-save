require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { checkRecurringPayments } = require('./utils/recurringCheck');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Finance AI backend http://localhost:${PORT} portida ishlamoqda`);
  });

  // Takrorlanuvchi to'lov eslatmalarini kuniga bir marta (va serverdan darhol keyin) tekshiradi.
  checkRecurringPayments();
  setInterval(checkRecurringPayments, 24 * 60 * 60 * 1000);
});
