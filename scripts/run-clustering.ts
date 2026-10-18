// Menjalankan pipeline clustering dari terminal: npm run ml:run -- 3
import { runClustering, evaluateOptimalK } from "../services/clustering.service";
import { prisma } from "../lib/db";

async function main() {
  const evaluation = await evaluateOptimalK();
  if (evaluation) {
    console.table(evaluation.results);
    console.log(`K yang direkomendasikan (Silhouette): ${evaluation.recommendedK}`);
  }
  const k = Number(process.argv[2] ?? 3);
  const run = await runClustering(k);
  console.log(`Run ${run.id}: K=${k}, silhouette=${run.silhouetteScore.toFixed(4)}, inertia=${run.inertia.toFixed(2)}`);
}

main().finally(() => prisma.$disconnect());
