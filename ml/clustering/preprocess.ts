import { FEATURE_KEYS, QUESTION_CATEGORIES } from "@/lib/constants";
import type { CleanRecord, Features, Matrix, PreprocessReport, QuestionMeta, RawRecord } from "./types";

const isValidLikert = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;

function median(values: number[]): number {
  if (values.length === 0) return 3; // titik netral skala Likert
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Data cleaning + penanganan missing value:
 * 1. Nilai di luar skala 1..5 dianggap tidak valid (diperlakukan sebagai missing).
 * 2. Responden dengan > 50% jawaban missing dibuang.
 * 3. Missing value sisanya diisi median butir tersebut (imputasi median).
 */
export function preprocessData(
  records: RawRecord[],
  questions: QuestionMeta[],
): { records: CleanRecord[]; report: PreprocessReport } {
  let invalidValues = 0;
  const normalized = records.map((r) => {
    const answers: Record<string, number | null> = {};
    for (const q of questions) {
      const v = r.answers[q.code];
      if (v === null || v === undefined) answers[q.code] = null;
      else if (isValidLikert(v)) answers[q.code] = v;
      else {
        invalidValues++;
        answers[q.code] = null;
      }
    }
    return { id: r.id, answers };
  });

  const kept = normalized.filter(
    (r) => Object.values(r.answers).filter((v) => v === null).length <= questions.length / 2,
  );

  const medians = Object.fromEntries(
    questions.map((q) => [
      q.code,
      median(kept.map((r) => r.answers[q.code]).filter((v): v is number => v !== null)),
    ]),
  );

  let imputedValues = 0;
  const clean = kept.map((r) => {
    const answers: Record<string, number> = {};
    for (const q of questions) {
      const v = r.answers[q.code];
      if (v === null) imputedValues++;
      answers[q.code] = v ?? medians[q.code];
    }
    return { id: r.id, answers };
  });

  return {
    records: clean,
    report: {
      totalRecords: records.length,
      droppedRecords: records.length - kept.length,
      invalidValues,
      imputedValues,
    },
  };
}

/** Feature aggregation: rata-rata butir per dimensi (skala 1..5). */
export function calculateFeatures(answers: Record<string, number>, questions: QuestionMeta[]): Features {
  const sums = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as Features;
  const counts = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as Features;
  for (const q of questions) {
    const v = answers[q.code];
    if (v === undefined) continue;
    const key = QUESTION_CATEGORIES[q.category].feature;
    sums[key] += v;
    counts[key] += 1;
  }
  const out = {} as Features;
  for (const k of FEATURE_KEYS) out[k] = counts[k] ? sums[k] / counts[k] : 3;
  return out;
}

export const featuresToVector = (f: Features): number[] => FEATURE_KEYS.map((k) => f[k]);
export const vectorToFeatures = (v: number[]): Features =>
  Object.fromEntries(FEATURE_KEYS.map((k, i) => [k, v[i]])) as Features;

/** StandardScaler: z = (x - mean) / std (std populasi, sama seperti scikit-learn). */
export function standardizeFeatures(X: Matrix): { Z: Matrix; mean: number[]; std: number[] } {
  const n = X.length;
  const d = X[0]?.length ?? 0;
  const mean = Array.from({ length: d }, (_, j) => X.reduce((s, r) => s + r[j], 0) / n);
  const std = Array.from({ length: d }, (_, j) => {
    const sd = Math.sqrt(X.reduce((s, r) => s + (r[j] - mean[j]) ** 2, 0) / n);
    return sd === 0 ? 1 : sd;
  });
  return { Z: X.map((r) => r.map((v, j) => (v - mean[j]) / std[j])), mean, std };
}

export const inverseStandardize = (Z: Matrix, mean: number[], std: number[]): Matrix =>
  Z.map((r) => r.map((v, j) => v * std[j] + mean[j]));
