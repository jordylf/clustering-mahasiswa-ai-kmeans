import { prisma } from "@/lib/db";
import { K_RANGE } from "@/lib/constants";
import {
  calculateDependencyScore,
  evaluateKEngine,
  featuresToVector,
  interpretCluster,
  mapClusterLabels,
  runClusteringEngine,
  squaredDistance,
  vectorToFeatures,
  type EngineOutput,
  type Features,
  type Matrix,
  type OptimalKOutput,
  type PreprocessReport,
} from "@/ml/clustering";
import { loadFeatureDataset } from "@/services/dataset.service";
import type { CentroidInfo } from "@/types";

const SEED = 42;

/** Bila ML_API_URL diisi, proses ML dijalankan oleh Python service (FastAPI + scikit-learn). */
async function callPythonService<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${process.env.ML_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Python ML service error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

const isPythonEngine = () => Boolean(process.env.ML_API_URL);

async function clusterEngine(X: Matrix, k: number): Promise<EngineOutput> {
  return isPythonEngine()
    ? callPythonService<EngineOutput>("/cluster", { features: X, k, seed: SEED })
    : runClusteringEngine(X, k, SEED);
}

export async function evaluateOptimalK(): Promise<(OptimalKOutput & { n: number }) | null> {
  const { rows } = await loadFeatureDataset();
  if (rows.length < K_RANGE.max + 1) return null;
  const X = rows.map((r) => featuresToVector(r.features));
  const out = isPythonEngine()
    ? await callPythonService<OptimalKOutput>("/evaluate", { features: X, k_min: K_RANGE.min, k_max: K_RANGE.max, seed: SEED })
    : evaluateKEngine(X, K_RANGE.min, K_RANGE.max, SEED);
  return { ...out, n: rows.length };
}

export async function runClustering(k: number) {
  const { rows, report } = await loadFeatureDataset();
  if (rows.length < Math.max(k + 1, 10)) {
    throw new Error(`Data belum cukup: minimal ${Math.max(k + 1, 10)} responden valid untuk K = ${k}.`);
  }
  const X = rows.map((r) => featuresToVector(r.features));
  const out = await clusterEngine(X, k);

  const centroidFeatures = out.centroidsOriginal.map(vectorToFeatures);
  const labels = mapClusterLabels(centroidFeatures);
  const centroids: CentroidInfo[] = labels
    .map((l) => ({
      ...l,
      features: centroidFeatures[l.cluster],
      size: out.labels.filter((c) => c === l.cluster).length,
      interpretation: interpretCluster(centroidFeatures[l.cluster]),
    }))
    .sort((a, b) => a.rank - b.rank);

  return prisma.$transaction(async (tx) => {
    await tx.clusteringRun.updateMany({ where: { isActive: true }, data: { isActive: false } });
    const run = await tx.clusteringRun.create({
      data: {
        numberOfClusters: k,
        silhouetteScore: out.silhouette,
        inertia: out.inertia,
        iterations: out.iterations,
        respondentCount: rows.length,
        engine: isPythonEngine() ? "python" : "typescript",
        centroids,
        clusterLabels: labels,
        scalerMean: out.scalerMean,
        scalerStd: out.scalerStd,
        // centroid terstandardisasi disimpan untuk prediksi responden baru
        pcaExplainedVariance: { ratio: out.pca.explainedVarianceRatio, standardizedCentroids: out.centroids },
        preprocessing: report satisfies PreprocessReport,
      },
    });
    await tx.clusteringResult.createMany({
      data: rows.map((r, i) => ({
        respondentId: r.id,
        clusteringRunId: run.id,
        cluster: out.labels[i],
        label: labels[out.labels[i]].label,
        dependencyScore: calculateDependencyScore(r.features),
        distanceToCentroid: out.distances[i],
        features: r.features,
        pcaX: out.pca.points[i][0],
        pcaY: out.pca.points[i][1],
      })),
    });
    return run;
  }, { timeout: 30_000 });
}

export type ActiveRun = NonNullable<Awaited<ReturnType<typeof getActiveRun>>>;

export async function getActiveRun() {
  const run = await prisma.clusteringRun.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  if (!run) return null;
  const pca = run.pcaExplainedVariance as { ratio: [number, number]; standardizedCentroids: Matrix };
  return {
    ...run,
    centroids: run.centroids as unknown as CentroidInfo[],
    preprocessing: run.preprocessing as unknown as PreprocessReport,
    scalerMean: run.scalerMean as number[],
    scalerStd: run.scalerStd as number[],
    explainedVariance: pca.ratio,
    standardizedCentroids: pca.standardizedCentroids,
  };
}

export async function getActiveRunResults(runId: string) {
  return prisma.clusteringResult.findMany({
    where: { clusteringRunId: runId },
    include: { respondent: { select: { respondentCode: true, university: true, studyProgram: true } } },
    orderBy: { respondent: { seq: "asc" } },
  });
}

export async function listRuns() {
  return prisma.clusteringRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, numberOfClusters: true, silhouetteScore: true, inertia: true, respondentCount: true, engine: true, isActive: true, createdAt: true },
  });
}

/**
 * Prediksi kategori responden baru terhadap model aktif (centroid terdekat
 * dalam ruang terstandardisasi). Tidak mengubah hasil clustering tersimpan.
 */
export async function predictCategory(features: Features) {
  const run = await getActiveRun();
  const dependencyScore = calculateDependencyScore(features);
  if (!run) return { label: null, dependencyScore };
  const z = featuresToVector(features).map((v, j) => (v - run.scalerMean[j]) / run.scalerStd[j]);
  let best = 0;
  run.standardizedCentroids.forEach((c, j) => {
    if (squaredDistance(z, c) < squaredDistance(z, run.standardizedCentroids[best])) best = j;
  });
  const info = run.centroids.find((c) => c.cluster === best);
  return { label: info?.label ?? null, dependencyScore };
}
