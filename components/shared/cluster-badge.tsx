import { rankColor } from "@/lib/cluster-colors";
import { shortLabel } from "@/lib/format";

export function ClusterBadge({ label, rank, k, short }: { label: string; rank: number; k: number; short?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap">
      <span className="size-2 rounded-full" style={{ backgroundColor: rankColor(rank, k) }} aria-hidden />
      {short ? shortLabel(label) : label}
    </span>
  );
}
