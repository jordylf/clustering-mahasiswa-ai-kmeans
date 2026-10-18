import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Trash2, Users } from "lucide-react";
import { deleteAllRespondentsAction, deleteRespondentAction } from "@/app/dashboard/actions";
import { Pagination, SortLink, TableFilters } from "@/components/respondents/table-controls";
import { ClusterBadge } from "@/components/shared/cluster-badge";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/format";
import { applyTableQuery, filterOptions, parseTableQuery, sortHref, withQuery } from "@/lib/table-query";
import { getActiveRun } from "@/services/clustering.service";
import { getRespondentRows } from "@/services/respondent.service";

export const metadata: Metadata = { title: "Data Responden" };

const BASE = "/dashboard/responden";

export default async function RespondentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const tq = parseTableQuery(await searchParams);
  const [rows, run] = await Promise.all([getRespondentRows(), getActiveRun()]);
  const { items, total, page, totalPages } = applyTableQuery(rows, tq);
  const k = run?.numberOfClusters ?? 3;

  const columns = [
    { key: "code", label: "Kode" },
    { key: "university", label: "Universitas" },
    { key: "program", label: "Program Studi" },
    { key: "semester", label: "Semester" },
    { key: "frequency", label: "Frequency Score" },
    { key: "dependency", label: "Dependency Score" },
    { key: "cluster", label: "Cluster" },
    { key: "date", label: "Tanggal" },
  ];

  return (
    <>
      <PageHeader
        title="Data Responden"
        description="Daftar seluruh responden kuesioner. Klik baris untuk melihat detail jawaban dan hasil clustering."
        actions={
          rows.length > 0 && (
            <ConfirmAction
              trigger={
                <>
                  <Trash2 /> Hapus Semua
                </>
              }
              title="Hapus seluruh data responden?"
              description="Semua responden, jawaban, dan riwayat clustering akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
              confirmLabel="Hapus semua"
              successMessage="Seluruh data responden dihapus."
              action={deleteAllRespondentsAction}
            />
          )
        }
      />

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada responden" description="Data akan muncul setelah mahasiswa mengisi kuesioner." />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="space-y-4">
            <TableFilters options={filterOptions(rows)} />
            {items.length === 0 ? (
              <EmptyState title="Tidak ada data yang cocok" description="Ubah kata kunci atau filter pencarian." />
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {columns.map((c) => (
                        <TableHead key={c.key} className="whitespace-nowrap">
                          <SortLink href={sortHref(BASE, tq, c.key)} label={c.label} active={tq.sort === c.key} dir={tq.dir} />
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          <Link href={`${BASE}/${r.id}`} className="hover:underline">
                            {r.code}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">{r.university}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.studyProgram}</TableCell>
                        <TableCell className="tabular-nums">{r.semester}</TableCell>
                        <TableCell className="tabular-nums">{formatNumber(r.features?.frequency_score)}</TableCell>
                        <TableCell className="tabular-nums">{formatNumber(r.dependencyScore)}</TableCell>
                        <TableCell>
                          {r.cluster ? (
                            <ClusterBadge label={r.cluster.label} rank={r.cluster.rank} k={k} short />
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Link href={`${BASE}/${r.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={`Detail ${r.code}`}>
                            <Eye />
                          </Link>
                          <ConfirmAction
                            trigger={<Trash2 />}
                            triggerVariant="ghost"
                            triggerSize="icon-sm"
                            triggerLabel={`Hapus ${r.code}`}
                            title={`Hapus responden ${r.code}?`}
                            description="Data identitas, jawaban kuesioner, dan hasil clustering responden ini akan dihapus permanen."
                            confirmLabel="Hapus"
                            successMessage={`Responden ${r.code} dihapus.`}
                            action={deleteRespondentAction.bind(null, r.id)}
                          />
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
