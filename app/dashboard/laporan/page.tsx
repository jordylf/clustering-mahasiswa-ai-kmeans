import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { DonutChart, PcaScatterChart } from "@/components/charts/charts";
import { CentroidTable } from "@/components/clustering/centroid-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rankColor } from "@/lib/cluster-colors";
import { formatDateTime, formatNumber, shortLabel } from "@/lib/format";
import { RESEARCH_TITLE } from "@/lib/research";
import { evaluateOptimalK, getActiveRun, getActiveRunResults } from "@/services/clustering.service";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Laporan Hasil Clustering" };

export default async function ReportPage() {
  const [run, evaluation] = await Promise.all([getActiveRun(), evaluateOptimalK()]);
  if (!run) return <EmptyState icon={FileText} title="Belum ada hasil clustering untuk dilaporkan" />;

  const results = await getActiveRunResults(run.id);
  const k = run.numberOfClusters;

  return (
    <article className="mx-auto max-w-4xl space-y-8 print:max-w-none">
      <div className="flex justify-end no-print">
        <PrintButton />
      </div>
      <header className="space-y-2 border-b pb-6 text-center">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Laporan Hasil Clustering</p>
        <h1 className="text-xl font-semibold text-balance">{RESEARCH_TITLE}</h1>
        <p className="text-sm text-muted-foreground">Dibuat {formatDateTime(new Date())} · run {formatDateTime(run.createdAt)}</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-semibold">1. Ringkasan Evaluasi</h2>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          {[
            ["Jumlah responden", run.respondentCount],
            ["Jumlah cluster (K)", k],
            ["Silhouette score", formatNumber(run.silhouetteScore, 4)],
            ["Inertia", formatNumber(run.inertia)],
            ["Iterasi", run.iterations],
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="text-lg font-semibold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Silhouette Score mendekati 1 berarti cluster semakin baik terpisah. Preprocessing: {run.preprocessing.droppedRecords} data
          dibuang, {run.preprocessing.imputedValues} missing value diimputasi median, {run.preprocessing.invalidValues} nilai tidak valid.
        </p>
      </section>

      {evaluation && (
        <section className="space-y-3 break-inside-avoid">
          <h2 className="font-semibold">2. Penentuan Jumlah Cluster</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>K</TableHead>
                <TableHead className="text-right">Inertia</TableHead>
                <TableHead className="text-right">Silhouette</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluation.results.map((r) => (
                <TableRow key={r.k} className={r.k === evaluation.recommendedK ? "font-semibold" : ""}>
                  <TableCell>{r.k}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(r.inertia)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(r.silhouette, 4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm">Nilai K yang direkomendasikan berdasarkan Silhouette Score adalah K = {evaluation.recommendedK}.</p>
        </section>
      )}

      <section className="space-y-3 break-inside-avoid">
        <h2 className="font-semibold">3. Centroid dan Distribusi Cluster</h2>
        <CentroidTable centroids={run.centroids} k={k} />
        <DonutChart data={run.centroids.map((c) => ({ name: shortLabel(c.label), value: c.size, color: rankColor(c.rank, k) }))} height={240} />
      </section>

      <section className="space-y-3 break-inside-avoid">
        <h2 className="font-semibold">4. Interpretasi</h2>
        {run.centroids.map((c) => (
          <div key={c.cluster} className="rounded-lg border p-4 text-sm">
            <p className="mb-1 font-medium">
              {c.label} ({c.size} mahasiswa)
            </p>
            <p className="text-muted-foreground">{c.interpretation}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3 break-inside-avoid">
        <h2 className="font-semibold">5. Visualisasi PCA</h2>
        <PcaScatterChart
          explained={run.explainedVariance}
          series={run.centroids.map((c) => ({
            label: shortLabel(c.label),
            color: rankColor(c.rank, k),
            points: results
              .filter((r) => r.cluster === c.cluster)
              .map((r) => ({ x: r.pcaX, y: r.pcaY, code: r.respondent.respondentCode, label: c.label, dependencyScore: r.dependencyScore })),
          }))}
        />
      </section>
    </article>
  );
}
