import ExcelJS from "exceljs";
import { FEATURE_KEYS } from "@/lib/constants";
import { getActiveRun } from "@/services/clustering.service";
import { loadFeatureDataset } from "@/services/dataset.service";
import { prisma } from "@/lib/db";

type Cell = string | number | null;
export type Sheet = { name: string; columns: string[]; rows: Cell[][] };

export const DATASETS = {
  full: "Dataset lengkap",
  respondents: "Data responden",
  raw: "Raw questionnaire",
  features: "Feature preprocessing",
  clustering: "Hasil clustering",
} as const;
export type DatasetKey = keyof typeof DATASETS;

const round = (v: number | null | undefined, d = 4) => (v === null || v === undefined ? null : Number(v.toFixed(d)));

export async function buildExportSheets(): Promise<Record<DatasetKey | "centroids", Sheet>> {
  const [{ respondents, raw, rows, questions }, run] = await Promise.all([loadFeatureDataset(), getActiveRun()]);
  const results = run ? await prisma.clusteringResult.findMany({ where: { clusteringRunId: run.id } }) : [];
  const resultById = new Map(results.map((r) => [r.respondentId, r]));
  const featureById = new Map(rows.map((r) => [r.id, r.features]));
  const rawById = new Map(raw.map((r) => [r.id, r.answers]));
  const codes = questions.map((q) => q.code);
  // z-score memakai mean/std dari run aktif (sama dengan input K-Means)
  const zscore = (v: number, j: number) => (run ? (v - run.scalerMean[j]) / run.scalerStd[j] : null);

  const identityCols = ["respondent_code", "name", "age", "gender", "university", "faculty", "study_program", "semester", "ai_usage_frequency", "platforms", "purposes", "created_at"];
  const featureCols = [...FEATURE_KEYS, ...FEATURE_KEYS.map((k) => `z_${k}`)];
  const clusterCols = ["cluster", "cluster_label", "dependency_score", "distance_to_centroid", "pca_1", "pca_2"];

  const parts = respondents.map((r) => {
    const f = featureById.get(r.id);
    const res = resultById.get(r.id);
    const answers = rawById.get(r.id) ?? {};
    return {
      identity: [
        r.respondentCode,
        r.name,
        r.age,
        r.gender,
        r.university,
        r.faculty,
        r.studyProgram,
        r.semester,
        r.aiUsageFrequency,
        [...r.platforms, r.otherPlatform].filter(Boolean).join("; "),
        [...r.purposes, r.otherPurpose].filter(Boolean).join("; "),
        r.createdAt.toISOString(),
      ] as Cell[],
      raw: codes.map((c) => answers[c] ?? null) as Cell[],
      features: f
        ? [...FEATURE_KEYS.map((k) => round(f[k])), ...FEATURE_KEYS.map((k, j) => round(zscore(f[k], j)))]
        : featureCols.map(() => null),
      cluster: res
        ? [res.cluster, res.label, round(res.dependencyScore, 2), round(res.distanceToCentroid), round(res.pcaX), round(res.pcaY)]
        : clusterCols.map(() => null),
    };
  });

  return {
    full: {
      name: "Dataset Lengkap",
      columns: [...identityCols, ...codes, ...featureCols, ...clusterCols],
      rows: parts.map((p) => [...p.identity, ...p.raw, ...p.features, ...p.cluster]),
    },
    respondents: { name: "Responden", columns: identityCols, rows: parts.map((p) => p.identity) },
    raw: { name: "Raw Kuesioner", columns: ["respondent_code", ...codes], rows: parts.map((p) => [p.identity[0], ...p.raw]) },
    features: { name: "Fitur", columns: ["respondent_code", ...featureCols], rows: parts.map((p) => [p.identity[0], ...p.features]) },
    clustering: { name: "Hasil Clustering", columns: ["respondent_code", ...clusterCols], rows: parts.map((p) => [p.identity[0], ...p.cluster]) },
    centroids: {
      name: "Centroid",
      columns: ["cluster", "label", ...FEATURE_KEYS, "dependency_score", "members"],
      rows:
        run?.centroids.map((c) => [c.cluster, c.label, ...FEATURE_KEYS.map((k) => round(c.features[k])), round(c.dependencyScore, 2), c.size]) ?? [],
    },
  };
}

const csvCell = (v: Cell) => {
  if (v === null) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV dengan BOM agar karakter Indonesia terbaca benar saat dibuka di Excel. */
export const toCsv = (sheet: Sheet) =>
  "﻿" + [sheet.columns, ...sheet.rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

export async function toXlsx(sheets: Sheet[], meta: Record<string, string | number>): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Clustering GenAI";
  const info = wb.addWorksheet("Info");
  info.addRows(Object.entries(meta));
  info.getColumn(1).width = 28;
  info.getColumn(2).width = 60;
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name);
    ws.addRow(s.columns).font = { bold: true };
    ws.addRows(s.rows);
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.columns.forEach((c) => (c.width = 16));
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
