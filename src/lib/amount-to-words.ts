/**
 * Convert a number to words for amounts (e.g. "One thousand two hundred thirty-four dollars and 56/100").
 * Handles 0–999,999.99 for receipt "amount in words".
 */
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const TEENS = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

function hundreds(n: number): string {
  if (n === 0) return "";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(`${ONES[h]} hundred`);
  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10]);
  } else {
    if (rest >= 20) parts.push(TENS[Math.floor(rest / 10)]);
    if (rest % 10 > 0) parts.push(ONES[rest % 10]);
  }
  return parts.filter(Boolean).join(" ");
}

export function amountToWords(amount: number): string {
  if (amount < 0 || Number.isNaN(amount)) return "Zero dollars";
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100) % 100;
  if (whole === 0 && cents === 0) return "Zero dollars and 00/100";
  const thousands = Math.floor(whole / 1000);
  const restWhole = whole % 1000;
  const dollarParts: string[] = [];
  if (thousands > 0) dollarParts.push(`${hundreds(thousands)} thousand`);
  if (restWhole > 0 || thousands === 0) dollarParts.push(hundreds(restWhole));
  const dollarStr = dollarParts.filter(Boolean).join(" ").trim() || "Zero";
  const centStr = cents.toString().padStart(2, "0");
  return `${dollarStr} dollar${whole === 1 ? "" : "s"} and ${centStr}/100`;
}
