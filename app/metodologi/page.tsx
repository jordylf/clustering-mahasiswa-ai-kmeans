import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { Methodology } from "@/components/research/methodology";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Metodologi" };

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <PageHeader
          title="Metodologi Penelitian"
          description="Alur penelitian dari pengumpulan data hingga interpretasi cluster menggunakan algoritma K-Means."
        />
        <Methodology />
      </main>
    </>
  );
}
