// src/features/enrollment/services/receiptOcr.ts
import { OcrSuggestResult } from "@shared/types";
import { padZero } from "@shared/utils/formatters";

type Maybe<T> = T | null;

let _tess: Promise<unknown> | null = null;
async function getTesseract() {
  if (!_tess) _tess = import("tesseract.js").then((m: unknown) => m.default ?? m);
  return _tess;
}

// ---------- helpers ----------
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const pad2 = padZero;

// small bank dictionary (expand any time)
const BANK_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "GCash", patterns: [/gcash/i] },
  { name: "Maya", patterns: [/maya/i, /pay\s*maya/i] },
  { name: "BDO", patterns: [/\bbdo\b/i, /bdo\s+unibank/i] },
  { name: "BPI", patterns: [/\bbpi\b/i, /bank of the philippine islands/i] },
  { name: "Metrobank", patterns: [/metrobank/i] },
  { name: "UnionBank", patterns: [/union\s*bank/i] },
  { name: "RCBC", patterns: [/\brcbc\b/i] },
  { name: "PNB", patterns: [/\bpnb\b/i, /philippine national bank/i] },
  { name: "China Bank", patterns: [/china\s*bank/i] },
  { name: "LANDBANK", patterns: [/land\s*bank/i] },
  { name: "Security Bank", patterns: [/security\s*bank/i] },
  { name: "EastWest", patterns: [/east\s*west/i] },
  { name: "CIMB", patterns: [/\bcimb\b/i, /cimb\s*bank/i, /octo\s+by\s+cimb/i] },
  { name: "Tonik", patterns: [/\btonik\b/i, /tonik\s+digital\s+bank/i] },
  { name: "MariBank", patterns: [/\bmaribank\b/i, /mari\s*bank/i] },
  { name: "PSBank", patterns: [/\bpsbank\b/i, /\bps\s*bank\b/i, /philippine\s+savings\s+bank/i] },
];

const to24h = (h: number, m: number, ampm?: string | null) => {
  let hour = h;
  if (ampm) {
    const A = ampm.trim().toUpperCase();
    if (A === "AM" && hour === 12) hour = 0;
    if (A === "PM" && hour < 12) hour += 12;
  }
  return `${pad2(hour)}:${pad2(m)}`;
};

// ---------- bank inference ----------
const inferBankNameWholeText = (segment: string): Maybe<string> => {
  for (const b of BANK_PATTERNS) {
    if (b.patterns.some((re) => re.test(segment))) return b.name;
  }
  return null;
};

/**
 * More robust slicer: start AFTER marker, end at earliest boundary keyword.
 * Handles weird OCR noise like “To (eo) …”, “Acct.”, “Account No.”, etc.
 */
const sliceAfterWithBoundaries = (txt: string, markerRe: RegExp): string | null => {
  const m = txt.match(markerRe);
  if (!m || m.index == null) return null;
  const start = m.index + m[0].length;
  const rest = txt.slice(start, Math.min(txt.length, start + 320));

  const boundaryTokens: RegExp[] = [
    /\btransfer\s+to\b/i,
    /\bto\b/i,
    /\bbeneficiary\b/i,
    /\brecipient\b/i,
    /\bacct\.?\b/i,
    /\baccount\b/i,
    /\baccount\s*no\.?\b/i,
    /\bref(?:erence)?\b/i,
    /\bamount\b/i,
    /\bdate\b/i,
    /\btime\b/i,
    /\bmethod\b/i,
    /\bprocessing\b/i,
  ];

  let end = rest.length;
  for (const re of boundaryTokens) {
    const mm = rest.match(re);
    if (mm && mm.index != null && mm.index < end) {
      end = mm.index;
    }
  }
  return rest.slice(0, end);
};

