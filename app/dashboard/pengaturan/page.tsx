import type { Metadata } from "next";
import { CardSection } from "@/components/shared/card-section";
import { PageHeader } from "@/components/shared/page-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const user = await requireAdmin();
  const mlUrl = process.env.ML_API_URL;
  return (
    <>
      <PageHeader title="Pengaturan" description="Akun peneliti, tampilan, dan konfigurasi engine machine learning." />
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSection title="Akun">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nama</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Peran</dt>
              <dd>
                <Badge variant="secondary">{user.role}</Badge>
              </dd>
            </div>
          </dl>
        </CardSection>

        <CardSection title="Tampilan" description="Mode terang / gelap">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            <span>Ganti tema</span>
            <ThemeToggle />
          </div>
        </CardSection>

        <CardSection title="Ubah Password">
          <PasswordForm />
        </CardSection>

        <CardSection title="Engine Machine Learning">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Engine aktif</span>
              <Badge>{mlUrl ? "Python (FastAPI + scikit-learn)" : "TypeScript (bawaan)"}</Badge>
            </div>
            {mlUrl && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ML_API_URL</span>
                <code className="text-xs">{mlUrl}</code>
              </div>
            )}
            <p className="text-muted-foreground">
              Isi variabel <code>ML_API_URL</code> di <code>.env</code> (mis. <code>http://localhost:8000</code>) lalu
              jalankan <code>ml/python/service.py</code> untuk memakai scikit-learn. Kontrak input/output kedua engine
              identik.
            </p>
          </div>
        </CardSection>

        <CardSection title="Autentikasi Produksi" className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">
            MVP ini memakai satu akun admin (dibuat dari <code>ADMIN_EMAIL</code>/<code>ADMIN_PASSWORD</code>) dengan
            password ter-hash scrypt dan cookie sesi yang ditandatangani HMAC (<code>AUTH_SECRET</code>). Untuk produksi:
            gunakan <code>AUTH_SECRET</code> acak minimal 32 karakter, aktifkan HTTPS, ganti password default, dan
            pertimbangkan Auth.js / Better Auth bila membutuhkan banyak pengguna, OAuth kampus, atau reset password via
            email. Lihat README bagian Autentikasi.
          </p>
        </CardSection>
      </div>
    </>
  );
}
