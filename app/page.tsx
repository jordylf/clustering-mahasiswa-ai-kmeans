import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Boxes,
  ChartScatter,
  ClipboardList,
  Code,
  Gem,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RESEARCH_TITLE } from "@/lib/research";

const AI_TOOLS = [
  { name: "ChatGPT", by: "OpenAI", desc: "Asisten percakapan serbaguna untuk menulis, merangkum, dan menjelaskan materi.", icon: MessageSquare },
  { name: "Gemini", by: "Google", desc: "Model multimodal yang terintegrasi dengan ekosistem Google.", icon: Gem },
  { name: "Claude", by: "Anthropic", desc: "Asisten AI untuk analisis dokumen panjang, penulisan, dan penalaran.", icon: Sparkles },
  { name: "Microsoft Copilot", by: "Microsoft", desc: "Asisten AI di Windows, Edge, dan Microsoft 365.", icon: Bot },
  { name: "Perplexity", by: "Perplexity AI", desc: "Mesin jawaban berbasis pencarian dengan kutipan sumber.", icon: Search },
  { name: "GitHub Copilot", by: "GitHub", desc: "Asisten pemrograman yang menyarankan kode secara langsung.", icon: Code },
];

const GOALS = [
  { title: "Mengumpulkan data", desc: "Kuesioner skala Likert 20 butir tentang pola penggunaan Generative AI.", icon: ClipboardList },
  { title: "Mengelompokkan", desc: "Algoritma K-Means mengelompokkan mahasiswa berdasarkan lima fitur perilaku.", icon: Boxes },
  { title: "Menginterpretasi", desc: "Visualisasi PCA, centroid, dan silhouette score untuk menafsirkan setiap kelompok.", icon: ChartScatter },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div
            className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30"
            style={{
              background:
                "radial-gradient(60rem 30rem at 50% -10%, color-mix(in oklch, var(--primary) 18%, transparent), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
              <ShieldCheck className="size-3.5" /> Penelitian Skripsi · Data responden anonim
            </span>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{RESEARCH_TITLE}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
              Penelitian ini bertujuan untuk mengidentifikasi pola penggunaan dan tingkat ketergantungan mahasiswa
              terhadap teknologi Generative AI dalam aktivitas akademik menggunakan algoritma K-Means Clustering.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/kuesioner" className={buttonVariants({ size: "lg", className: "h-11 px-5" })}>
                Isi Kuesioner <ArrowRight />
              </Link>
              <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "outline", className: "h-11 px-5" })}>
                <LayoutDashboard /> Dashboard Penelitian
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">± 7 menit · 20 pertanyaan · nama tidak wajib diisi</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {GOALS.map((g) => (
              <Card key={g.title} className="shadow-sm">
                <CardContent className="space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <g.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{g.title}</h3>
                  <p className="text-sm text-muted-foreground">{g.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight">Contoh Generative AI</h2>
              <p className="mt-2 text-muted-foreground">
                Generative AI adalah teknologi kecerdasan buatan yang mampu menghasilkan teks, kode, gambar, atau
                konten lain berdasarkan perintah (prompt) pengguna.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AI_TOOLS.map((t) => (
                <Card key={t.name} className="shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background">
                      <t.icon className="size-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {t.name} <span className="text-xs font-normal text-muted-foreground">· {t.by}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{t.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Bantu penelitian ini</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Jawaban Anda membantu memahami bagaimana mahasiswa memanfaatkan Generative AI secara sehat dalam kegiatan
            akademik.
          </p>
          <Link href="/kuesioner" className={buttonVariants({ size: "lg", className: "mt-6 h-11 px-5" })}>
            Mulai Isi Kuesioner <ArrowRight />
          </Link>
        </section>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Penelitian Skripsi · K-Means Clustering · {new Date().getFullYear()}
      </footer>
    </>
  );
}
