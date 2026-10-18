"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, selectClass } from "@/lib/utils";

type Options = { universities: string[]; programs: string[]; semesters: string[]; clusters: string[] };

/** Search + filter disimpan di URL sehingga diproses di server dan dapat dibagikan. */
export function TableFilters({ options }: { options: Options }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update("q", q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filters = [
    { key: "university", label: "Semua universitas", values: options.universities },
    { key: "program", label: "Semua program studi", values: options.programs },
    { key: "semester", label: "Semua semester", values: options.semesters, format: (v: string) => `Semester ${v}` },
    {
      key: "cluster",
      label: "Semua cluster",
      values: [...options.clusters, "none"],
      format: (v: string) => (v === "none" ? "Belum ter-cluster" : v),
    },
  ];
  const active = ["q", ...filters.map((f) => f.key)].some((k) => params.get(k));

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative lg:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kode, nama, kampus…"
          className="h-9 pl-8"
          aria-label="Cari responden"
        />
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-4">
        {filters.map((f) => (
          <select
            key={f.key}
            className={selectClass}
            value={params.get(f.key) ?? ""}
            onChange={(e) => update(f.key, e.target.value)}
            aria-label={f.label}
          >
            <option value="">{f.label}</option>
            {f.values.map((v) => (
              <option key={v} value={v}>
                {f.format ? f.format(v) : v}
              </option>
            ))}
          </select>
        ))}
      </div>
      {active && (
        <Button
          variant="ghost"
          onClick={() => {
            setQ("");
            router.replace(pathname, { scroll: false });
          }}
        >
          <X /> Reset
        </Button>
      )}
    </div>
  );
}

export function SortLink({ href, label, active, dir }: { href: string; label: string; active: boolean; dir: "asc" | "desc" }) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <Link href={href} scroll={false} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}
      <Icon className={cn("size-3.5", !active && "opacity-40")} />
    </Link>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  prevHref,
  nextHref,
}: {
  page: number;
  totalPages: number;
  total: number;
  prevHref: string;
  nextHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
      <p>
        {total} data · halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-1">
        <Link
          href={prevHref}
          scroll={false}
          aria-disabled={page <= 1}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-50")}
        >
          <ChevronLeft /> Sebelumnya
        </Link>
        <Link
          href={nextHref}
          scroll={false}
          aria-disabled={page >= totalPages}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= totalPages && "pointer-events-none opacity-50",
          )}
        >
          Berikutnya <ChevronRight />
        </Link>
      </div>
    </div>
  );
}
