import type { Features } from "@/ml/clustering/types";

export type { Features };

export type ClusterInfo = {
  cluster: number;
  rank: number;
  label: string;
};

export type CentroidInfo = ClusterInfo & {
  features: Features;
  size: number;
  dependencyScore: number;
  interpretation: string;
};

export type RespondentRow = {
  id: string;
  code: string;
  name: string | null;
  age: number;
  gender: string;
  university: string;
  faculty: string;
  studyProgram: string;
  semester: number;
  aiUsageFrequency: string;
  platforms: string[];
  purposes: string[];
  createdAt: Date;
  /** null jika responden dibuang saat data cleaning (> 50% jawaban kosong) */
  features: Features | null;
  dependencyScore: number | null;
  cluster: (ClusterInfo & { distanceToCentroid: number }) | null;
};

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
