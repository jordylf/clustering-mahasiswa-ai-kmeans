import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, ChartLine, ChartScatter } from "lucide-react";
import { CentroidTable } from "@/components/clustering/centroid-table";
import { EvaluationMetrics } from "@/components/clustering/evaluation-metrics";
import { RunClusteringForm } from "@/components/clustering/run-form";
import { CardSection } from "@/components/shared/card-section";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rankColor } from "@/lib/cluster-colors";
import { DEFAULT_K } from "@/lib/constants";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getActiveRun, listRuns } from "@/services/clustering.service";

export const metadata: Metadata = { title: "Clustering" };

export default async function ClusteringPage() {
  const [run, runs] = await Promise.all([getActiveRun(), listRuns()]);
  const k = run?.numberOfClusters ?? DEFAULT_K;

  return (
    <>
      <PageHeader
        title="Clustering K-Means"
        description="Jalankan K-Means pada lima fitur hasil agregasi yang telah distandardisasi. Label cluster ditentukan otomatis dari urutan dependency score centroid."
        actions={
          <>
            <Link href="/dashboard/analisis" className={buttonVariants({ variant: "outline" })}>
              <ChartLine /> Tentukan K Optimal
            </Link>
            <Link href="/dashboard/visualisasi" className={buttonVariants({ variant: "outline" })}>
              <ChartScatter /> Visualisasi PCA
            </Link>
          </>
        }
      />

      <div className="space-y-6">
        <CardSection title="Jalankan Clustering" description="Default K = 3. Pilih K lain berdasarkan hasil Elbow Method dan Silhouette Score.">
          <RunClusteringForm defaultK={k} />
        </CardSection>

        {!run ? (
          <EmptyState icon={Boxes} title="Belum ada hasil clustering" description="Pilih jumlah cluster lalu klik Jalankan K-Means." />
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Evaluasi</h2>
              <EvaluationMetrics run={run} />
            </section>

            <CardSection
              title="Preprocessing"
              description="Ringkasan data cleaning sebelum clustering"
            >
              <div className="grid gap-3 text-sm sm:grid-cols-4">
                {[
                  ["Total data", run.preprocessing.totalRecords],
                  ["Data dibuang (>50% kosong)", run.preprocessing.droppedRecords],
                  ["Nilai tidak valid", run.preprocessing.invalidValues],
                  ["Missing value diimputasi (median)", run.preprocessing.imputedValues],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
            </CardSection>

            <CardSection title="Centroid Analysis" description="Nilai centroid dalam skala asli fitur (1–5), diurutkan dari ketergantungan terendah">
              <CentroidTable centroids={run.centroids} k={k} />
            </CardSection>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Interpretasi Cluster</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                {run.centroids.map((c) => (
                  <div key={c.cluster} className="rounded-xl border bg-card p-5 shadow-sm" style={{ borderTopColor: rankColor(c.rank, k), borderTopWidth: 4 }}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-semibold">{c.label}</p>
                      <Badge variant="secondary">{c.size} mahasiswa</Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{c.interpretation}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Dependency score centroid: <span className="font-medium text-foreground">{formatNumber(c.dependencyScore, 1)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {runs.length > 0 && (
          <CardSection title="Riwayat Clustering" description="10 proses clustering terakhir">
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">K</TableHead>
                    <TableHead className="text-right">Silhouette</TableHead>
                    <TableHead className="text-right">Inertia</TableHead>
                    <TableHead className="text-right">Responden</TableHead>
                    <TableHead>Engine</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(r.createdAt)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.numberOfClusters}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(r.silhouetteScore, 4)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(r.inertia)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.respondentCount}</TableCell>
                      <TableCell>{r.engine}</TableCell>
                      <TableCell>{r.isActive ? <Badge>Aktif</Badge> : <span className="text-xs text-muted-foreground">Arsip</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardSection>
        )}
      </div>
    </>
  );
}