const inferBankNameByContext = (txt: string): { from: Maybe<string>; to: Maybe<string> } => {
  const fromSeg =
    sliceAfterWithBoundaries(txt, /\b(?:transfer\s+from|from)\b/i) ||
    sliceAfterWithBoundaries(txt, /\b(?:sender|payer|source\s+account)\b/i);

  const toSeg =
    sliceAfterWithBoundaries(txt, /\b(?:transfer\s+to|to)\b/i) ||
    sliceAfterWithBoundaries(txt, /\b(?:recipient|beneficiary)\b/i);

  const from = fromSeg ? inferBankNameWholeText(fromSeg) : null;
  const to = toSeg ? inferBankNameWholeText(toSeg) : null;

  return { from, to };
};

// ---------- extractors ----------
/** Amount examples: “Transfer amount PHP 9,000.00”, “PHP9,000.00”, “₱9,000” */
const findAmount = (txt: string): Maybe<number> => {
  // 1) Prefer lines with a label near the number (also tolerate “Sent”)
  //    Note: allow PHP without a trailing word boundary so "PHP9,000.00" matches.
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
    if (Number.isFinite(best)) return best!;
  }

  // 2) Any explicit currency (“₱ …” or “PHP …” with or w/o space)
  const withCurrencyAll = Array.from(
    txt.matchAll(/(?:₱\s*|\bPH(?:P|p)\s*)(\d[\d,]*(?:\.\d{1,2})?)/gi)
  );
  if (withCurrencyAll.length) {
    const best = withCurrencyAll
      .map((m) => Number((m[1] || "").replace(/,/g, "")))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => b - a)[0];
    if (Number.isFinite(best)) return best!;
  }

  // 3) Fallback: numbers that *look* like money but avoid long unformatted IDs
  //    - Allow "1,234,567.89"
  //    - Allow 4–6 digit plain numbers (e.g., 9000, 150000), optional decimals
  //    - Reject very long plain digit runs (e.g., 006508022882)
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

