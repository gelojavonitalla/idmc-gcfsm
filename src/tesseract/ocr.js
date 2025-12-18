/**
 * OCR result type for receipt scanning
 * @typedef {Object} OcrSuggestResult
 * @property {string} rawText - Always keep the raw for auditing
 * @property {number|null} suggestedAmount - Amount in pesos
 * @property {string|null} suggestedRef - Reference number
 * @property {string|null} suggestedDateTime - "YYYY-MM-DDTHH:mm" preferred for datetime-local
 * @property {string|null} suggestedBank - "BPI" | "BDO" | ...
 */

export {};
