// src/types/ocr.ts
export interface OcrSuggestResult {
  rawText: string;                 // Always keep the raw for auditing
  suggestedAmount: number | null;  // pesos
  suggestedRef: string | null;
  suggestedDateTime: string | null;// "YYYY-MM-DDTHH:mm" preferred for datetime-local
  suggestedBank: string | null;    // "BPI" | "BDO" | ...
}