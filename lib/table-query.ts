import type { RespondentRow } from "@/types";

export const PAGE_SIZE = 15;

export type TableQuery = {
  q: string;
  university: string;
  program: string;
  semester: string;
  cluster: string;
  sort: string;
  dir: "asc" | "desc";
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseTableQuery(sp: SearchParams): TableQuery {
  return {
    q: first(sp.q).trim(),
    university: first(sp.university),
    program: first(sp.program),
    semester: first(sp.semester),
    cluster: first(sp.cluster),
    sort: first(sp.sort) || "code",
    dir: first(sp.dir) === "desc" ? "desc" : "asc",
    page: Math.max(1, Number(first(sp.page)) || 1),
  };
}

const SORTERS: Record<string, (r: RespondentRow) => number | string> = {
  code: (r) => r.code,
  university: (r) => r.university,
  program: (r) => r.studyProgram,
  semester: (r) => r.semester,
  frequency: (r) => r.features?.frequency_score ?? -1,
  task: (r) => r.features?.task_dependency_score ?? -1,
  academic: (r) => r.features?.academic_usage_score ?? -1,
  verification: (r) => r.features?.verification_score ?? -1,
  trust: (r) => r.features?.trust_score ?? -1,
  dependency: (r) => r.dependencyScore ?? -1,
  distance: (r) => r.cluster?.distanceToCentroid ?? -1,
  cluster: (r) => r.cluster?.rank ?? -1,
  date: (r) => r.createdAt.getTime(),
};

export function applyTableQuery(rows: RespondentRow[], tq: TableQuery) {
  const q = tq.q.toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (!q || [r.code, r.name ?? "", r.university, r.studyProgram, r.faculty].some((v) => v.toLowerCase().includes(q))) &&
      (!tq.university || r.university === tq.university) &&
      (!tq.program || r.studyProgram === tq.program) &&
      (!tq.semester || String(r.semester) === tq.semester) &&
      (!tq.cluster || (tq.cluster === "none" ? !r.cluster : r.cluster?.label === tq.cluster)),
  );
  const key = SORTERS[tq.sort] ?? SORTERS.code;
  const sorted = [...filtered].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    const c = typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number);
    return tq.dir === "asc" ? c : -c;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(tq.page, totalPages);
  return {
    items: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: sorted.length,
    page,
    totalPages,
  };
}

export function filterOptions(rows: RespondentRow[]) {
  const uniq = (v: string[]) => [...new Set(v)].sort((a, b) => a.localeCompare(b));
  const clusterRanks = new Map<string, number>();
  for (const r of rows) if (r.cluster) clusterRanks.set(r.cluster.label, r.cluster.rank);
  return {
    universities: uniq(rows.map((r) => r.university)),
    programs: uniq(rows.map((r) => r.studyProgram)),
    semesters: [...new Set(rows.map((r) => r.semester))].sort((a, b) => a - b).map(String),
    clusters: [...clusterRanks.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label),
  };
}

/** Membuat URL dengan parameter query yang diperbarui (dipakai untuk sort dan paginasi). */
export function withQuery(base: string, tq: TableQuery, patch: Partial<Record<keyof TableQuery, string | number>>) {
  const params = new URLSearchParams();
  const merged = { ...tq, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== "" && v !== undefined && !(k === "page" && Number(v) === 1)) params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `${base}?${s}` : base;
}

/** Link header kolom: klik pertama asc, klik berikutnya membalik arah. */
export const sortHref = (base: string, tq: TableQuery, sort: string) =>
  withQuery(base, tq, { sort, dir: tq.sort === sort && tq.dir === "asc" ? "desc" : "asc", page: 1 });
