import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import { EmptyState } from "@/components/shared/empty-state";
import { QUESTION_CATEGORIES, type QuestionCategory } from "@/lib/constants";
import { getActiveQuestions } from "@/services/dataset.service";

export const metadata: Metadata = { title: "Kuesioner" };
export const dynamic = "force-dynamic";

export default async function QuestionnairePage() {
  const questions = await getActiveQuestions();
  const sections = (Object.keys(QUESTION_CATEGORIES) as QuestionCategory[])
    .map((cat, i) => ({
      key: cat,
      title: `${String.fromCharCode(65 + i)}. ${QUESTION_CATEGORIES[cat].label}`,
      questions: questions.filter((q) => q.category === cat).map((q) => ({ code: q.code, text: q.text })),
    }))
    .filter((s) => s.questions.length > 0);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        {questions.length === 0 ? (
          <EmptyState
            title="Kuesioner belum tersedia"
            description="Butir pertanyaan belum dimuat ke database. Jalankan `npm run db:seed` terlebih dahulu."
          />
        ) : (
          <QuestionnaireForm sections={sections} />
        )}
      </main>
    </>
  );
}
