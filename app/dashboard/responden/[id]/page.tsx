import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FeatureRadarChart } from "@/components/charts/charts";
import { CardSection } from "@/components/shared/card-section";
import { ClusterBadge } from "@/components/shared/cluster-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FEATURE_KEYS, FEATURE_LABELS, LIKERT_OPTIONS, QUESTION_CATEGORIES, type QuestionCategory } from "@/lib/constants";
import { formatDateTime, formatNumber } from "@/lib/format";
import { interpretRespondent } from "@/ml/clustering/interpret";
import { getRespondentDetail } from "@/services/respondent.service";

export const metadata: Metadata = { title: "Detail Responden" };

export default async function RespondentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const detail = await getRespondentDetail((await params).id);
  if (!detail) notFound();
  const { respondent: r, features, dependencyScore, result, centroid, runK } = detail;
  const answers = r.response?.answers ?? [];

  const profile = [
    ["Nama", r.name ?? "— (anonim)"],
    ["Umur", `${r.age} tahun`],
    ["Jenis kelamin", r.gender],
    ["Universitas", r.university],
    ["Fakultas", r.faculty],
    ["Program studi", r.studyProgram],
    ["Semester", String(r.semester)],
    ["Frekuensi penggunaan AI", r.aiUsageFrequency],
    ["Tanggal mengisi", formatDateTime(r.createdAt)],
  ];

  const radarData = FEATURE_KEYS.map((key) => ({
    feature: FEATURE_LABELS[key],
    value: features[key],
    compare: centroid?.features[key],
  }));

  return (
    <>
      <Link href="/dashboard/responden" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-3 -ml-2" })}>
        <ArrowLeft /> Kembali
      </Link>
      <PageHeader
        title={`Responden ${r.respondentCode}`}
        description="Profil, jawaban kuesioner, nilai fitur, dan hasil clustering responden."
        actions={centroid && runK ? <ClusterBadge label={centroid.label} rank={centroid.rank} k={runK} /> : undefined}
      />

      <Card className="mb-4 border-primary/30 bg-accent/40 shadow-sm">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Interpretasi</p>
            <p className="text-lg font-medium text-balance">
              {centroid
                ? interpretRespondent(centroid.label)
                : "Responden belum masuk hasil clustering. Jalankan ulang clustering untuk menentukan kategorinya."}
            </p>
            {result && (
              <p className="text-xs text-muted-foreground">
                Cluster K-Means #{result.cluster} · jarak ke centroid {formatNumber(result.distanceToCentroid, 3)}
              </p>
            )}
          </div>
          <div className="min-w-48 space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Dependency score</span>
              <span className="text-2xl font-semibold tabular-nums">{formatNumber(dependencyScore, 1)}</span>
            </div>
            <Progress value={dependencyScore} aria-label="Dependency score" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <CardSection title="Profil Responden">
          <dl className="space-y-2.5 text-sm">
            {profile.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </CardSection>

        <CardSection title="Feature Score" description={centroid ? "Dibandingkan dengan centroid cluster" : "Skala 1–5"}>
          <FeatureRadarChart data={radarData} primaryLabel="Responden" compareLabel={centroid ? `Centroid ${centroid.label.replace("Ketergantungan ", "")}` : undefined} />
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {FEATURE_KEYS.map((key) => (
              <div key={key} className="flex justify-between rounded-md bg-muted/50 px-2 py-1">
                <span className="text-muted-foreground">{FEATURE_LABELS[key]}</span>
                <span className="font-medium tabular-nums">{formatNumber(features[key])}</span>
              </div>
            ))}
          </div>
        </CardSection>

        <CardSection title="Platform & Tujuan">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Platform AI yang digunakan</p>
              <div className="flex flex-wrap gap-1.5">
                {r.platforms.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p === "Lainnya" && r.otherPlatform ? `Lainnya: ${r.otherPlatform}` : p}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tujuan penggunaan</p>
              <div className="flex flex-wrap gap-1.5">
                {r.purposes.map((p) => (
                  <Badge key={p} variant="outline">
                    {p === "Lainnya" && r.otherPurpose ? `Lainnya: ${r.otherPurpose}` : p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardSection>

        <CardSection title="Jawaban Kuesioner" className="lg:col-span-3">
          <div className="grid gap-x-8 md:grid-cols-2">
            {(Object.keys(QUESTION_CATEGORIES) as QuestionCategory[]).map((cat) => (
              <div key={cat} className="mb-4">
                <p className="mb-2 text-sm font-medium">{QUESTION_CATEGORIES[cat].label}</p>
                <ul className="divide-y rounded-lg border">
                  {answers
                    .filter((a) => a.question.category === cat)
                    .map((a) => (
                      <li key={a.id} className="flex items-start gap-3 px-3 py-2 text-sm">
                        <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">{a.question.code}</span>
                        <span className="flex-1">{a.question.text}</span>
                        <span className="shrink-0 font-semibold tabular-nums" title={LIKERT_OPTIONS[a.value - 1]?.label}>
                          {a.value}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </CardSection>
      </div>
    </>
  );
}
