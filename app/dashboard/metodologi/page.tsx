import type { Metadata } from "next";
import { Methodology } from "@/components/research/methodology";
import { PageHeader } from "@/components/shared/page-header";
import { RESEARCH_TITLE } from "@/lib/research";

export const metadata: Metadata = { title: "Metodologi" };

export default function DashboardMethodologyPage() {
  return (
    <>
      <PageHeader title="Metodologi Penelitian" description={RESEARCH_TITLE} />
      <Methodology />
    </>
  );
}
