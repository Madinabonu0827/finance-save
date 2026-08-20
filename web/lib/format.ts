export function formatMoney(amount: number, currency = "UZS"): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString("uz-UZ").replace(/,/g, " ");
  return currency === "UZS" ? `${formatted} so'm` : `${formatted} ${currency}`;
}

// Ba'zi brauzerlar "uz-UZ" locale uchun to'liq ICU ma'lumotiga ega emas (masalan oy nomi o'rniga "M08"
// chiqarishi mumkin) — shuning uchun oy nomlari qo'lda, ishonchli tarzda formatlanadi.
const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}
