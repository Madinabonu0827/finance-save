function formatMoney(amount) {
  return Math.round(amount).toLocaleString('uz-UZ').replace(/,/g, ' ');
}

function currentMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

module.exports = { formatMoney, currentMonthKey };
