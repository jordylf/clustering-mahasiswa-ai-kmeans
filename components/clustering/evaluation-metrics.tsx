import { Boxes, Repeat, Sigma, Target, Users } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { formatInt, formatNumber } from "@/lib/format";
import type { ActiveRun } from "@/services/clustering.service";

function silhouetteQuality(s: number) {
  if (s > 0.7) return "struktur cluster kuat";
  if (s > 0.5) return "struktur cluster baik";
  if (s > 0.25) return "struktur cluster lemah";
  return "tidak ada struktur yang jelas";
}

export function EvaluationMetrics({ run }: { run: ActiveRun }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Silhouette Score" value={formatNumber(run.silhouetteScore, 4)} icon={Target} hint={silhouetteQuality(run.silhouetteScore)} />
        <StatCard label="Inertia (WCSS)" value={formatNumber(run.inertia, 2)} icon={Sigma} hint="Jumlah kuadrat jarak ke centroid" />
        <StatCard label="Jumlah Cluster" value={run.numberOfClusters} icon={Boxes} hint={`Engine: ${run.engine}`} />
        <StatCard label="Jumlah Responden" value={formatInt(run.respondentCount)} icon={Users} hint={`${run.preprocessing.droppedRecords} dibuang saat cleaning`} />
        <StatCard label="Jumlah Iterasi" value={run.iterations} icon={Repeat} hint="Hingga centroid konvergen" />
      </div>
      <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Silhouette Score</span> berkisar −1 sampai 1. Nilai mendekati 1
        berarti cluster semakin baik terpisah; mendekati 0 berarti cluster saling tumpang tindih; negatif berarti banyak
        data masuk ke cluster yang kurang tepat. <span className="font-medium text-foreground">Inertia</span> yang lebih
        kecil berarti anggota cluster semakin rapat di sekitar centroid.
      </p>
    </div>
  );
}
