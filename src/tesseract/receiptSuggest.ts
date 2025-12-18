// src/features/enrollment/services/receiptSuggest.ts
import { recognizeReceiptText, /* your file->text */ } from "./receiptText";
import type { OcrSuggestResult } from "@shared/types";
import { parseBankText } from "./ocrBank";
import { parseCashText } from "./ocrCash";

// light signal of “is this text worth trusting?”
const scoreReceiptText = (t: string) => {
    if (!t) return 0;
    const digits = (t.match(/\d/g) || []).length;
    const money = (t.match(/(?:₱|\bPH(?:P|p)\b)/g) || []).length;
    const keys = (t.match(/\b(amount|total|ref|reference|txn|transaction|official\s+receipt|invoice|date|time)\b/gi) || []).length;
    return digits + money * 5 + keys * 4;
};

const scoreSuggestion = (s: OcrSuggestResult) =>
    (s.suggestedAmount ? 3 : 0) +
    (s.suggestedRef ? 3 : 0) +
    (s.suggestedDateTime ? 1 : 0) +
    (s.suggestedBank ? 1 : 0);

export async function suggestFromReceipt(
    file: File | Blob | ArrayBuffer | Uint8Array | string
) {
    const raw = await recognizeReceiptText(file); // OCR once
    const bank = parseBankText(raw);           // text -> bank fields
    const cash = parseCashText(raw);           // text -> cash fields

    const winner = scoreSuggestion(bank) >= scoreSuggestion(cash) ? bank : cash;

    const hasAny =
        !!(bank.suggestedAmount || bank.suggestedRef || bank.suggestedDateTime) ||
        !!(cash.suggestedAmount || cash.suggestedRef || cash.suggestedDateTime);

    const shouldManual = scoreReceiptText(raw) < 30 || !hasAny;

    return { rawText: raw, bank, cash, winner, shouldManual };
}