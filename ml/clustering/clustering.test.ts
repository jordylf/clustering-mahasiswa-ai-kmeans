// Self-check modul ML. Jalankan: npm run test:ml
import assert from "node:assert/strict";
import { QUESTIONS } from "@/lib/constants";
import { generateRespondents } from "@/prisma/seed-generator";
import {
  calculateDependencyScore,
  calculateFeatures,
  calculateSilhouette,
  evaluateKEngine,
  featuresToVector,
  mapClusterLabels,
  preprocessData,
  runClusteringEngine,
  runKMeans,
  runPCA,
  standardizeFeatures,
  vectorToFeatures,
} from "./index";

const questions = QUESTIONS.map((q) => ({ ...q, isReversed: !!q.isReversed }));

// 1. Preprocessing: nilai invalid -> missing, imputasi median, buang baris > 50% kosong
{
  const { records, report } = preprocessData(
    [
      { id: "a", answers: { X1: 5, X2: 9 } },
      { id: "b", answers: { X1: 1, X2: 3 } },
      { id: "c", answers: {} },
    ],
    questions.slice(0, 2),
  );
  assert.equal(report.invalidValues, 1);
  assert.equal(report.droppedRecords, 1);
  assert.equal(records[0].answers.X2, 3); // median kolom X2 = 3
}

// 2. StandardScaler: mean 0, std 1
{
  const { Z } = standardizeFeatures([[1, 10], [2, 20], [3, 30]]);
  assert.ok(Math.abs(Z.reduce((s, r) => s + r[0], 0)) < 1e-9);
  assert.ok(Math.abs(Z.reduce((s, r) => s + r[1] ** 2, 0) / 3 - 1) < 1e-9);
}

// 3. K-Means + silhouette pada dua kelompok yang jelas terpisah
{
  const X = [[0, 0], [0, 1], [1, 0], [10, 10], [10, 11], [11, 10]];
  const km = runKMeans(X, 2);
  assert.equal(km.labels[0], km.labels[2]);
  assert.notEqual(km.labels[0], km.labels[3]);
  assert.ok(calculateSilhouette(X, km.labels) > 0.9);
}

// 4. PCA: data pada satu garis -> komponen 1 menjelaskan ~100% varians
{
  const { explainedVarianceRatio } = runPCA([[1, 2], [2, 4], [3, 6], [4, 8]]);
  assert.ok(explainedVarianceRatio[0] > 0.999);
}

// 5. Dependency score dan mapping label tidak bergantung nomor cluster
{
  const high = vectorToFeatures([5, 5, 5, 1, 5]);
  const low = vectorToFeatures([1, 1, 1, 5, 1]);
  assert.equal(calculateDependencyScore(high), 100);
  assert.equal(calculateDependencyScore(low), 0);
  const labels = mapClusterLabels([high, low]);
  assert.equal(labels[0].label, "Ketergantungan Tinggi");
  assert.equal(labels[1].label, "Ketergantungan Rendah");
}

// 6. Pipeline lengkap pada data seed: K optimal = 3 dan cluster terpisah baik
{
  const data = generateRespondents(150);
  const { records } = preprocessData(
    data.map((d, i) => ({ id: String(i), answers: d.answers })),
    questions,
  );
  const X = records.map((r) => featuresToVector(calculateFeatures(r.answers, questions)));
  const evaluation = evaluateKEngine(X, 2, 6);
  console.table(evaluation.results);
  assert.equal(evaluation.recommendedK, 3);
  const out = runClusteringEngine(X, 3);
  assert.ok(out.silhouette > 0.4, `silhouette ${out.silhouette}`);
  const mapped = mapClusterLabels(out.centroidsOriginal.map(vectorToFeatures));
  assert.deepEqual(mapped.map((m) => m.rank).sort(), [0, 1, 2]);
  console.log("silhouette k=3:", out.silhouette.toFixed(4), "iterasi:", out.iterations);
}

console.log("Semua self-check ML lulus ✔");
