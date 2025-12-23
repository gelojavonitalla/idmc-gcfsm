/**
 * Receipt OCR utilities
 *
 * @module tesseract
 *
 * @example
 * // Recommended: Use hybrid OCR (Tesseract + Cloud Vision fallback)
 * import { processReceipt } from '@/tesseract';
 * const result = await processReceipt(file);
 *
 * @example
 * // Direct Tesseract usage (client-side only)
 * import { suggestFromReceipt } from '@/tesseract';
 * const result = await suggestFromReceipt(file);
 *
 * @example
 * // Direct Cloud Vision usage
 * import { callCloudVision } from '@/tesseract';
 * const result = await callCloudVision(file);
 */

// Main entry point - hybrid OCR with automatic fallback
export { processReceipt, CONFIDENCE_THRESHOLD } from './hybridOcr';

// Tesseract-only utilities
export { suggestFromReceipt, suggestFromText } from './receiptSuggest';
export { recognizeReceiptText, recognizeBestText } from './receiptText';
export { parseBankText } from './ocrBank';
export { parseCashText } from './ocrCash';

// Cloud Vision utility
export { callCloudVision } from './cloudVision';
