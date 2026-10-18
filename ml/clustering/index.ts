import { inverseStandardize, standardizeFeatures } from "./preprocess";
import { calculateSilhouette, findOptimalK, runKMeans } from "./kmeans";
import { runPCA } from "./pca";
import type { EngineOutput, Matrix, OptimalKOutput } from "./types";

export * from "./preprocess";
export * from "./kmeans";
export * from "./pca";
export * from "./interpret";
export * from "./types";

/**
 * Engine clustering TypeScript: standardisasi -> K-Means -> silhouette -> PCA.
 * Input berupa matriks fitur asli (n × 5). Python service (ml/python) mengimplementasikan
 * kontrak yang sama dengan scikit-learn.
 */
export function runClusteringEngine(X: Matrix, k: number, seed = 42): EngineOutput {
  const { Z, mean, std } = standardizeFeatures(X);
  const km = runKMeans(Z, k, { seed });
  const pca = runPCA(Z, 2);
  return {
    labels: km.labels,
    centroids: km.centroids,
    centroidsOriginal: inverseStandardize(km.centroids, mean, std),
    distances: km.distances,
    inertia: km.inertia,
    iterations: km.iterations,
    silhouette: calculateSilhouette(Z, km.labels),
    scalerMean: mean,
    scalerStd: std,
    pca: {
      points: pca.points.map((p) => [p[0], p[1]] as [number, number]),
      explainedVarianceRatio: [pca.explainedVarianceRatio[0], pca.explainedVarianceRatio[1]],
    },
  };
}

export function evaluateKEngine(X: Matrix, kMin: number, kMax: number, seed = 42): OptimalKOutput {
  return findOptimalK(standardizeFeatures(X).Z, kMin, kMax, seed);
}
