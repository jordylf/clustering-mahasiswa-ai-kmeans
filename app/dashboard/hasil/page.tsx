import type { Metadata } from "next";
import Link from "next/link";
import { UserCheck } from "lucide-react";
import { Pagination, SortLink, TableFilters } from "@/components/respondents/table-controls";
import { ClusterBadge } from "@/components/shared/cluster-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { applyTableQuery, filterOptions, parseTableQuery, sortHref, withQuery } from "@/lib/table-query";
import { getActiveRun } from "@/services/clustering.service";
import { getRespondentRows } from "@/services/respondent.service";

export const metadata: Metadata = { title: "Hasil Responden" };

const BASE = "/dashboard/hasil";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const tq = parseTableQuery(await searchParams);
  const [rows, run] = await Promise.all([getRespondentRows(), getActiveRun()]);
  const { items, total, page, totalPages } = applyTableQuery(rows, tq);
  const k = run?.numberOfClusters ?? 3;

  const columns = [
    { key: "code", label: "Kode", align: "" },
    { key: "frequency", label: "Frequency", align: "text-right" },
    { key: "task", label: "Task Dep.", align: "text-right" },
    { key: "academic", label: "Academic", align: "text-right" },
    { key: "verification", label: "Verification", align: "text-right" },
    { key: "trust", label: "Trust", align: "text-right" },
    { key: "dependency", label: "Dependency", align: "text-right" },
    { key: "distance", label: "Jarak Centroid", align: "text-right" },
    { key: "cluster", label: "Cluster", align: "" },
  ];

  return (
    <>
      <PageHeader
        title="Hasil Responden"
        description="Nilai lima fitur hasil preprocessing, dependency score, jarak ke centroid, dan cluster setiap mahasiswa."
      />
      {rows.length === 0 ? (
        <EmptyState icon={UserCheck} title="Belum ada data" />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="space-y-4">
            {!run && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                Clustering belum dijalankan, kolom cluster masih kosong.{" "}
                <Link href="/dashboard/clustering" className="font-medium text-primary hover:underline">
                  Jalankan clustering
                </Link>
              </p>
            )}
            <TableFilters options={filterOptions(rows)} />
            {items.length === 0 ? (
              <EmptyState title="Tidak ada data yang cocok" />
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {columns.map((c) => (
                        <TableHead key={c.key} className={`whitespace-nowrap ${c.align}`}>
                          <SortLink href={sortHref(BASE, tq, c.key)} label={c.label} active={tq.sort === c.key} dir={tq.dir} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          <Link href={`/dashboard/responden/${r.id}`} className="hover:underline">
                            {r.code}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(r.features?.frequency_score)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(r.features?.task_dependency_score)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(r.features?.academic_usage_score)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(r.features?.verification_score)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(r.features?.trust_score)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatNumber(r.dependencyScore)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(r.cluster?.distanceToCentroid, 3)}</TableCell>
                        <TableCell>
                          {r.cluster ? <ClusterBadge label={r.cluster.label} rank={r.cluster.rank} k={k} short /> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              prevHref={withQuery(BASE, tq, { page: page - 1 })}
              nextHref={withQuery(BASE, tq, { page: page + 1 })}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
