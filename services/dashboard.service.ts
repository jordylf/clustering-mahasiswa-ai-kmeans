import { PLATFORM_OPTIONS, PURPOSE_OPTIONS } from "@/lib/constants";
import { getActiveRun } from "@/services/clustering.service";
import { getRespondentRows } from "@/services/respondent.service";

const countBy = <T,>(items: T[], key: (t: T) => string[]) => {
  const map = new Map<string, number>();
  for (const it of items) for (const k of key(it)) map.set(k, (map.get(k) ?? 0) + 1);
  return map;
};

export async function getDashboardData() {
  const [rows, run] = await Promise.all([getRespondentRows(), getActiveRun()]);
  const scored = rows.filter((r) => r.dependencyScore !== null);
  const avgDependency = scored.length
    ? scored.reduce((s, r) => s + (r.dependencyScore ?? 0), 0) / scored.length
    : null;

  const platformCounts = countBy(rows, (r) => r.platforms);
  const platforms = PLATFORM_OPTIONS.map((p) => ({ name: p, value: platformCounts.get(p) ?? 0 }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);
  const purposeCounts = countBy(rows, (r) => r.purposes);
  const purposes = PURPOSE_OPTIONS.map((p) => ({ name: p, value: purposeCounts.get(p) ?? 0 }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);

  const semesterCounts = countBy(rows, (r) => [String(r.semester)]);
  const semesters = [...semesterCounts.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([s, value]) => ({ name: `Smt ${s}`, value }));

  // Histogram dependency score dengan interval 20 poin
  const bins = [0, 20, 40, 60, 80].map((lo) => ({
    name: `${lo}–${lo + 20}`,
    value: scored.filter((r) => {
      const v = r.dependencyScore!;
      return v >= lo && (lo === 80 ? v <= 100 : v < lo + 20);
    }).length,
  }));

  const clusters =
    run?.centroids.map((c) => ({
      ...c,
      count: rows.filter((r) => r.cluster?.cluster === c.cluster).length,
    })) ?? [];

  return {
    total: rows.length,
    avgDependency,
    topPlatform: platforms[0] ?? null,
    platforms,
    purposes,
    semesters,
    dependencyBins: bins,
    clusters,
    run,
  };
}
