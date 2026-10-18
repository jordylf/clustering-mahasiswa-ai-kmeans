"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CircleCheck, Loader2, Send } from "lucide-react";
import { submitQuestionnaire, type SubmissionResult } from "@/app/kuesioner/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AI_FREQUENCY_OPTIONS,
  GENDER_OPTIONS,
  LIKERT_OPTIONS,
  PLATFORM_OPTIONS,
  PURPOSE_OPTIONS,
} from "@/lib/constants";
import { formatNumber, shortLabel } from "@/lib/format";
import { cn, selectClass } from "@/lib/utils";
import { questionnaireSchema } from "@/lib/validations";

type Section = { key: string; title: string; questions: { code: string; text: string }[] };
type Errors = Record<string, string | undefined>;

const STEPS = ["Identitas", "Penggunaan AI", "Pernyataan"] as const;
const IDENTITY_FIELDS = ["name", "age", "gender", "university", "faculty", "studyProgram", "semester"] as const;
const USAGE_FIELDS = ["aiUsageFrequency", "platforms", "purposes", "otherPlatform", "otherPurpose"] as const;

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const checked = value.includes(opt);
        return (
          <label
            key={opt}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/60",
              checked && "border-primary bg-accent",
            )}
          >
            <input
              type="checkbox"
              className="size-4 accent-(--primary)"
              checked={checked}
              onChange={(e) => onChange(e.target.checked ? [...value, opt] : value.filter((v) => v !== opt))}
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

