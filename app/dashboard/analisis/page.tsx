import type { Metadata } from "next";
import { ChartLine, Lightbulb } from "lucide-react";
import { MetricLineChart } from "@/components/charts/charts";
import { RunClusteringForm } from "@/components/clustering/run-form";
import { CardSection } from "@/components/shared/card-section";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { K_RANGE } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { evaluateOptimalK, getActiveRun } from "@/services/clustering.service";

export const metadata: Metadata = { title: "Analisis K Optimal" };

export default async function AnalysisPage() {
  const [evaluation, run] = await Promise.all([evaluateOptimalK(), getActiveRun()]);

  if (!evaluation) {
    return (
      <>
        <PageHeader title="Analisis Jumlah Cluster" />
        <EmptyState icon={ChartLine} title="Data belum cukup" description={`Dibutuhkan minimal ${K_RANGE.max + 1} responden valid untuk menguji K = ${K_RANGE.min} sampai ${K_RANGE.max}.`} />
      </>
    );
  }

  const { results, recommendedK, n } = evaluation;

  return (
    <>
      <PageHeader
        title="Analisis Jumlah Cluster"
        description={`Pengujian K = ${K_RANGE.min} sampai K = ${K_RANGE.max} pada ${n} responden menggunakan Elbow Method dan Silhouette Score.`}
      />
      <div className="space-y-6">
        <Card className="border-primary/30 bg-accent/40 shadow-sm">
          <CardContent className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium">Nilai K yang direkomendasikan berdasarkan Silhouette Score adalah K = {recommendedK}.</p>
              <p className="text-sm text-muted-foreground">
                Silhouette tertinggi {formatNumber(results.find((r) => r.k === recommendedK)!.silhouette, 4)}. Konfirmasi dengan
                titik siku (elbow) pada grafik inertia. Admin tetap dapat memilih K secara manual.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <CardSection title="Elbow Method" description="Jumlah Cluster vs Inertia — cari titik di mana penurunan inertia mulai melandai">
            <MetricLineChart data={results.map((r) => ({ k: r.k, value: r.inertia }))} metricLabel="Inertia" digits={2} highlightK={recommendedK} />
          </CardSection>
          <CardSection title="Silhouette Score" description="Jumlah Cluster vs Silhouette Score — semakin tinggi semakin baik">
            <MetricLineChart data={results.map((r) => ({ k: r.k, value: r.silhouette }))} metricLabel="Silhouette" digits={4} highlightK={recommendedK} color="var(--series-2)" />
          </CardSection>
        </div>

        <CardSection title="Tabel Evaluasi">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>K</TableHead>
                  <TableHead className="text-right">Inertia</TableHead>
                  <TableHead className="text-right">Penurunan Inertia</TableHead>
                  <TableHead className="text-right">Silhouette Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={r.k} className={cn(r.k === recommendedK && "bg-accent/50 font-medium")}>
                    <TableCell>
                      K = {r.k} {r.k === recommendedK && <span className="ml-1 text-xs text-primary">(rekomendasi)</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(r.inertia)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {i === 0 ? "—" : `${formatNumber(((results[i - 1].inertia - r.inertia) / results[i - 1].inertia) * 100, 1)}%`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(r.silhouette, 4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardSection>

        <CardSection title="Pilih K dan Jalankan Clustering">
          <RunClusteringForm defaultK={run?.numberOfClusters ?? recommendedK} recommendedK={recommendedK} />
        </CardSection>
      </div>
    </>
  );
}
