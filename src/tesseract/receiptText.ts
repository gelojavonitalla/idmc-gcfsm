// src/features/enrollment/services/receiptText.ts

// Lazy loader (creates a separate "ocr" chunk thanks to your manualChunks rule)
let _tess: Promise<unknown> | null = null;
async function getTesseract() {
  if (!_tess) _tess = import("tesseract.js").then((m: unknown) => m.default ?? m);
  return _tess;
}

export async function recognizeReceiptText(
  input: File | Blob | ArrayBuffer | Uint8Array | string
): Promise<string> {
  if (typeof input === "string") return input.trim();
  const Tesseract = await getTesseract();
  const { data } = await Tesseract.recognize(input, "eng", { logger: () => {} });
  return (data?.text ?? "").replace(/\s+/g, " ").trim();
}

const isBrowser = typeof window !== "undefined";

function collapseWhitespace(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

// Heuristic: reward money/date/ref signals + digit density; penalize super-short
function scoreReceiptText(t: string): number {
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

// Rotate an image blob using canvas (browser only)
async function rotateBlob90s(blob: Blob, angle: 0 | 90 | 180 | 270): Promise<Blob> {
  if (!isBrowser || angle === 0) return blob;

  const img = await new Promise<HTMLImageElement>((res, rej) => {
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
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  (ctx as unknown).filter = "contrast(1.15)";

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

  return await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b || blob), "image/png", 0.92)
  );
}

async function recognizeOnce(
  src: File | Blob | ArrayBuffer | Uint8Array | string,
  psm?: number
): Promise<string> {
  try {
    const Tesseract = await getTesseract();
    const opts = psm ? { tessedit_pageseg_mode: psm } : {};
    const { data } = await Tesseract.recognize(src, "eng", opts);
    return collapseWhitespace(data?.text ?? "");
  } catch {
    return "";
  }
}

/**
 * Recognize with multiple variants:
 * - Angles: 0°, 90°, 180°, 270° (browser only for rotation)
 * - PSM: 6 (single block), 11 (sparse text)
 * Picks the text with the best score.
 */
export async function recognizeBestText(
  file: File | Blob | ArrayBuffer | Uint8Array | string
): Promise<string> {
  const angles: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
  const psms = [6, 11];

  const variants: Array<{ src: unknown; label: string; psm?: number }> = [];

  // base (original) with psms
  for (const psm of psms) variants.push({ src: file, label: `orig-psm${psm}`, psm });

  // rotated (if blob/file in browser)
  if (isBrowser && (file instanceof Blob || (typeof File !== "undefined" && file instanceof File))) {
    for (const ang of angles.filter((a) => a !== 0)) {
      const rotated = await rotateBlob90s(file as Blob, ang);
      for (const psm of psms) variants.push({ src: rotated, label: `rot${ang}-psm${psm}`, psm });
    }
  }

  if (variants.length === 0) variants.push({ src: file, label: "fallback" });

  let bestText = "";
  let bestScore = -Infinity;

  // sequential to avoid pegging CPU; change to Promise.allSettled if you prefer speed over thermals
  for (const v of variants) {
    const txt = await recognizeOnce(v.src, v.psm);
    const s = scoreReceiptText(txt);
    if (s > bestScore) {
      bestScore = s;
      bestText = txt;
    }
  }
  return bestText;
}