/** Prefer explicit labels; tolerate "No." and : . - # separators; fallback to 6–20 digit code */
const findRef = (txt: string): Maybe<string> => {
  const patterns: RegExp[] = [
    /\bref(?:erence)?\b[-\s:.#]*(?:no\.?|number|id)?\s*([A-Z0-9][A-Z0-9-]{5,})\b/i,
    /\bconf(?:irmation)?\b\s*(?:no\.?|number|id)?[-\s:.#]+([A-Z0-9][A-Z0-9-]{5,})\b/i,
    /\b(?:txn|trans(?:action)?)\b\s*(?:id|no|code)?[-\s:.#]+([A-Z0-9][A-Z0-9-]{5,})\b/i,
    /\btrace\b\s*(?:no\.?|number|id)?[-\s:.#]+([A-Z0-9][A-Z0-9-]{5,})\b/i,
  ];
  for (const re of patterns) {
    const m = txt.match(re);
    if (m) return m[1].toUpperCase();
  }
  const numeric = txt.match(/\b\d{6,20}\b/);
  if (numeric) return numeric[0];
  return null;
};

/**
 * DATE (REVERT + EXTENSIONS):
 * - "Sep 21,2025", "Sep 21 2025", "Sep-21-2025"
 * - "2025-09-21", "09/21/2025"
 * - "21 Sep 2025"
 * - noisy: "Sep 26 Date and 2025"
 */
const findDateSpan = (txt: string): Maybe<{ ymd: string; start: number; end: number }> => {
  const monthName =
    "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

  // Month-name with separators (space or hyphen): "Sep-21-2025" / "Sep 21, 2025"
  let m = txt.match(new RegExp(`\\b${monthName}[-\\s]+(\\d{1,2})[-\\s,]+(20\\d{2})\\b`, "i"));
  if (m && m.index != null) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const d = Number(m[2]);
    const y = Number(m[3]);
    if (mon && d && y) return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  // Month-name first with noise between day and year: "Sep 26 Date and 2025"
  m = txt.match(new RegExp(`\\b${monthName}\\s+(\\d{1,2})[^0-9]{0,20}(20\\d{2})\\b`, "i"));
  if (m && m.index != null) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const d = Number(m[2]);
    const y = Number(m[3]);
    if (mon && d && y) return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  // ISO (YYYY-MM-DD / YYYY/MM/DD)
  m = txt.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (m && m.index != null) {
    const y = Number(m[1]), mon = Number(m[2]), d = Number(m[3]);
    return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  // MM/DD/YYYY or DD/MM/YYYY — assume MM/DD if first ≤ 12
  m = txt.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (m && m.index != null) {
    const a = Number(m[1]), b = Number(m[2]), y = Number(m[3]);
    const mon = a <= 12 ? a : b;
    const d = a <= 12 ? b : a;
    return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  // “21 Sep 2025”
  m = txt.match(new RegExp(`\\b(\\d{1,2})\\s+${monthName}[a-z]*,?\\s*(20\\d{2})\\b`, "i"));
  if (m && m.index != null) {
    const d = Number(m[1]);
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    const y = Number(m[3]);
    if (mon && d && y) return { ymd: `${y}-${pad2(mon)}-${pad2(d)}`, start: m.index, end: m.index + m[0].length };
  }

  return null;
};

/** TIME: “10:20 AM”, “22:05”, or “11:08:47 PM” → HH:mm (24h). Ignores “(GMT +8)”. */
const findTimeNear = (txt: string, fromIdx?: number): Maybe<string> => {
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

// ---------- main ----------
export default async function ocrSuggest(
  file: File | Blob | ArrayBuffer | Uint8Array | string
): Promise<OcrSuggestResult> {
  if (!file) {
    return {
      rawText: "",
      suggestedAmount: null,
      suggestedRef: null,
      suggestedDateTime: null,
      suggestedBank: null,
    };
  }

  const Tesseract = await getTesseract();
  const { data } = await Tesseract.recognize(file, "eng", { logger: () => { } });

  // Collapse whitespace; keep original for debugging if you like
  const txt: string = (data?.text ?? "").replace(/\s+/g, " ").trim();

  // Amount / Ref
  const amount = findAmount(txt);
  const ref = findRef(txt);

  // Date & time (combined)
  const d = findDateSpan(txt);
  const time = findTimeNear(txt, d?.end);
  const ymd = d?.ymd ?? null;
  const ymdhm = ymd && time ? `${ymd}T${time}` : null;

  // Bank: prefer “From …” → else “To …” (if you want), else fallback whole text.
  const banks = inferBankNameByContext(txt);
  const bank =
    banks.from ??
    // (optionally) if you want to prefer payer only, comment the next line:
    banks.to ??
    inferBankNameWholeText(txt) ??
    null;

  return {
    rawText: txt,
    suggestedAmount: amount,
    suggestedRef: ref,
    suggestedDateTime: ymdhm,    // preferred by your UI (datetime-local)
    suggestedBank: bank,
  };
}

export function parseBankText(text: string): OcrSuggestResult {
  // Collapse whitespace; keep original for debugging if you like
  const txt: string = text.replace(/\s+/g, " ").trim();

  // Amount / Ref
  const amount = findAmount(txt);
  const ref = findRef(txt);

  // Date & time (combined)
  const d = findDateSpan(txt);
  const time = findTimeNear(txt, d?.end);
  const ymd = d?.ymd ?? null;
  const ymdhm = ymd && time ? `${ymd}T${time}` : null;

  // Bank: prefer “From …” → else “To …” (if you want), else fallback whole text.
  const banks = inferBankNameByContext(txt);
  const bank =
    banks.from ??
    // (optionally) if you want to prefer payer only, comment the next line:
    banks.to ??
    inferBankNameWholeText(txt) ??
    null;

  return {
    rawText: txt,
    suggestedAmount: amount,
    suggestedRef: ref,
    suggestedDateTime: ymdhm,    // preferred by your UI (datetime-local)
    suggestedBank: bank,
  };
}