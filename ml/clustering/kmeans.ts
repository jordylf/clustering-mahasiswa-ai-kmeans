import type { Matrix, OptimalKOutput } from "./types";

/** PRNG deterministik (mulberry32) agar hasil clustering dapat direproduksi. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const squaredDistance = (a: number[], b: number[]) =>
  a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

/** Inisialisasi k-means++: centroid berikutnya dipilih dengan peluang sebanding jarak² ke centroid terdekat. */
function initKMeansPlusPlus(X: Matrix, k: number, rand: () => number): Matrix {
  const centroids: Matrix = [X[Math.floor(rand() * X.length)]];
  const d2 = X.map((x) => squaredDistance(x, centroids[0]));
  while (centroids.length < k) {
    const total = d2.reduce((s, v) => s + v, 0);
    let r = rand() * total;
    let idx = 0;
    while (idx < X.length - 1 && (r -= d2[idx]) > 0) idx++;
    centroids.push(X[idx]);
    X.forEach((x, i) => (d2[i] = Math.min(d2[i], squaredDistance(x, X[idx]))));
  }
  return centroids.map((c) => [...c]);
}

export type KMeansOutput = {
  labels: number[];
  centroids: Matrix;
  inertia: number;
  iterations: number;
  distances: number[];
};

function lloyd(X: Matrix, init: Matrix, maxIter: number, tol: number): KMeansOutput {
  let centroids = init;
  let labels = new Array<number>(X.length).fill(0);
  let iterations = 0;

  for (let it = 1; it <= maxIter; it++) {
    iterations = it;
    // Assignment step: tiap titik masuk ke centroid terdekat
    labels = X.map((x) => {
      let best = 0;
      let bestD = Infinity;
      centroids.forEach((c, j) => {
        const d = squaredDistance(x, c);
        if (d < bestD) [bestD, best] = [d, j];
      });
      return best;
    });
    // Update step: centroid = rata-rata anggota (cluster kosong mempertahankan centroid lama)
    const next = centroids.map((c, j) => {
      const members = X.filter((_, i) => labels[i] === j);
      if (members.length === 0) return c;
      return c.map((_, d) => members.reduce((s, m) => s + m[d], 0) / members.length);
    });
    const shift = next.reduce((s, c, j) => s + squaredDistance(c, centroids[j]), 0);
    centroids = next;
    if (shift <= tol) break;
  }

  // Assignment akhir terhadap centroid yang sudah konvergen
  labels = X.map((x) => {
    let best = 0;
    centroids.forEach((c, j) => {
      if (squaredDistance(x, c) < squaredDistance(x, centroids[best])) best = j;
    });
    return best;
  });
  const distances = X.map((x, i) => Math.sqrt(squaredDistance(x, centroids[labels[i]])));
  const inertia = distances.reduce((s, d) => s + d * d, 0);
  return { labels, centroids, inertia, iterations, distances };
}

/**
 * K-Means (Lloyd) dengan inisialisasi k-means++ dan beberapa kali restart (nInit);
 * hasil dengan inertia terkecil dipilih, sama seperti default scikit-learn.
 */
export function runKMeans(
  X: Matrix,
  k: number,
  { nInit = 10, maxIter = 300, tol = 1e-4, seed = 42 } = {},
): KMeansOutput {
  if (k < 1 || k > X.length) throw new Error(`k harus antara 1 dan jumlah data (${X.length}).`);
  const rand = createRng(seed);
  let best: KMeansOutput | null = null;
  for (let i = 0; i < nInit; i++) {
    const run = lloyd(X, initKMeansPlusPlus(X, k, rand), maxIter, tol);
    if (!best || run.inertia < best.inertia) best = run;
  }
  return best!;
}

/**
 * Silhouette Score rata-rata: s(i) = (b - a) / max(a, b)
 * a = jarak rata-rata ke anggota cluster sendiri, b = jarak rata-rata terkecil ke cluster lain.
 * ponytail: O(n²) jarak berpasangan; cukup untuk ribuan responden, pakai sampling bila puluhan ribu.
 */
export function calculateSilhouette(X: Matrix, labels: number[]): number {
  const k = Math.max(...labels) + 1;
  if (k < 2) return 0;
  const sizes = new Array<number>(k).fill(0);
  labels.forEach((l) => sizes[l]++);

  let total = 0;
  for (let i = 0; i < X.length; i++) {
    const sums = new Array<number>(k).fill(0);
    for (let j = 0; j < X.length; j++) {
      if (i !== j) sums[labels[j]] += Math.sqrt(squaredDistance(X[i], X[j]));
    }
    const own = labels[i];
    if (sizes[own] <= 1) continue; // konvensi scikit-learn: s(i) = 0
    const a = sums[own] / (sizes[own] - 1);
    let b = Infinity;
    for (let c = 0; c < k; c++) if (c !== own && sizes[c] > 0) b = Math.min(b, sums[c] / sizes[c]);
    total += (b - a) / Math.max(a, b);
  }
  return total / X.length;
}

/** Elbow Method + Silhouette untuk k = kMin..kMax. Rekomendasi = silhouette tertinggi. */
export function findOptimalK(X: Matrix, kMin = 2, kMax = 6, seed = 42): OptimalKOutput {
  const results = [];
  for (let k = kMin; k <= Math.min(kMax, X.length - 1); k++) {
    const km = runKMeans(X, k, { seed });
    results.push({ k, inertia: km.inertia, silhouette: calculateSilhouette(X, km.labels) });
  }
  if (results.length === 0) throw new Error("Data terlalu sedikit untuk evaluasi jumlah cluster.");
  const recommendedK = results.reduce((best, r) => (r.silhouette > best.silhouette ? r : best)).k;
  return { results, recommendedK };
}
