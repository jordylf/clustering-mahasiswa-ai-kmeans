import { prisma } from "@/lib/db";
import type { QuestionCategory } from "@/lib/constants";
import { calculateFeatures, preprocessData, type QuestionMeta } from "@/ml/clustering";

export async function getActiveQuestions() {
  return prisma.question.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
}

export async function getQuestionMeta(): Promise<QuestionMeta[]> {
  const questions = await getActiveQuestions();
  return questions.map((q) => ({
    code: q.code,
    category: q.category as QuestionCategory,
    isReversed: q.isReversed,
  }));
}

/**
 * Memuat seluruh responden + jawaban, lalu menjalankan preprocessing
 * (cleaning, imputasi missing value) dan feature aggregation.
 */
export async function loadFeatureDataset() {
  const [questions, respondents] = await Promise.all([
    getQuestionMeta(),
    prisma.respondent.findMany({
      orderBy: { seq: "asc" },
      include: { response: { include: { answers: { include: { question: { select: { code: true } } } } } } },
    }),
  ]);

  const raw = respondents.map((r) => ({
    id: r.id,
    answers: Object.fromEntries(r.response?.answers.map((a) => [a.question.code, a.value]) ?? []),
  }));
  const { records, report } = preprocessData(raw, questions);
  const rows = records.map((r) => ({
    id: r.id,
    answers: r.answers,
    features: calculateFeatures(r.answers, questions),
  }));

  return { questions, respondents, raw, rows, report };
}

export type FeatureDataset = Awaited<ReturnType<typeof loadFeatureDataset>>;
