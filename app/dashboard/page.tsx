import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Boxes, Gauge, Users } from "lucide-react";
import { DonutChart, SimpleBarChart } from "@/components/charts/charts";
import { CardSection } from "@/components/shared/card-section";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { rankColor } from "@/lib/cluster-colors";
import { formatDateTime, formatInt, formatNumber, shortLabel } from "@/lib/format";
import { getDashboardData } from "@/services/dashboard.service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const d = await getDashboardData();
  const k = d.run?.numberOfClusters ?? 0;

  if (d.total === 0) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState
          icon={Users}
          title="Belum ada responden"
          description="Bagikan tautan kuesioner kepada mahasiswa atau jalankan `npm run db:seed` untuk data contoh."
          action={
            <Link href="/kuesioner" className={buttonVariants()}>
              Buka Kuesioner
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          d.run
            ? `Hasil clustering aktif: K = ${k}, silhouette ${formatNumber(d.run.silhouetteScore, 3)} · diperbarui ${formatDateTime(d.run.createdAt)}`
            : "Clustering belum dijalankan. Jalankan dari menu Clustering untuk melihat distribusi kelompok."
        }
        actions={
          <Link href="/dashboard/clustering" className={buttonVariants({ variant: "outline" })}>
            <Boxes /> Kelola Clustering
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Responden" value={formatInt(d.total)} icon={Users} hint="Seluruh kuesioner masuk" />
        {d.clusters.map((c) => (
          <StatCard
            key={c.cluster}
            label={c.label}
            value={formatInt(c.count)}
            hint={`${formatNumber((c.count / d.total) * 100, 1)}% responden · cluster ${c.cluster}`}
            icon={Boxes}
            color={rankColor(c.rank, k)}
          />
        ))}
        <StatCard
          label="Rata-rata Dependency Score"
          value={d.avgDependency === null ? "—" : `${formatNumber(d.avgDependency, 1)} / 100`}
          icon={Gauge}
          hint="Skor bantu interpretasi (0–100)"
        />
        <StatCard
          label="Platform AI Terbanyak"
          value={d.topPlatform?.name ?? "—"}
          icon={Bot}
          hint={d.topPlatform ? `Digunakan ${d.topPlatform.value} responden` : undefined}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <CardSection title="Distribusi Cluster" description="Proporsi responden pada tiap kelompok K-Means">
          {d.clusters.length ? (
            <DonutChart
              data={d.clusters.map((c) => ({ name: shortLabel(c.label), value: c.count, color: rankColor(c.rank, k) }))}
            />
          ) : (
            <EmptyState icon={Boxes} title="Belum ada hasil clustering" />
          )}
        </CardSection>
        <CardSection title="Distribusi Tingkat Ketergantungan" description="Jumlah responden per rentang dependency score">
          <SimpleBarChart data={d.dependencyBins} valueLabel="Responden" />
        </CardSection>
        <CardSection title="Platform AI yang Paling Sering Digunakan">
          <SimpleBarChart data={d.platforms} horizontal valueLabel="Responden" />
        </CardSection>
        <CardSection title="Tujuan Penggunaan AI">
          <SimpleBarChart data={d.purposes} horizontal height={320} valueLabel="Responden" />
        </CardSection>
        <CardSection title="Distribusi Responden per Semester" className="lg:col-span-2">
          <SimpleBarChart data={d.semesters} height={240} valueLabel="Responden" />
        </CardSection>
      </div>
    </>
  );
}
