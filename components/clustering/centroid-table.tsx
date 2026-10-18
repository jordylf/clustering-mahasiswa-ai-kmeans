import { ClusterBadge } from "@/components/shared/cluster-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FEATURE_KEYS, FEATURE_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { CentroidInfo } from "@/types";

export function CentroidTable({ centroids, k }: { centroids: CentroidInfo[]; k: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Cluster</TableHead>
            {FEATURE_KEYS.map((f) => (
              <TableHead key={f} className="text-right whitespace-nowrap">
                {FEATURE_LABELS[f]}
              </TableHead>
            ))}
            <TableHead className="text-right whitespace-nowrap">Dependency</TableHead>
            <TableHead className="text-right whitespace-nowrap">Jumlah Anggota</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {centroids.map((c) => (
            <TableRow key={c.cluster}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <ClusterBadge label={c.label} rank={c.rank} k={k} />
                  <span className="text-xs text-muted-foreground">#{c.cluster}</span>
                </div>
              </TableCell>
              {FEATURE_KEYS.map((f) => (
                <TableCell key={f} className="text-right tabular-nums">
                  {formatNumber(c.features[f])}
                </TableCell>
              ))}
              <TableCell className="text-right font-medium tabular-nums">{formatNumber(c.dependencyScore, 1)}</TableCell>
              <TableCell className="text-right tabular-nums">{c.size}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
