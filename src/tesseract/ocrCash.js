/**
 * Cash receipt OCR parser
 * Extracts transaction information from cash/official receipt text
 *
 * @module tesseract/ocrCash
 */

/**
 * @typedef {Object} OcrSuggestResult
 * @property {string} rawText
 * @property {number|null} suggestedAmount
 * @property {string|null} suggestedRef
 * @property {string|null} suggestedDateTime
 * @property {string|null} suggestedBank
 */

/**
 * Pads a number with leading zero if needed
 * @param {number} n
 * @returns {string}
 */
const padZero = (n) => String(n).padStart(2, "0");

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const pad2 = padZero;

/**
 * Converts 12h to 24h format
 * @param {number} h
 * @param {number} m
 * @param {string|null} [ampm]
 * @returns {string}
 */
const to24h = (h, m, ampm) => {
  let hour = h;
  if (ampm) {
    const A = ampm.trim().toUpperCase();
    if (A === "AM" && hour === 12) hour = 0;
    if (A === "PM" && hour < 12) hour += 12;
  }
  return `${pad2(hour)}:${pad2(m)}`;
};

/**
 * Amount: prefer labeled, then with currency, then safe fallback
 * @param {string} txt
 * @returns {number|null}
 */
const findAmount = (txt) => {
  const byLabelAll = Array.from(
    txt.matchAll(
      /\b(?:transfer\s+amount|amount|amt|sent)\b[^0-9₱p]{0,20}(?:₱|\bPH(?:P|p))?\s*([\d][\d,]*(?:\.\d{1,2})?)/gi
    )
  );
  if (byLabelAll.length) {
    const best = byLabelAll
      .map((m) => Number((m[1] || "").replace(/,/g, "")))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => b - a)[0];
    if (Number.isFinite(best)) return best;
  }

  const withCurrencyAll = Array.from(
    txt.matchAll(/(?:₱\s*|\bPH(?:P|p)\s*)(\d[\d,]*(?:\.\d{1,2})?)/gi)
  );
  if (withCurrencyAll.length) {
    const best = withCurrencyAll
      .map((m) => Number((m[1] || "").replace(/,/g, "")))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => b - a)[0];
    if (Number.isFinite(best)) return best;
  }

  const fallbackAll = Array.from(
    txt.matchAll(/\b(?:\d{1,3}(?:,\d{3})+|\d{4,6})(?:\.\d{1,2})?\b/g)
  );
  if (fallbackAll.length) {
    const nums = fallbackAll
      .map((m) => Number(m[0].replace(/,/g, "")))
      .filter((n) => Number.isFinite(n) && n >= 100);
    if (nums.length) return Math.max(...nums);
  }
  return null;
};

/**
 * Date span (same behavior as bank; returns ymd + range)
 * @param {string} txt
 * @returns {{ymd: string, start: number, end: number}|null}
 */
const findDateSpan = (txt) => {
  const monthName =
    "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

  let m = txt.match(new RegExp(`\\b${monthName}[-\\s]+(\\d{1,2})[-\\s,]+(20\\d{2})\\b`, "i"));
  if (m && m.index != null) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const d = Number(m[2]);
    const y = Number(m[3]);
    if (mon && d && y) return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  m = txt.match(new RegExp(`\\b${monthName}\\s+(\\d{1,2})[^0-9]{0,20}(20\\d{2})\\b`, "i"));
  if (m && m.index != null) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const d = Number(m[2]);
    const y = Number(m[3]);
    if (mon && d && y) return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  m = txt.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (m && m.index != null) {
    const y = Number(m[1]), mon = Number(m[2]), d = Number(m[3]);
    return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  m = txt.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (m && m.index != null) {
    const a = Number(m[1]), b = Number(m[2]), y = Number(m[3]);
    const mon = a <= 12 ? a : b;
    const d = a <= 12 ? b : a;
    return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  m = txt.match(new RegExp(`\\b(\\d{1,2})\\s+${monthName}[a-z]*,?\\s*(20\\d{2})\\b`, "i"));
  if (m && m.index != null) {
    const d = Number(m[1]);
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    const y = Number(m[3]);
    if (mon && d && y) return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  return null;
};

/**
 * Time near a date (same behavior as bank)
 * @param {string} txt
 * @param {number} [fromIdx]
 * @returns {string|null}
 */
const findTimeNear = (txt, fromIdx) => {
  const windowStart = fromIdx != null ? Math.max(0, fromIdx - 80) : 0;
  const windowEnd = fromIdx != null ? Math.min(txt.length, fromIdx + 160) : txt.length;
  const segment = txt.slice(windowStart, windowEnd);

  let t = segment.match(/\b(\d{1,2}):([0-5]\d)(?::([0-5]\d))?\s*([AaPp]\s*\.?\s*[Mm])\b/);
  if (t) {
    const h = Number(t[1]);
    const m = Number(t[2]);
    const ampm = t[4];
    if (h >= 1 && h <= 12 && m <= 59) return to24h(h, m, ampm);
  }

  t = segment.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/);
  if (t) {
    const h = Number(t[1]);
    const m = Number(t[2]);
    return to24h(h, m);
  }

  if (fromIdx != null) return findTimeNear(txt, undefined);
  return null;
};

/**
 * Cash-specific reference patterns (OR#, Receipt#…)
 * @param {string} txt
 * @returns {string|null}
 */
const findRefCash = (txt) => {
  const patterns = [
    /\b(?:official\s+receipt|o\.?\s*r\.?)\s*(?:no\.?|number)?[-\s:.#]*([A-Z0-9][A-Z0-9-]{4,})\b/i,
    /\breceipt\s*(?:no\.?|number|#)?[-\s:.#]*([A-Z0-9][A-Z0-9-]{4,})\b/i,
    /\bOR[-\s:.#]*([A-Z0-9-]{4,})\b/i,
  ];
  for (const re of patterns) {
    const m = txt.match(re);
    if (m) return m[1].toUpperCase();
  }
  const numeric = txt.match(/\b\d{6,20}\b/);
  return numeric ? numeric[0] : null;
};

/**
 * Cash parser from plain text (bank stays untouched elsewhere)
 * @param {string} text
 * @returns {OcrSuggestResult}
 */
export function parseCashText(text) {
  const txt = (text ?? "").replace(/\s+/g, " ").trim();

  const amount = findAmount(txt);
  const ref = findRefCash(txt);
  const d = findDateSpan(txt);
  const time = findTimeNear(txt, d?.end);
  const ymdhm = d?.ymd && time ? `${d.ymd}T${time}` : null;

  return {
    rawText: txt,
    suggestedAmount: amount,
    suggestedRef: ref,
    suggestedDateTime: ymdhm,
    suggestedBank: null, // cash → no bank
  };
}
