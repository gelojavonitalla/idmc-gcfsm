/**
 * Receipt text recognition using Tesseract.js
 * Handles OCR with rotation and multiple page segmentation modes
 *
 * @module tesseract/receiptText
 */

// Lazy loader (creates a separate "ocr" chunk thanks to your manualChunks rule)
let _tess = null;

/**
 * Lazy-loads tesseract.js
 * @returns {Promise<unknown>}
 */
async function getTesseract() {
  if (!_tess) _tess = import("tesseract.js").then((m) => m.default ?? m);
  return _tess;
}

/**
 * @typedef {Object} RecognitionResult
 * @property {string} text - Recognized text
 * @property {number} confidence - Confidence level (0-100)
 */

/**
 * Recognize text from receipt image with confidence
 * @param {File|Blob|ArrayBuffer|Uint8Array|string} input
 * @returns {Promise<RecognitionResult>}
 */
export async function recognizeReceiptText(input) {
  if (typeof input === "string") {
    return { text: input.trim(), confidence: 100 };
  }
  const Tesseract = await getTesseract();
  const { data } = await Tesseract.recognize(input, "eng", { logger: () => {} });
  return {
    text: (data?.text ?? "").replace(/\s+/g, " ").trim(),
    confidence: data?.confidence ?? 0,
  };
}

const isBrowser = typeof window !== "undefined";

/**
 * Collapse whitespace in text
 * @param {string} t
 * @returns {string}
 */
function collapseWhitespace(t) {
  return t.replace(/\s+/g, " ").trim();
}

/**
 * Heuristic: reward money/date/ref signals + digit density; penalize super-short
 * @param {string} t
 * @returns {number}
 */
function scoreReceiptText(t) {
  if (!t) return -1e6;
  const L = t.length;
  const digits = (t.match(/\d/g) || []).length;
  const moneyHits = (t.match(/(?:₱|\bPH(?:P|p)\b)/g) || []).length;
  const keywords =
    (t.match(
      /\b(amount|php|reference|ref|txn|transaction|date|time|instapay|transfer|account|acct|official\s+receipt|invoice)\b/gi
    ) || []).length;
  const density = digits / Math.max(10, L);
  return L * 0.1 + digits * 1.5 + moneyHits * 8 + keywords * 5 + density * 40;
}

/**
 * Rotate an image blob using canvas (browser only)
 * @param {Blob} blob
 * @param {0|90|180|270} angle
 * @returns {Promise<Blob>}
 */
async function rotateBlob90s(blob, angle) {
  if (!isBrowser || angle === 0) return blob;

  const img = await new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      res(im);
    };
    im.onerror = (e) => {
      URL.revokeObjectURL(url);
      rej(e);
    };
    im.src = url;
  });

  const cw = angle === 90 || angle === 270 ? img.height : img.width;
  const ch = angle === 90 || angle === 270 ? img.width : img.height;

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.filter = "contrast(1.15)";

  switch (angle) {
    case 90:
      ctx.translate(cw, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case 180:
      ctx.translate(cw, ch);
      ctx.rotate(Math.PI);
      break;
    case 270:
      ctx.translate(0, ch);
      ctx.rotate((3 * Math.PI) / 2);
      break;
  }
  ctx.drawImage(img, 0, 0);
  ctx.restore();

  return await new Promise((res) =>
    canvas.toBlob((b) => res(b || blob), "image/png", 0.92)
  );
}

/**
 * Recognize text once with optional PSM
 * @param {File|Blob|ArrayBuffer|Uint8Array|string} src
 * @param {number} [psm]
 * @returns {Promise<{text: string, confidence: number}>}
 */
async function recognizeOnce(src, psm) {
  try {
    const Tesseract = await getTesseract();
    const opts = psm ? { tessedit_pageseg_mode: psm } : {};
    const { data } = await Tesseract.recognize(src, "eng", opts);
    return {
      text: collapseWhitespace(data?.text ?? ""),
      confidence: data?.confidence ?? 0,
    };
  } catch {
    return { text: "", confidence: 0 };
  }
}

/**
 * Recognize with multiple variants:
 * - Angles: 0°, 90°, 180°, 270° (browser only for rotation)
 * - PSM: 6 (single block), 11 (sparse text)
 * Picks the text with the best score.
 * @param {File|Blob|ArrayBuffer|Uint8Array|string} file
 * @returns {Promise<RecognitionResult>}
 */
export async function recognizeBestText(file) {
  const angles = [0, 90, 180, 270];
  const psms = [6, 11];

  const variants = [];

  // base (original) with psms
  for (const psm of psms) variants.push({ src: file, label: `orig-psm${psm}`, psm });

  // rotated (if blob/file in browser)
  if (isBrowser && (file instanceof Blob || (typeof File !== "undefined" && file instanceof File))) {
    for (const ang of angles.filter((a) => a !== 0)) {
      const rotated = await rotateBlob90s(file, ang);
      for (const psm of psms) variants.push({ src: rotated, label: `rot${ang}-psm${psm}`, psm });
    }
  }

  if (variants.length === 0) variants.push({ src: file, label: "fallback" });

  let bestResult = { text: "", confidence: 0 };
  let bestScore = -Infinity;

  // sequential to avoid pegging CPU; change to Promise.allSettled if you prefer speed over thermals
  for (const v of variants) {
    const result = await recognizeOnce(v.src, v.psm);
    const s = scoreReceiptText(result.text);
    if (s > bestScore) {
      bestScore = s;
      bestResult = result;
    }
  }
  return bestResult;
}
