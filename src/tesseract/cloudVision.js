/**
 * Cloud Vision OCR fallback service
 * Calls Firebase Cloud Function when Tesseract confidence is low
 *
 * @module tesseract/cloudVision
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

/**
 * Convert a File/Blob to base64 string
 * @param {File|Blob} file
 * @returns {Promise<string>} Base64 encoded string (without data URL prefix)
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Call Cloud Vision API via Firebase Cloud Function
 *
 * @param {File|Blob} file - Image file to process
 * @returns {Promise<{text: string, confidence: number, wordCount: number}>}
 *
 * @example
 * const result = await callCloudVision(imageFile);
 * console.log(result.text); // Extracted text
 */
export async function callCloudVision(file) {
  const base64 = await fileToBase64(file);
  const ocrReceipt = httpsCallable(functions, 'ocrReceipt');
  const { data } = await ocrReceipt({ image: base64 });
  return data;
}
