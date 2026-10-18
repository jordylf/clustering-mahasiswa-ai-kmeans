import type { Metadata } from "next";
import Link from "next/link";
import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { CardSection } from "@/components/shared/card-section";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { DATASETS } from "@/services/export.service";

export const metadata: Metadata = { title: "Export Data" };

const DESCRIPTIONS: Record<keyof typeof DATASETS, string> = {
  full: "Identitas, jawaban X1–X20, fitur, z-score, cluster, dan dependency score dalam satu tabel.",
  respondents: "Profil responden, platform, dan tujuan penggunaan AI.",
  raw: "Jawaban mentah kuesioner (kosong = missing value).",
  features: "Lima fitur agregasi dan nilai terstandardisasi (input K-Means).",
  clustering: "Cluster, label, dependency score, jarak ke centroid, dan koordinat PCA.",
};

export default function ExportPage() {
  return (
    <>
      <PageHeader title="Export Data" description="Unduh dataset penelitian untuk diolah lebih lanjut (SPSS, Excel, Python) atau dilampirkan di skripsi." />
      <div className="grid gap-4 lg:grid-cols-3">
        <CardSection title="Excel (.xlsx)" description="Satu workbook berisi semua sheet + centroid dan metadata run" className="lg:col-span-1">
          <a href="/api/export?format=xlsx" className={buttonVariants({ className: "w-full" })}>
            <FileSpreadsheet /> Unduh Excel
          </a>
        </CardSection>
        <CardSection title="Laporan PDF" description="Ringkasan hasil clustering siap cetak / simpan sebagai PDF" className="lg:col-span-2">
          <Link href="/dashboard/laporan" className={buttonVariants({ variant: "outline" })}>
            <Printer /> Buka Laporan Hasil Clustering
          </Link>
        </CardSection>
        <CardSection title="CSV" description="Pilih dataset yang ingin diunduh" className="lg:col-span-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(DATASETS) as (keyof typeof DATASETS)[]).map((key) => (
              <div key={key} className="flex flex-col justify-between gap-3 rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">{DATASETS[key]}</p>
                  <p className="text-sm text-muted-foreground">{DESCRIPTIONS[key]}</p>
                </div>
                <a href={`/api/export?format=csv&dataset=${key}`} className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}>
                  <FileText /> Unduh CSV
                </a>
              </div>
            ))}
          </div>
        </CardSection>
      </div>
    </>
  );
}
