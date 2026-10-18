"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <TriangleAlert className="size-8 text-destructive" />
      <div className="space-y-1">
        <p className="font-medium">Terjadi kesalahan saat memuat halaman</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || "Periksa koneksi database lalu coba lagi."}
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        Coba lagi
      </Button>
    </div>
  );
}
