import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  /** warna penanda identitas (mis. warna cluster); teks tetap memakai warna teks */
  color?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
          style={color ? { color, backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)` } : undefined}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
