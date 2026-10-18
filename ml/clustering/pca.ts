import type { Matrix } from "./types";

/** Dekomposisi eigen matriks simetris dengan metode Jacobi (cukup untuk matriks kovarians 5×5). */
function jacobiEigen(A: Matrix, maxSweeps = 100): { values: number[]; vectors: Matrix } {
  const n = A.length;
  const a = A.map((r) => [...r]);
  const v: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] ** 2;
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-15) continue;
        // Rotasi Givens yang membuat a[p][q] = 0
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k][p];
          const akq = a[k][q];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k];
          const aqk = a[q][k];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k][p];
          const vkq = v[k][q];
          v[k][p] = c * vkp - s * vkq;
          v[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }
  return { values: a.map((r, i) => r[i]), vectors: v };
}

/** PCA: proyeksi data terstandardisasi ke n komponen utama (default 2 untuk scatter plot). */
export function runPCA(Z: Matrix, nComponents = 2) {
  const n = Z.length;
  const d = Z[0].length;
  const mean = Array.from({ length: d }, (_, j) => Z.reduce((s, r) => s + r[j], 0) / n);
  const C = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_, j) =>
      Z.reduce((s, r) => s + (r[i] - mean[i]) * (r[j] - mean[j]), 0) / Math.max(n - 1, 1),
    ),
  );
  const { values, vectors } = jacobiEigen(C);
  const order = values.map((_, i) => i).sort((x, y) => values[y] - values[x]);
  const totalVar = values.reduce((s, v) => s + Math.max(v, 0), 0) || 1;

  const components = order.slice(0, nComponents).map((idx) => {
    const comp = vectors.map((row) => row[idx]);
    // Normalisasi tanda: loading absolut terbesar dibuat positif agar hasil deterministik
    const maxAbs = comp.reduce((m, v) => (Math.abs(v) > Math.abs(m) ? v : m), 0);
    return maxAbs < 0 ? comp.map((v) => -v) : comp;
  });
  const points = Z.map((r) =>
    components.map((comp) => comp.reduce((s, w, j) => s + w * (r[j] - mean[j]), 0)),
  );
  const explainedVarianceRatio = order
    .slice(0, nComponents)
    .map((idx) => Math.max(values[idx], 0) / totalVar);
  return { points, components, explainedVarianceRatio };
}
