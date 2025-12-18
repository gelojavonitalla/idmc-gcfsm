/**
 * Receipt suggestion service
 * Combines OCR with bank/cash parsing to suggest payment details
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
 * Process a receipt image and suggest payment details
 * @param {File|Blob|ArrayBuffer|Uint8Array|string} file
 * @returns {Promise<{rawText: string, bank: OcrSuggestResult, cash: OcrSuggestResult, winner: OcrSuggestResult, shouldManual: boolean}>}
 */
export async function suggestFromReceipt(file) {
  const raw = await recognizeReceiptText(file); // OCR once
  const bank = parseBankText(raw);              // text -> bank fields
  const cash = parseCashText(raw);              // text -> cash fields

  const winner = scoreSuggestion(bank) >= scoreSuggestion(cash) ? bank : cash;

  const hasAny =
    !!(bank.suggestedAmount || bank.suggestedRef || bank.suggestedDateTime) ||
    !!(cash.suggestedAmount || cash.suggestedRef || cash.suggestedDateTime);

  const shouldManual = scoreReceiptText(raw) < 30 || !hasAny;

  return { rawText: raw, bank, cash, winner, shouldManual };
}
