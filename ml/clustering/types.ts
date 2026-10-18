import type { FeatureKey, QuestionCategory } from "@/lib/constants";

export type Matrix = number[][];
export type Features = Record<FeatureKey, number>;

export type RawRecord = {
  id: string;
  /** kode butir (X1..X20) -> nilai Likert; null/undefined = missing */
  answers: Record<string, number | null | undefined>;
};

export type QuestionMeta = { code: string; category: QuestionCategory; isReversed: boolean };

export type CleanRecord = { id: string; answers: Record<string, number> };

export type PreprocessReport = {
  totalRecords: number;
  droppedRecords: number;
  invalidValues: number;
  imputedValues: number;
};

/** Kontrak engine clustering. Engine TypeScript dan Python service mengembalikan bentuk yang sama. */
export type EngineOutput = {
  labels: number[];
  /** centroid dalam ruang terstandardisasi */
  centroids: Matrix;
  /** centroid dalam skala fitur asli (1..5) */
  centroidsOriginal: Matrix;
  distances: number[];
  inertia: number;
  iterations: number;
  silhouette: number;
  scalerMean: number[];
  scalerStd: number[];
  pca: { points: [number, number][]; explainedVarianceRatio: [number, number] };
};

export type KEvaluation = { k: number; inertia: number; silhouette: number };
export type OptimalKOutput = { results: KEvaluation[]; recommendedK: number };
