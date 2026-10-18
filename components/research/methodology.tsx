import { ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURE_LABELS, QUESTION_CATEGORIES, QUESTIONS, type QuestionCategory } from "@/lib/constants";
import { DEPENDENCY_WEIGHTS } from "@/ml/clustering/interpret";
import { METHODOLOGY_STEPS } from "@/lib/research";

export function Methodology() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <ol className="space-y-0">
        {METHODOLOGY_STEPS.map((s, i) => (
          <li key={s.title}>
            <Card className="shadow-sm">
              <CardContent className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
            {i < METHODOLOGY_STEPS.length - 1 && (
              <div className="flex justify-center py-1.5 text-muted-foreground" aria-hidden>
                <ArrowDown className="size-4" />
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardContent className="space-y-3">
            <p className="font-semibold">Fitur Clustering</p>
            <div className="space-y-2 text-sm">
              {(Object.keys(QUESTION_CATEGORIES) as QuestionCategory[]).map((cat) => {
                const codes = QUESTIONS.filter((q) => q.category === cat).map((q) => q.code);
                const feature = QUESTION_CATEGORIES[cat].feature;
                return (
                  <div key={cat} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <span>
                      <code className="text-xs">{feature}</code>
                      <span className="text-muted-foreground"> · {FEATURE_LABELS[feature]}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      mean({codes[0]}–{codes[codes.length - 1]})
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="space-y-3 text-sm">
            <p className="font-semibold">Dependency Score (0–100)</p>
            <p className="text-muted-foreground">
              Skor bantu interpretasi, <strong className="text-foreground">bukan</strong> pengganti K-Means. Setiap
              fitur dinormalisasi ke 0–1 dengan <code>(x − 1) / 4</code>, verification dibalik (reverse scoring)
              karena semakin sering memverifikasi berarti semakin rendah ketergantungan.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`DS = 100 × ( ${DEPENDENCY_WEIGHTS.frequency_score}·F + ${DEPENDENCY_WEIGHTS.task_dependency_score}·T + ${DEPENDENCY_WEIGHTS.academic_usage_score}·A
           + ${DEPENDENCY_WEIGHTS.trust_score}·Tr + ${DEPENDENCY_WEIGHTS.verification_score}·(1 − V) )`}
            </pre>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="space-y-3 text-sm">
            <p className="font-semibold">Rumus Inti</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <span className="text-foreground">Standardisasi:</span> z = (x − μ) / σ
              </li>
              <li>
                <span className="text-foreground">Inertia (WCSS):</span> Σ ‖xᵢ − μ꜀‖² — dasar Elbow Method
              </li>
              <li>
                <span className="text-foreground">Silhouette:</span> s(i) = (b − a) / max(a, b); nilai mendekati 1 berarti
                cluster semakin baik terpisah
              </li>
              <li>
                <span className="text-foreground">Label cluster:</span> centroid diurutkan berdasarkan dependency score,
                bukan nomor cluster
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
