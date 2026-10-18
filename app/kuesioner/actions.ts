"use server";

import { revalidatePath } from "next/cache";
import { questionnaireSchema } from "@/lib/validations";
import { calculateFeatures } from "@/ml/clustering";
import { predictCategory } from "@/services/clustering.service";
import { getQuestionMeta } from "@/services/dataset.service";
import { createQuestionnaireSubmission } from "@/services/respondent.service";
import type { ActionResult } from "@/types";

export type SubmissionResult = { code: string; label: string | null; dependencyScore: number };

export async function submitQuestionnaire(input: unknown): Promise<ActionResult<SubmissionResult>> {
  const parsed = questionnaireSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Data kuesioner belum lengkap atau tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  try {
    const respondent = await createQuestionnaireSubmission(parsed.data);
    const prediction = await predictCategory(calculateFeatures(parsed.data.answers, await getQuestionMeta()));
    revalidatePath("/dashboard", "layout");
    return { ok: true, data: { code: respondent.respondentCode, ...prediction } };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan kuesioner." };
  }
}
