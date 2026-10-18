import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur no-print">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-4" />
          </span>
          <span className="hidden sm:inline">GenAI Dependency Research</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/metodologi" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Metodologi
          </Link>
          <Link href="/kuesioner" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Kuesioner
          </Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Dashboard
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
