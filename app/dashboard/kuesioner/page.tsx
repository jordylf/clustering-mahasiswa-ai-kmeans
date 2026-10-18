import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { CardSection } from "@/components/shared/card-section";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LIKERT_OPTIONS, QUESTION_CATEGORIES, type QuestionCategory } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Kuesioner" };

export default async function QuestionnaireAdminPage() {
  const questions = await prisma.question.findMany({
    orderBy: { order: "asc" },
    include: { answers: { select: { value: true } } },
  });

  return (
    <>
      <PageHeader
        title="Kuesioner"
        description="Butir pernyataan skala Likert yang digunakan sebagai variabel penelitian, beserta statistik jawaban."
        actions={
          <Link href="/kuesioner" target="_blank" className={buttonVariants()}>
            <ExternalLink /> Buka Form Responden
          </Link>
        }
      />
      <div className="space-y-6">
        <CardSection title="Skala Likert">
          <div className="flex flex-wrap gap-2">
            {LIKERT_OPTIONS.map((o) => (
              <Badge key={o.value} variant="outline">
                {o.value} = {o.label}
              </Badge>
            ))}
          </div>
        </CardSection>
        {(Object.keys(QUESTION_CATEGORIES) as QuestionCategory[]).map((cat, i) => {
          const items = questions.filter((q) => q.category === cat);
          return (
            <CardSection
              key={cat}
              title={`${String.fromCharCode(65 + i)}. ${QUESTION_CATEGORIES[cat].label}`}
              description={`Fitur: ${QUESTION_CATEGORIES[cat].feature}`}
            >
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16">Kode</TableHead>
                      <TableHead>Pernyataan</TableHead>
                      <TableHead className="text-right">n</TableHead>
                      <TableHead className="text-right">Rata-rata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((q) => {
                      const mean = q.answers.length ? q.answers.reduce((s, a) => s + a.value, 0) / q.answers.length : null;
                      return (
                        <TableRow key={q.id}>
                          <TableCell className="font-mono text-xs">{q.code}</TableCell>
                          <TableCell className="min-w-72 whitespace-normal">
                            {q.text}
                            {q.isReversed && (
                              <Badge variant="secondary" className="ml-2">
                                reverse scoring
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{q.answers.length}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(mean)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardSection>
          );
        })}
      </div>
    </>
  );
}
