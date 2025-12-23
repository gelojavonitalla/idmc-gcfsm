/**
 * Hybrid OCR service
 * Uses Tesseract.js first, falls back to Cloud Vision if confidence is low
 *
 * @module tesseract/hybridOcr
 */

import { suggestFromReceipt, suggestFromText, CONFIDENCE_THRESHOLD } from './receiptSuggest';
import { callCloudVision } from './cloudVision';

/**
 * @typedef {Object} HybridOcrResult
 * @property {string} rawText - Raw OCR text
 * @property {number} confidence - Final confidence (0-100)
 * @property {string} source - 'tesseract' or 'cloud-vision'
 * @property {Object} winner - Best parsed result with suggestedAmount, suggestedRef, etc.
 * @property {Object} bank - Bank parsing result
 * @property {Object} cash - Cash parsing result
 * @property {boolean} shouldManual - Whether manual entry is recommended
 */

/**
 * Process a receipt image using hybrid OCR approach
 * 1. Try Tesseract.js first (free, client-side)
 * 2. If confidence < threshold, fallback to Cloud Vision API
 *
 * @param {File|Blob} file - Image file to process
 * @param {Object} [options] - Options
 * @param {number} [options.confidenceThreshold=60] - Threshold for Cloud Vision fallback
 * @param {boolean} [options.forceCloudVision=false] - Skip Tesseract, use Cloud Vision directly
 * @returns {Promise<HybridOcrResult>}
 *
 * @example
 * const result = await processReceipt(file);
 * if (result.winner.suggestedAmount) {
 *   console.log(`Amount: PHP ${result.winner.suggestedAmount}`);
 *   console.log(`Source: ${result.source}`);
 * }
 */
export async function processReceipt(file, options = {}) {
  const {
    confidenceThreshold = CONFIDENCE_THRESHOLD,
    forceCloudVision = false,
  } = options;

  // Skip Tesseract if forced to use Cloud Vision
  if (forceCloudVision) {
    return await processWithCloudVision(file);
  }

  // Try Tesseract first
  const tesseractResult = await suggestFromReceipt(file, confidenceThreshold);

  // If confidence is good enough, return Tesseract result
  if (!tesseractResult.shouldFallback) {
    return {
      ...tesseractResult,
      source: 'tesseract',
    };
  }

  // Fallback to Cloud Vision when confidence is below threshold
  try {
    return await processWithCloudVision(file);
  } catch (error) {
    // If Cloud Vision fails, return Tesseract result anyway
    console.warn('Cloud Vision fallback failed, using Tesseract result:', error);
    return {
      ...tesseractResult,
      source: 'tesseract',
      fallbackError: error.message,
    };
  }
}

/**
 * Process receipt using Cloud Vision API
 * @param {File|Blob} file
 * @returns {Promise<HybridOcrResult>}
 */
async function processWithCloudVision(file) {
  const visionResult = await callCloudVision(file);
  const parsed = suggestFromText(visionResult.text);

  return {
    ...parsed,
    confidence: visionResult.confidence,
    source: 'cloud-vision',
    wordCount: visionResult.wordCount,
  };
}

/**
 * Re-export confidence threshold for external use
 */
export { CONFIDENCE_THRESHOLD };
