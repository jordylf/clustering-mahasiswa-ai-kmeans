import type { Metadata } from "next";
import Link from "next/link";
import { ChartScatter } from "lucide-react";
import { PcaScatterChart } from "@/components/charts/charts";
import { CentroidTable } from "@/components/clustering/centroid-table";
import { CardSection } from "@/components/shared/card-section";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { rankColor } from "@/lib/cluster-colors";
import { formatNumber, shortLabel } from "@/lib/format";
import { getActiveRun, getActiveRunResults } from "@/services/clustering.service";

export const metadata: Metadata = { title: "Visualisasi Clustering" };

export default async function VisualizationPage() {
  const run = await getActiveRun();
  if (!run) {
    return (
      <>
        <PageHeader title="Visualisasi Clustering" />
        <EmptyState
          icon={ChartScatter}
          title="Belum ada hasil clustering"
          description="Jalankan K-Means terlebih dahulu untuk menampilkan scatter plot PCA."
          action={
            <Link href="/dashboard/clustering" className={buttonVariants()}>
              Ke halaman Clustering
            </Link>
          }
        />
      </>
    );
  }

  const results = await getActiveRunResults(run.id);
  const k = run.numberOfClusters;
  const series = run.centroids.map((c) => ({
    label: shortLabel(c.label),
    color: rankColor(c.rank, k),
    points: results
      .filter((r) => r.cluster === c.cluster)
      .map((r) => ({
        x: r.pcaX,
        y: r.pcaY,
        code: r.respondent.respondentCode,
        label: c.label,
        dependencyScore: r.dependencyScore,
      })),
  }));
  const [pc1, pc2] = run.explainedVariance;

  return (
    <>
      <PageHeader
        title="Visualisasi Clustering"
        description="Lima fitur terstandardisasi direduksi menjadi dua dimensi dengan Principal Component Analysis (PCA). Setiap titik adalah satu mahasiswa."
      />
      <div className="space-y-6">
        <CardSection
          title="Scatter Plot PCA"
          description={`PC1 dan PC2 menjelaskan ${formatNumber((pc1 + pc2) * 100, 1)}% variansi data (PC1 ${formatNumber(pc1 * 100, 1)}%, PC2 ${formatNumber(pc2 * 100, 1)}%). Arahkan kursor ke titik untuk melihat detail.`}
        >
          <PcaScatterChart series={series} explained={run.explainedVariance} />
        </CardSection>
        <CardSection title="Centroid Setiap Cluster" description="Acuan membaca posisi kelompok pada scatter plot">
          <CentroidTable centroids={run.centroids} k={k} />
        </CardSection>
      </div>
    </>
  );
}