export function QuestionnaireForm({ sections }: { sections: Section[] }) {
  const allCodes = sections.flatMap((s) => s.questions.map((q) => q.code));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    university: "",
    faculty: "",
    studyProgram: "",
    semester: "",
    aiUsageFrequency: "",
    platforms: [] as string[],
    otherPlatform: "",
    purposes: [] as string[],
    otherPurpose: "",
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const payload = () => ({
    ...form,
    otherPlatform: form.otherPlatform || undefined,
    otherPurpose: form.otherPurpose || undefined,
    answers,
  });

  /** Validasi memakai skema Zod yang sama dengan server; hanya error milik langkah aktif yang ditampilkan. */
  function validate(fields: readonly string[]): boolean {
    const parsed = questionnaireSchema.safeParse(payload());
    if (parsed.success) return true;
    const next: Errors = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (fields.includes(key) && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const answered = allCodes.filter((c) => answers[c] !== undefined).length;
  const progress = step < 2 ? (step / STEPS.length) * 100 : 66 + (answered / allCodes.length) * 34;

  function next() {
    if (validate(step === 0 ? IDENTITY_FIELDS : USAGE_FIELDS)) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else toast.error("Lengkapi isian yang ditandai terlebih dahulu.");
  }

  function submit() {
    const missing = allCodes.filter((c) => answers[c] === undefined);
    if (missing.length > 0) {
      setErrors(Object.fromEntries(missing.map((c) => [c, "Wajib dijawab"])));
      document.getElementById(`q-${missing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error(`Masih ada ${missing.length} pernyataan yang belum dijawab.`);
      return;
    }
    if (!validate([...IDENTITY_FIELDS, ...USAGE_FIELDS])) {
      toast.error("Periksa kembali data identitas dan penggunaan AI.");
      return;
    }
    startTransition(async () => {
      const res = await submitQuestionnaire(payload());
      if (res.ok) {
        setResult(res.data);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.success("Kuesioner berhasil dikirim.");
      } else toast.error(res.error);
    });
  }

  if (result) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
            <CircleCheck className="size-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Terima kasih telah berpartisipasi.</h1>
            <p className="text-muted-foreground">Jawaban Anda telah tersimpan. Berikut kode responden Anda:</p>
          </div>
          <div className="rounded-xl border bg-muted/50 px-6 py-3 font-mono text-2xl font-semibold tracking-widest">
            {result.code}
          </div>
          {result.label && (
            <p className="max-w-md text-sm text-muted-foreground">
              Berdasarkan model clustering saat ini, tingkat ketergantungan Anda terhadap Generative AI berada pada
              kategori <span className="font-medium text-foreground">{shortLabel(result.label)}</span> (dependency
              score {formatNumber(result.dependencyScore)} / 100). Hasil akhir ditentukan saat peneliti menjalankan
              ulang clustering.
            </p>
          )}
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Kembali ke Beranda
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Kuesioner Penggunaan Generative AI</h1>
        <p className="text-sm text-muted-foreground">
          Data bersifat anonim dan hanya digunakan untuk keperluan penelitian. Nama boleh dikosongkan.
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={cn(i === step && "font-medium text-foreground")}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <Progress value={progress} aria-label="Progres pengisian" />
      </div>

      {step === 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Identitas Responden</CardTitle>
            <CardDescription>Kode responden dibuat otomatis setelah kuesioner dikirim.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nama / Inisial (opsional)" error={errors.name} hint="Boleh dikosongkan untuk menjaga anonimitas.">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Contoh: A. Putra" />
              </Field>
            </div>
            <Field label="Umur" error={errors.age}>
              <Input type="number" inputMode="numeric" min={15} max={80} value={form.age} aria-invalid={!!errors.age} onChange={(e) => set("age", e.target.value)} />
            </Field>
            <Field label="Jenis Kelamin" error={errors.gender}>
              <select className={selectClass} value={form.gender} aria-invalid={!!errors.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Pilih…</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Universitas" error={errors.university}>
                <Input value={form.university} aria-invalid={!!errors.university} onChange={(e) => set("university", e.target.value)} placeholder="Nama universitas" />
              </Field>
            </div>
            <Field label="Fakultas" error={errors.faculty}>
              <Input value={form.faculty} aria-invalid={!!errors.faculty} onChange={(e) => set("faculty", e.target.value)} />
            </Field>
            <Field label="Program Studi" error={errors.studyProgram}>
              <Input value={form.studyProgram} aria-invalid={!!errors.studyProgram} onChange={(e) => set("studyProgram", e.target.value)} />
            </Field>
            <Field label="Semester" error={errors.semester}>
              <select className={selectClass} value={form.semester} aria-invalid={!!errors.semester} onChange={(e) => set("semester", e.target.value)}>
                <option value="">Pilih…</option>
                {Array.from({ length: 14 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </Field>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Penggunaan Generative AI</CardTitle>
            <CardDescription>Pilih yang paling sesuai dengan kebiasaan Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Field label="Frekuensi menggunakan Generative AI" error={errors.aiUsageFrequency}>
              <div className="grid gap-2 sm:grid-cols-2">
                {AI_FREQUENCY_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/60",
                      form.aiUsageFrequency === opt && "border-primary bg-accent",
                    )}
                  >
                    <input type="radio" name="freq" className="size-4 accent-(--primary)" checked={form.aiUsageFrequency === opt} onChange={() => set("aiUsageFrequency", opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Platform AI yang digunakan" error={errors.platforms}>
              <CheckboxGroup options={PLATFORM_OPTIONS} value={form.platforms} onChange={(v) => set("platforms", v)} />
            </Field>
            {form.platforms.includes("Lainnya") && (
              <Field label="Platform lainnya" error={errors.otherPlatform}>
                <Input value={form.otherPlatform} onChange={(e) => set("otherPlatform", e.target.value)} />
              </Field>
            )}
            <Field label="Tujuan penggunaan" error={errors.purposes}>
              <CheckboxGroup options={PURPOSE_OPTIONS} value={form.purposes} onChange={(v) => set("purposes", v)} />
            </Field>
            {form.purposes.includes("Lainnya") && (
              <Field label="Tujuan lainnya" error={errors.otherPurpose}>
                <Input value={form.otherPurpose} onChange={(e) => set("otherPurpose", e.target.value)} />
              </Field>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {LIKERT_OPTIONS.map((o) => (
                <span key={o.value}>
                  <span className="font-semibold text-foreground">{o.value}</span> = {o.label}
                </span>
              ))}
              <span className="ml-auto font-medium text-foreground">
                {answered}/{allCodes.length} terjawab
              </span>
            </CardContent>
          </Card>
          {sections.map((section) => (
            <Card key={section.key} className="shadow-sm">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {section.questions.map((q) => (
                  <fieldset key={q.code} id={`q-${q.code}`} className="space-y-3 py-4 first:pt-0 last:pb-0">
                    <legend className="sr-only">{q.text}</legend>
                    <p className="text-sm">
                      <span className="mr-2 font-mono text-xs text-muted-foreground">{q.code}</span>
                      {q.text}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                      {LIKERT_OPTIONS.map((o) => {
                        const checked = answers[q.code] === o.value;
                        return (
                          <label
                            key={o.value}
                            title={o.label}
                            className={cn(
                              "flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-center transition-colors hover:bg-muted/60 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                              checked && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                              errors[q.code] && !checked && "border-destructive/60",
                            )}
                          >
                            <input
                              type="radio"
                              name={q.code}
                              value={o.value}
                              className="sr-only"
                              checked={checked}
                              onChange={() => {
                                setAnswers((a) => ({ ...a, [q.code]: o.value }));
                                setErrors((e) => ({ ...e, [q.code]: undefined }));
                              }}
                            />
                            <span className="text-sm font-semibold">{o.value}</span>
                            <span className={cn("text-[10px] leading-tight sm:text-xs", !checked && "text-muted-foreground")}>
                              <span className="sm:hidden">{o.short}</span>
                              <span className="hidden sm:inline">{o.label}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {errors[q.code] && <p className="text-xs text-destructive">{errors[q.code]}</p>}
                  </fieldset>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || pending}>
          <ArrowLeft /> Sebelumnya
        </Button>
        {step < 2 ? (
          <Button onClick={next}>
            Selanjutnya <ArrowRight />
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Send />} Kirim Jawaban
          </Button>
        )}
      </div>
    </div>
  );
}
