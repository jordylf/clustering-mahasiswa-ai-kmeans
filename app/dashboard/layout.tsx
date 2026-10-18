import { DashboardShell } from "@/components/layout/sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
