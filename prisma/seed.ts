import { PrismaClient } from "@prisma/client";
import { QUESTIONS } from "../lib/constants";
import { hashPassword } from "../lib/password";
import { generateRespondents } from "./seed-generator";

const prisma = new PrismaClient();
const COUNT = Number(process.env.SEED_COUNT ?? 150);

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@skripsi.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Peneliti", passwordHash: hashPassword(password) },
  });

  for (const [order, q] of QUESTIONS.entries()) {
    await prisma.question.upsert({
      where: { code: q.code },
      update: { text: q.text, category: q.category, isReversed: !!q.isReversed, order },
      create: { code: q.code, text: q.text, category: q.category, isReversed: !!q.isReversed, order },
    });
  }
  const questions = await prisma.question.findMany();
  const idByCode = new Map(questions.map((q) => [q.code, q.id]));

  // Reset data responden & hasil clustering agar seed dapat dijalankan ulang
  await prisma.clusteringRun.deleteMany();
  await prisma.respondent.deleteMany();
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Respondent_seq_seq" RESTART WITH 1`);

  const data = generateRespondents(COUNT);
  for (const [i, r] of data.entries()) {
    const createdAt = new Date(Date.now() - (data.length - i) * 3 * 60 * 60 * 1000);
    await prisma.respondent.create({
      data: {
        respondentCode: `RSP-${String(i + 1).padStart(4, "0")}`,
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
        createdAt,
        response: {
          create: {
            submittedAt: createdAt,
            answers: {
              create: Object.entries(r.answers).map(([code, value]) => ({ questionId: idByCode.get(code)!, value })),
            },
          },
        },
      },
    });
  }
  console.log(`Seed selesai: ${data.length} responden, ${questions.length} butir, admin ${email}`);

  // Clustering awal (K = 3) agar dashboard langsung terisi
  const { runClustering } = await import("../services/clustering.service");
  const run = await runClustering(3);
  console.log(`Clustering awal: K=3, silhouette=${run.silhouetteScore.toFixed(4)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
