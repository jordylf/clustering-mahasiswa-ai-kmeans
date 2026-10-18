import { prisma } from "@/lib/db";
import { calculateDependencyScore, calculateFeatures } from "@/ml/clustering";
import { getActiveRun } from "@/services/clustering.service";
import { loadFeatureDataset, getQuestionMeta } from "@/services/dataset.service";
import type { QuestionnaireData } from "@/lib/validations";
import type { RespondentRow } from "@/types";

export const formatRespondentCode = (seq: number) => `RSP-${String(seq).padStart(4, "0")}`;

/**
 * Semua responden beserta fitur, dependency score, dan cluster pada run aktif.
 * ponytail: filter/sort/paginasi dilakukan di memori; cukup untuk ribuan responden,
 * pindahkan ke query SQL bila data sangat besar.
 */
export async function getRespondentRows(): Promise<RespondentRow[]> {
  const [{ respondents, rows }, run] = await Promise.all([loadFeatureDataset(), getActiveRun()]);
  const results = run
    ? await prisma.clusteringResult.findMany({ where: { clusteringRunId: run.id } })
    : [];
  const featuresById = new Map(rows.map((r) => [r.id, r.features]));
  const resultById = new Map(results.map((r) => [r.respondentId, r]));
  const centroidByCluster = new Map(run?.centroids.map((c) => [c.cluster, c]) ?? []);

  return respondents.map((r) => {
    const features = featuresById.get(r.id) ?? null;
    const result = resultById.get(r.id);
    const centroid = result ? centroidByCluster.get(result.cluster) : undefined;
    return {
      id: r.id,
      code: r.respondentCode,
      name: r.name,
      age: r.age,
      gender: r.gender,
      university: r.university,
      faculty: r.faculty,
      studyProgram: r.studyProgram,
      semester: r.semester,
      aiUsageFrequency: r.aiUsageFrequency,
      platforms: r.platforms,
      purposes: r.purposes,
      createdAt: r.createdAt,
      features,
      dependencyScore: features ? calculateDependencyScore(features) : null,
      cluster:
        result && centroid
          ? { cluster: result.cluster, rank: centroid.rank, label: centroid.label, distanceToCentroid: result.distanceToCentroid }
          : null,
    };
  });
}

export async function getRespondentDetail(id: string) {
  const respondent = await prisma.respondent.findUnique({
    where: { id },
    include: {
      response: { include: { answers: { include: { question: true }, orderBy: { question: { order: "asc" } } } } },
    },
  });
  if (!respondent) return null;
  const [questions, run] = await Promise.all([getQuestionMeta(), getActiveRun()]);
  const answers = Object.fromEntries(respondent.response?.answers.map((a) => [a.question.code, a.value]) ?? []);
  const features = calculateFeatures(answers, questions);
  const result = run
    ? await prisma.clusteringResult.findUnique({
        where: { clusteringRunId_respondentId: { clusteringRunId: run.id, respondentId: id } },
      })
    : null;
  const centroid = result ? run?.centroids.find((c) => c.cluster === result.cluster) : undefined;
  return {
    respondent,
    features,
    dependencyScore: calculateDependencyScore(features),
    result,
    centroid,
    runK: run?.numberOfClusters ?? null,
  };
}

export async function deleteRespondent(id: string) {
  await prisma.respondent.delete({ where: { id } });
}

export async function deleteAllRespondents() {
  await prisma.$transaction([prisma.clusteringRun.deleteMany(), prisma.respondent.deleteMany()]);
}

/** Simpan kuesioner: respondent + response + answers dalam satu transaksi, kode RSP-xxxx otomatis. */
export async function createQuestionnaireSubmission(data: QuestionnaireData) {
  const questions = await prisma.question.findMany({ where: { isActive: true } });
  const missing = questions.filter((q) => data.answers[q.code] === undefined);
  if (missing.length > 0) throw new Error(`Butir belum dijawab: ${missing.map((q) => q.code).join(", ")}`);

  return prisma.$transaction(async (tx) => {
    const created = await tx.respondent.create({
      data: {
        respondentCode: `TMP-${crypto.randomUUID()}`,
        name: data.name ?? null,
        age: data.age,
        gender: data.gender,
        university: data.university,
        faculty: data.faculty,
        studyProgram: data.studyProgram,
        semester: data.semester,
        aiUsageFrequency: data.aiUsageFrequency,
        platforms: data.platforms,
        purposes: data.purposes,
        otherPlatform: data.platforms.includes("Lainnya") ? data.otherPlatform : null,
        otherPurpose: data.purposes.includes("Lainnya") ? data.otherPurpose : null,
        response: {
          create: {
            answers: { create: questions.map((q) => ({ questionId: q.id, value: data.answers[q.code] })) },
          },
        },
      },
    });
    // Kode dibentuk dari nomor urut autoincrement agar unik meski submit bersamaan
    return tx.respondent.update({
      where: { id: created.id },
      data: { respondentCode: formatRespondentCode(created.seq) },
    });
  });
}
