/**
 * Receipt suggestion service
 * Combines OCR with bank/cash parsing to suggest payment details
 * Supports hybrid approach: Tesseract first, Cloud Vision fallback if low confidence
 *
 * @module tesseract/receiptSuggest
 */

import { recognizeReceiptText } from "./receiptText";
import { parseBankText } from "./ocrBank";
import { parseCashText } from "./ocrCash";

/**
 * @typedef {Object} OcrSuggestResult
 * @property {string} rawText
 * @property {number|null} suggestedAmount
 * @property {string|null} suggestedRef
 * @property {string|null} suggestedDateTime
 * @property {string|null} suggestedBank
 */

/**
 * @typedef {Object} ReceiptSuggestion
 * @property {string} rawText - Raw OCR text
 * @property {number} confidence - Tesseract confidence (0-100)
 * @property {OcrSuggestResult} bank - Bank receipt parsing result
 * @property {OcrSuggestResult} cash - Cash receipt parsing result
 * @property {OcrSuggestResult} winner - Best parsing result
 * @property {boolean} shouldManual - Whether manual entry is recommended
 * @property {boolean} shouldFallback - Whether to fallback to Cloud Vision (confidence < threshold)
 */

/** Confidence threshold below which Cloud Vision fallback is recommended */
export const CONFIDENCE_THRESHOLD = 60;

/**
 * Light signal of "is this text worth trusting?"
 * @param {string} t
 * @returns {number}
 */
const scoreReceiptText = (t) => {
  if (!t) return 0;
  const digits = (t.match(/\d/g) || []).length;
  const money = (t.match(/(?:₱|\bPH(?:P|p)\b)/g) || []).length;
  const keys = (t.match(/\b(amount|total|ref|reference|txn|transaction|official\s+receipt|invoice|date|time)\b/gi) || []).length;
  return digits + money * 5 + keys * 4;
};

/**
 * Score a suggestion result
 * @param {OcrSuggestResult} s
 * @returns {number}
 */
const scoreSuggestion = (s) =>
  (s.suggestedAmount ? 3 : 0) +
  (s.suggestedRef ? 3 : 0) +
  (s.suggestedDateTime ? 1 : 0) +
  (s.suggestedBank ? 1 : 0);

/**
 * Process a receipt image and suggest payment details using Tesseract
 * Returns confidence level so caller can decide to fallback to Cloud Vision
 *
 * @param {File|Blob|ArrayBuffer|Uint8Array|string} file
 * @param {number} [confidenceThreshold=CONFIDENCE_THRESHOLD] - Threshold for fallback recommendation
 * @returns {Promise<ReceiptSuggestion>}
 *
 * @example
 * const result = await suggestFromReceipt(file);
 * if (result.shouldFallback) {
 *   // Call Cloud Vision API
 *   const visionText = await callCloudVision(file);
 *   // Re-parse with better text
 *   const betterResult = suggestFromText(visionText);
 * }
 */
export async function suggestFromReceipt(file, confidenceThreshold = CONFIDENCE_THRESHOLD) {
  const { text: raw, confidence } = await recognizeReceiptText(file);
  const bank = parseBankText(raw);
  const cash = parseCashText(raw);

  const winner = scoreSuggestion(bank) >= scoreSuggestion(cash) ? bank : cash;

  const hasAny =
    !!(bank.suggestedAmount || bank.suggestedRef || bank.suggestedDateTime) ||
    !!(cash.suggestedAmount || cash.suggestedRef || cash.suggestedDateTime);

  const shouldManual = scoreReceiptText(raw) < 30 || !hasAny;
  const shouldFallback = confidence < confidenceThreshold;

  return {
    rawText: raw,
    confidence,
    bank,
    cash,
    winner,
    shouldManual,
    shouldFallback,
  };
}

/**
 * Parse already-extracted text (e.g., from Cloud Vision)
 * Use this when you have text from an external OCR source
 *
 * @param {string} text - Pre-extracted text from Cloud Vision or other source
 * @returns {ReceiptSuggestion}
 */
export function suggestFromText(text) {
  const raw = (text ?? "").replace(/\s+/g, " ").trim();
  const bank = parseBankText(raw);
  const cash = parseCashText(raw);

  const winner = scoreSuggestion(bank) >= scoreSuggestion(cash) ? bank : cash;

  const hasAny =
    !!(bank.suggestedAmount || bank.suggestedRef || bank.suggestedDateTime) ||
    !!(cash.suggestedAmount || cash.suggestedRef || cash.suggestedDateTime);

  const shouldManual = scoreReceiptText(raw) < 30 || !hasAny;

  return {
    rawText: raw,
    confidence: 100, // External source assumed high confidence
    bank,
    cash,
    winner,
    shouldManual,
    shouldFallback: false,
  };
}
