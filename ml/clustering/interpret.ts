import { FEATURE_KEYS, type FeatureKey } from "@/lib/constants";
import type { Features } from "./types";

/**
 * Bobot dependency score. Verification dibalik (reverse scoring): semakin sering
 * memverifikasi, semakin kecil ketergantungan. Total bobot = 1.
 */
export const DEPENDENCY_WEIGHTS: Record<FeatureKey, number> = {
  frequency_score: 0.25,
  task_dependency_score: 0.3,
  academic_usage_score: 0.15,
  trust_score: 0.15,
  verification_score: 0.15,
};

/** Normalisasi min-max skala Likert 1..5 -> 0..1 */
const normalize = (v: number) => Math.min(Math.max((v - 1) / 4, 0), 1);

/**
 * Dependency Score (0–100), hanya alat bantu interpretasi, bukan pengganti K-Means:
 * DS = 100 × (0.25·F + 0.30·T + 0.15·A + 0.15·Tr + 0.15·(1 − V))
 * dengan F, T, A, Tr, V = nilai fitur yang dinormalisasi ke 0..1.
 */
export function calculateDependencyScore(f: Features): number {
  let score = 0;
  for (const key of FEATURE_KEYS) {
    const n = normalize(f[key]);
    score += DEPENDENCY_WEIGHTS[key] * (key === "verification_score" ? 1 - n : n);
  }
  return Math.round(score * 10000) / 100;
}

const LEVEL_NAMES: Record<number, string[]> = {
  2: ["Rendah", "Tinggi"],
  3: ["Rendah", "Sedang", "Tinggi"],
  4: ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"],
  5: ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"],
  6: ["Sangat Rendah", "Rendah", "Sedang", "Cukup Tinggi", "Tinggi", "Sangat Tinggi"],
};

export type ClusterLabel = {
  /** nomor cluster asli dari K-Means */
  cluster: number;
  /** 0 = ketergantungan paling rendah */
  rank: number;
  label: string;
  dependencyScore: number;
};

/**
 * Mapping nomor cluster -> label. Centroid diurutkan berdasarkan dependency score,
 * sehingga label tidak bergantung pada nomor cluster yang acak dari K-Means.
 */
export function mapClusterLabels(centroidFeatures: Features[]): ClusterLabel[] {
  const k = centroidFeatures.length;
  const names = LEVEL_NAMES[k] ?? Array.from({ length: k }, (_, i) => `Level ${i + 1}`);
  return centroidFeatures
    .map((f, cluster) => ({ cluster, dependencyScore: calculateDependencyScore(f) }))
    .sort((a, b) => a.dependencyScore - b.dependencyScore)
    .map((c, rank) => ({ ...c, rank, label: `Ketergantungan ${names[rank]}` }))
    .sort((a, b) => a.cluster - b.cluster);
}

const level = (v: number) => (v < 2.5 ? "rendah" : v < 3.5 ? "sedang" : "tinggi");
const fmt = (v: number) => v.toFixed(2).replace(".", ",");

/** Interpretasi otomatis berdasarkan nilai centroid aktual (skala 1..5). */
export function interpretCluster(c: Features): string {
  const freq = level(c.frequency_score);
  const task = level(c.task_dependency_score);
  const ver = level(c.verification_score);

  const taskSentence = {
    tinggi: "serta cenderung bergantung pada AI dalam menyelesaikan aktivitas akademik",
    sedang: "dan menggunakan AI secara rutin, tetapi masih melakukan proses akademik secara mandiri",
    rendah: "dan menggunakan AI hanya sebagai alat pendukung, bukan pengganti proses akademik",
  }[task];
  const verSentence = {
    tinggi: `Kebiasaan memverifikasi jawaban AI tergolong tinggi (${fmt(c.verification_score)}), menunjukkan sikap kritis terhadap informasi.`,
    sedang: `Kebiasaan memverifikasi jawaban AI berada pada tingkat sedang (${fmt(c.verification_score)}).`,
    rendah: `Kebiasaan memverifikasi jawaban AI rendah (${fmt(c.verification_score)}), sehingga jawaban AI cenderung diterima tanpa pengecekan.`,
  }[ver];

  return (
    `Mahasiswa pada kelompok ini memiliki frekuensi penggunaan Generative AI yang ${freq} (${fmt(c.frequency_score)}) ${taskSentence} ` +
    `(ketergantungan tugas ${fmt(c.task_dependency_score)}). ` +
    `Pemanfaatan akademik ${level(c.academic_usage_score)} (${fmt(c.academic_usage_score)}) dan kepercayaan terhadap AI ${level(c.trust_score)} (${fmt(c.trust_score)}). ` +
    verSentence
  );
}

/** Kalimat interpretasi untuk satu responden. */
export const interpretRespondent = (label: string) =>
  `Tingkat ketergantungan Anda terhadap Generative AI berada pada kategori ${label.replace("Ketergantungan ", "")}.`;
