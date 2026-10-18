import { z } from "zod";
import { AI_FREQUENCY_OPTIONS, GENDER_OPTIONS, PLATFORM_OPTIONS, PURPOSE_OPTIONS } from "@/lib/constants";

const likert = z.number().int().min(1, "Skala 1–5").max(5, "Skala 1–5");

export const questionnaireSchema = z
  .object({
    name: z.string().trim().max(100).optional().transform((v) => v || undefined),
    age: z.coerce.number().int().min(15, "Umur minimal 15").max(80, "Umur maksimal 80"),
    gender: z.enum(GENDER_OPTIONS, { error: "Pilih jenis kelamin" }),
    university: z.string().trim().min(2, "Universitas wajib diisi").max(150),
    faculty: z.string().trim().min(2, "Fakultas wajib diisi").max(150),
    studyProgram: z.string().trim().min(2, "Program studi wajib diisi").max(150),
    semester: z.coerce.number().int().min(1, "Semester 1–14").max(14, "Semester 1–14"),
    aiUsageFrequency: z.enum(AI_FREQUENCY_OPTIONS, { error: "Pilih frekuensi penggunaan" }),
    platforms: z.array(z.enum(PLATFORM_OPTIONS)).min(1, "Pilih minimal satu platform"),
    otherPlatform: z.string().trim().max(100).optional(),
    purposes: z.array(z.enum(PURPOSE_OPTIONS)).min(1, "Pilih minimal satu tujuan"),
    otherPurpose: z.string().trim().max(100).optional(),
    /** kode butir -> nilai Likert */
    answers: z.record(z.string(), likert),
  })
  .superRefine((d, ctx) => {
    if (d.platforms.includes("Lainnya") && !d.otherPlatform)
      ctx.addIssue({ code: "custom", path: ["otherPlatform"], message: "Sebutkan platform lainnya" });
    if (d.purposes.includes("Lainnya") && !d.otherPurpose)
      ctx.addIssue({ code: "custom", path: ["otherPurpose"], message: "Sebutkan tujuan lainnya" });
  });

export type QuestionnaireData = z.output<typeof questionnaireSchema>;

export const loginSchema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Wajib diisi"),
    newPassword: z.string().min(8, "Minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export const kSchema = z.coerce.number().int().min(2).max(6);
