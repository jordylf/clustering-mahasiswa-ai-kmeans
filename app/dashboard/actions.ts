"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { kSchema, passwordSchema } from "@/lib/validations";
import { runClustering } from "@/services/clustering.service";
import { deleteAllRespondents, deleteRespondent } from "@/services/respondent.service";
import type { ActionResult } from "@/types";

const fail = (e: unknown, fallback: string): ActionResult => {
  console.error(e);
  return { ok: false, error: e instanceof Error ? e.message : fallback };
};

export async function runClusteringAction(k: number): Promise<ActionResult> {
  await requireAdmin();
  const parsed = kSchema.safeParse(k);
  if (!parsed.success) return { ok: false, error: "Jumlah cluster harus 2–6." };
  try {
    await runClustering(parsed.data);
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e, "Gagal menjalankan clustering.");
  }
}

export async function deleteRespondentAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteRespondent(id);
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e, "Gagal menghapus responden.");
  }
}

export async function deleteAllRespondentsAction(): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteAllRespondents();
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e, "Gagal menghapus data.");
  }
}

export type PasswordState = { ok?: boolean; error?: string };

export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireAdmin();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!verifyPassword(parsed.data.currentPassword, record.passwordHash)) {
    return { error: "Password saat ini salah." };
  }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(parsed.data.newPassword) } });
  return { ok: true };
}
