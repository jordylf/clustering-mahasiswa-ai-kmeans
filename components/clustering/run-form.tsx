"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { runClusteringAction } from "@/app/dashboard/actions";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { Label } from "@/components/ui/label";
import { K_RANGE } from "@/lib/constants";
import { selectClass } from "@/lib/utils";

export function RunClusteringForm({ defaultK, recommendedK }: { defaultK: number; recommendedK?: number }) {
  const [k, setK] = useState(defaultK);
  const ks = Array.from({ length: K_RANGE.max - K_RANGE.min + 1 }, (_, i) => K_RANGE.min + i);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="k">Jumlah cluster (K)</Label>
        <select id="k" className={`${selectClass} sm:w-48`} value={k} onChange={(e) => setK(Number(e.target.value))}>
          {ks.map((v) => (
            <option key={v} value={v}>
              K = {v}
              {v === recommendedK ? " (direkomendasikan)" : ""}
            </option>
          ))}
        </select>
      </div>
      <ConfirmAction
        trigger={
          <>
            <Play /> Jalankan K-Means
          </>
        }
        triggerVariant="default"
        destructive={false}
        title={`Jalankan clustering dengan K = ${k}?`}
        description="Proses preprocessing, standardisasi, K-Means, silhouette, dan PCA akan dijalankan ulang pada seluruh data. Hasil sebelumnya tetap tersimpan di riwayat, namun hasil baru menjadi hasil aktif."
        confirmLabel="Jalankan"
        successMessage={`Clustering K = ${k} berhasil dijalankan.`}
        action={() => runClusteringAction(k)}
      />
    </div>
  );
}
