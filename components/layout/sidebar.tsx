"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  BrainCircuit,
  ChartLine,
  ChartScatter,
  ClipboardList,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/responden", label: "Data Responden", icon: Users },
  { href: "/dashboard/kuesioner", label: "Kuesioner", icon: ClipboardList },
  { href: "/dashboard/clustering", label: "Clustering", icon: Boxes },
  { href: "/dashboard/visualisasi", label: "Visualisasi Clustering", icon: ChartScatter },
  { href: "/dashboard/analisis", label: "Analisis", icon: ChartLine },
  { href: "/dashboard/hasil", label: "Hasil Responden", icon: UserCheck },
  { href: "/dashboard/export", label: "Export Data", icon: Download },
  { href: "/dashboard/metodologi", label: "Metodologi", icon: Workflow },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3 font-semibold">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BrainCircuit className="size-4" />
      </span>
      <span className="leading-tight">
        GenAI Clustering
        <span className="block text-xs font-normal text-muted-foreground">Dashboard Penelitian</span>
      </span>
    </Link>
  );
}

function UserBox({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <form action={logout}>
        <Button type="submit" variant="ghost" size="icon-sm" aria-label="Keluar">
          <LogOut />
        </Button>
      </form>
    </div>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-6 border-r bg-sidebar px-3 py-5 lg:flex no-print">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <UserBox {...user} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur lg:px-8 no-print">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 gap-6 bg-sidebar px-3 py-5">
              <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
              <Brand />
              <div className="flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <UserBox {...user} />
            </SheetContent>
          </Sheet>
          <p className="truncate text-sm text-muted-foreground">Clustering Ketergantungan Generative AI · K-Means</p>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
