# GenAI Dependency Clustering

Aplikasi web penelitian skripsi:

> **Clustering Tingkat Ketergantungan Mahasiswa terhadap Generative AI dalam Aktivitas Akademik Menggunakan Algoritma K-Means**

Aplikasi ini mengumpulkan data kuesioner mahasiswa, melakukan preprocessing, menjalankan K-Means, mengevaluasi jumlah cluster (Elbow + Silhouette), memvisualisasikan hasil dengan PCA, dan menyediakan export dataset untuk skripsi.

## Daftar Isi

- [Tujuan Penelitian](#tujuan-penelitian)
- [Tech Stack dan Arsitektur](#tech-stack)
- [Struktur Project](#struktur-project)
- [Instalasi](#instalasi)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Prisma Migration](#prisma-migration)
- [Seed Database](#seed-database)
- [Menjalankan Development Server](#menjalankan-development-server)
- [Menjalankan Machine Learning](#menjalankan-machine-learning)
- [Metodologi K-Means](#metodologi-k-means)
- [Penjelasan Feature](#penjelasan-feature)
- [Formula Dependency Score](#formula-dependency-score)
- [Cara Menentukan K Optimal](#cara-menentukan-k-optimal)
- [Visualisasi PCA](#visualisasi-pca)
- [Export](#export)
- [Autentikasi](#autentikasi)
- [Validasi](#validasi)
- [Halaman dan Hak Akses](#halaman-dan-hak-akses)
- [Model Database dan Relasi](#model-database-dan-relasi)
- [Instrumen Kuesioner](#instrumen-kuesioner)
- [Alur Data dan Penyimpanan Hasil](#alur-data-dan-penyimpanan-hasil)
- [Panduan Demo](#panduan-demo)
- [Daftar Perintah](#daftar-perintah)
- [Troubleshooting](#troubleshooting)
- [Batasan dan Pengembangan Lanjutan](#batasan-dan-pengembangan-lanjutan)

## Tujuan Penelitian

1. Mengumpulkan data penggunaan Generative AI oleh mahasiswa.
2. Mengolah data menggunakan algoritma K-Means.
3. Mengelompokkan mahasiswa berdasarkan tingkat ketergantungan terhadap Generative AI.
4. Menampilkan hasil clustering dalam dashboard dan visualisasi.
5. Memberikan interpretasi setiap cluster berdasarkan nilai centroid.
6. Menampilkan hasil clustering setiap mahasiswa.
7. Menyediakan dataset untuk bahan penelitian.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, shadcn/ui (Base UI), Lucide Icons, Recharts |
| Backend | Next.js Server Actions + Route Handlers |
| Database | PostgreSQL + Prisma ORM 6 |
| Validasi | Zod |
| Machine Learning | Engine TypeScript bawaan (`ml/clustering`) **atau** Python service (FastAPI + scikit-learn + pandas + numpy) di `ml/python` |
| Export | CSV, Excel (exceljs), laporan PDF (print-to-PDF) |

### Arsitektur

```
Browser ──► Next.js (app/)            UI: halaman & komponen
              │
              ├─ Server Actions / API  app/**/actions.ts, app/api/export
              │
              ├─ services/             business logic + akses database (Prisma)
              │     └─ clustering.service.ts ──┬─► ml/clustering (TypeScript, default)
              │                                 └─► ml/python/service.py (bila ML_API_URL diisi)
              └─ prisma/               schema, migrasi, seed
```

Proses ML dipisahkan dari UI dan database. Engine TypeScript dan Python service memakai **kontrak yang sama** (`EngineOutput` di `ml/clustering/types.ts`): input matriks fitur `n × 5` dan `k`, output label, centroid, inertia, silhouette, scaler, dan koordinat PCA. Pemetaan label dan dependency score tetap dilakukan di TypeScript sehingga hasil kedua engine diinterpretasi dengan cara yang sama.

## Struktur Project

```
app/
  page.tsx                  Landing page penelitian
  kuesioner/                Form kuesioner responden + server action submit
  metodologi/               Halaman metodologi (publik)
  login/                    Login admin
  dashboard/                Area admin (sidebar)
    page.tsx                Dashboard statistik
    responden/              Data responden + detail [id]
    kuesioner/              Daftar butir & statistik jawaban
    clustering/             Jalankan K-Means, evaluasi, centroid, interpretasi
    visualisasi/            Scatter plot PCA
    analisis/               Elbow Method & Silhouette (K = 2..6)
    hasil/                  Feature score & cluster setiap mahasiswa
    export/                 Export CSV / Excel
    laporan/                Laporan hasil clustering (cetak PDF)
    metodologi/             Metodologi (untuk presentasi sidang)
    pengaturan/             Akun, tema, engine ML
    actions.ts              Server actions admin
  api/export/route.ts       Download CSV / XLSX
components/
  ui/                       Komponen shadcn/ui
  layout/                   Sidebar, header, provider tema
  charts/                   Komponen Recharts (donut, bar, line, scatter, radar)
  clustering/ respondents/ questionnaire/ research/ shared/
lib/                        constants (butir X1–X20), auth, db, validasi Zod, format
services/                   dataset, clustering, respondent, dashboard, export
ml/clustering/              preprocess, kmeans, pca, interpret + self-check
ml/python/                  FastAPI + scikit-learn service
prisma/                     schema.prisma, migrations, seed.ts, seed-generator.ts
scripts/                    local-db.mjs (PostgreSQL lokal), run-clustering.ts
types/                      Tipe bersama
```

## Instalasi

Prasyarat: Node.js **20.9 atau lebih baru**, npm, dan PostgreSQL (atau gunakan PostgreSQL lokal bawaan, lihat di bawah). Python diperlukan hanya jika memilih engine scikit-learn.

```bash
npm install
cp .env.example .env
```

Di Windows PowerShell, gunakan `Copy-Item .env.example .env` untuk menyalin konfigurasi. Pada checkout dengan lockfile yang sudah tersedia, `npm ci` dapat digunakan sebagai pengganti `npm install` untuk mengikuti versi di `package-lock.json`. Jangan menimpa `.env` yang sudah berisi konfigurasi Anda.

## Environment Variables

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Koneksi PostgreSQL |
| `ADMIN_EMAIL` | Email admin yang dibuat saat seed |
| `ADMIN_PASSWORD` | Password admin awal |
| `AUTH_SECRET` | Rahasia penandatangan cookie sesi (min. 32 karakter acak) |
| `NEXT_PUBLIC_APP_URL` | URL aplikasi |
| `ML_API_URL` | Opsional. URL Python ML service, mis. `http://localhost:8000`. Kosong = engine TypeScript |

## Database Setup

**Opsi A — PostgreSQL sendiri / Docker:** buat database lalu isi `DATABASE_URL`.

```bash
docker run --name skripsi-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=skripsi_kmeans -p 5433:5432 -d postgres:16
```

**Opsi B — tanpa instalasi (embedded PostgreSQL):** jalankan di terminal terpisah dan biarkan tetap berjalan.

```bash
npm run db:local
```

Nilai `DATABASE_URL` di `.env.example` sudah cocok untuk opsi B (port 5433).

## Prisma Migration

```bash
npm run db:migrate
```

## Seed Database

```bash
npm run db:seed
```

**Perhatian: seed menghapus seluruh responden dan riwayat clustering yang sudah ada, lalu mengulang nomor responden dari awal. Jalankan hanya pada database pengembangan atau database demo yang boleh direset.** Akun admin yang sudah ada tidak diubah passwordnya oleh seed.

Seed membuat akun admin, 20 butir kuesioner, **150 responden dummy berpola**, lalu langsung menjalankan clustering awal K = 3. Generator (`prisma/seed-generator.ts`) membangkitkan responden dari tiga profil (peluang rendah 30%, sedang 40%, tinggi 30%) dengan variasi individu dan noise per butir, misalnya butir coding X12 lebih tinggi pada prodi teknologi dan GitHub Copilot hanya pada prodi teknologi. Sekitar 3% **responden** dibuat memiliki satu jawaban kosong untuk mendemonstrasikan imputasi missing value. Data ini sintetis untuk pengujian dan demonstrasi; hasilnya bukan temuan empiris penelitian.

Mengubah jumlah seed di PowerShell:

```powershell
$env:SEED_COUNT = "300"
npm run db:seed
Remove-Item Env:SEED_COUNT
```

Pada Bash: `SEED_COUNT=300 npm run db:seed`.

## Menjalankan Development Server

```bash
npm run dev
```

Buka http://localhost:3000. Dashboard: http://localhost:3000/dashboard (login dengan `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

Perintah lain: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run db:studio`.

## Menjalankan Machine Learning

- **Dari UI:** menu *Clustering* → pilih K → *Jalankan K-Means*. Menu *Analisis* menampilkan Elbow dan Silhouette.
- **Dari terminal:** `npm run ml:run -- 3` (evaluasi K = 2..6 lalu clustering dengan K = 3).
- **Self-check algoritma:** `npm run test:ml` (preprocessing, scaler, K-Means, silhouette, PCA, mapping label, dan pipeline pada data seed).
- **Python service (scikit-learn):**

  ```bash
  pip install -r ml/python/requirements.txt
  uvicorn service:app --app-dir ml/python --port 8000
  ```

  Lalu isi `ML_API_URL="http://localhost:8000"` di `.env` dan restart `npm run dev`. Untuk memvalidasi hasil engine TypeScript dengan scikit-learn, export CSV *Feature preprocessing* lalu jalankan `python ml/python/service.py --csv features-YYYY-MM-DD.csv --k 3`.

## Metodologi K-Means

1. **Pengumpulan data** — kuesioner identitas, frekuensi, platform, tujuan, dan 20 butir Likert (1–5).
2. **Data cleaning** — nilai di luar 1–5 dianggap tidak valid; responden dengan > 50% jawaban kosong dibuang.
3. **Missing value** — diisi median butir.
4. **Konversi Likert** — jawaban disimpan sebagai integer 1–5 (tabel `Answer`).
5. **Reverse scoring** — butir verifikasi (X15–X17) bertanda `isReversed` dan dibalik `(1 − V)` pada dependency score. Pada K-Means, arah fitur tidak memengaruhi jarak Euclidean setelah standardisasi, sehingga `verification_score` tetap disimpan dalam arah aslinya agar mudah dibaca (tinggi = sering memverifikasi).
6. **Feature aggregation** — rata-rata butir per dimensi menjadi 5 fitur.
7. **Standardisasi** — StandardScaler `z = (x − μ) / σ` (σ populasi, sama dengan scikit-learn).
8. **K-Means** — inisialisasi k-means++, 10 kali restart (`n_init = 10`), maks. 300 iterasi, toleransi 1e-4, seed 42 (hasil dapat direproduksi). Hasil dengan inertia terkecil dipilih.
9. **Evaluasi** — Silhouette Score dan inertia.
10. **Interpretasi** — centroid dikembalikan ke skala asli (1–5), diurutkan berdasarkan dependency score, lalu diberi label.

### Mapping label cluster

Nomor cluster K-Means bersifat acak, sehingga label **tidak** di-hardcode. Centroid diurutkan berdasarkan dependency score centroid:

| K | Label (rendah → tinggi) |
|---|---|
| 2 | Rendah, Tinggi |
| 3 | Rendah, Sedang, Tinggi |
| 4 | Rendah, Sedang, Tinggi, Sangat Tinggi |
| 5 | Sangat Rendah, Rendah, Sedang, Tinggi, Sangat Tinggi |
| 6 | Sangat Rendah, Rendah, Sedang, Cukup Tinggi, Tinggi, Sangat Tinggi |

Interpretasi setiap cluster disusun otomatis dari nilai centroid aktual (rendah < 2,5 ≤ sedang < 3,5 ≤ tinggi).

## Penjelasan Feature

| Feature | Butir | Makna |
|---|---|---|
| `frequency_score` | X1–X4 | Seberapa sering Generative AI dipakai dalam kegiatan akademik |
| `task_dependency_score` | X5–X8 | Ketergantungan pada AI dalam menyelesaikan tugas |
| `academic_usage_score` | X9–X14 | Keluasan pemanfaatan AI (ide, rangkuman, coding, laporan, referensi) |
| `verification_score` | X15–X17 | Kebiasaan memverifikasi jawaban AI (berarah negatif terhadap ketergantungan) |
| `trust_score` | X18–X20 | Tingkat kepercayaan terhadap jawaban AI |

Setiap feature = rata-rata butirnya (skala 1–5).

## Formula Dependency Score

Dependency score (0–100) **hanya membantu interpretasi**; cluster utama tetap hasil K-Means.

Setiap fitur dinormalisasi: `n(x) = (x − 1) / 4` → 0..1.

```
DS = 100 × ( 0.25·n(F) + 0.30·n(T) + 0.15·n(A) + 0.15·n(Tr) + 0.15·(1 − n(V)) )
```

F = frequency, T = task dependency, A = academic usage, Tr = trust, V = verification. Task dependency diberi bobot terbesar karena paling langsung mengukur ketergantungan; verification dibalik karena semakin sering memverifikasi berarti semakin rendah ketergantungan. Bobot dapat diubah di `ml/clustering/interpret.ts` (`DEPENDENCY_WEIGHTS`).

## Cara Menentukan K Optimal

Menu **Analisis** menguji K = 2 sampai 6:

- **Elbow Method** — grafik Jumlah Cluster vs Inertia (WCSS = Σ‖xᵢ − μ꜀‖²). K optimal berada di "siku", titik ketika penurunan inertia mulai melandai.
- **Silhouette Score** — `s(i) = (b − a) / max(a, b)`, a = jarak rata-rata ke anggota cluster sendiri, b = jarak rata-rata terkecil ke cluster lain. Nilai mendekati 1 berarti cluster semakin baik terpisah.

Aplikasi merekomendasikan K dengan silhouette tertinggi ("Nilai K yang direkomendasikan berdasarkan Silhouette Score adalah K = X"), dan admin tetap dapat memilih K secara manual. Pada data seed, K = 3 menghasilkan silhouette ±0,57 dan siku yang jelas pada grafik inertia.

## Visualisasi PCA

Lima fitur terstandardisasi direduksi menjadi 2 komponen utama (dekomposisi eigen matriks kovarians). Persentase variansi yang dijelaskan PC1 dan PC2 ditampilkan pada grafik. PCA hanya untuk visualisasi; clustering dilakukan pada 5 dimensi penuh.

## Export

- **CSV:** dataset lengkap, data responden, raw questionnaire, feature preprocessing (termasuk z-score), hasil clustering.
- **Excel:** satu workbook berisi semua sheet + centroid + metadata run.
- **PDF:** menu *Export → Laporan*, lalu *Cetak / Simpan PDF* (print-to-PDF dari browser).

## Autentikasi

MVP memakai satu akun admin dari `ADMIN_EMAIL` / `ADMIN_PASSWORD` (dibuat oleh seed). Password disimpan dengan hash **scrypt**, dan sesi disimpan dalam cookie `httpOnly` yang ditandatangani **HMAC-SHA256** dengan `AUTH_SECRET` (berlaku 8 jam). `proxy.ts` melakukan pengecekan cepat, sedangkan verifikasi sesi sesungguhnya dilakukan `requireAdmin()` di setiap halaman, server action, dan route export.

Untuk produksi:

1. Ganti `AUTH_SECRET` dengan string acak ≥ 32 karakter (`openssl rand -base64 32`).
2. Ganti password admin melalui menu *Pengaturan* setelah login pertama.
3. Jalankan di balik HTTPS (cookie otomatis `secure` saat `NODE_ENV=production`).
4. Bila membutuhkan banyak pengguna, SSO kampus, atau reset password via email, ganti `lib/auth.ts` dengan Auth.js atau Better Auth; model `User` sudah tersedia.

## Validasi

- Kuesioner tidak dapat dikirim kosong; semua butir wajib dijawab (dicek di client dan server dengan skema Zod yang sama).
- Jawaban harus integer 1–5.
- Kode responden dibuat otomatis `RSP-0001`, `RSP-0002`, … dari nomor urut autoincrement (aman untuk submit bersamaan).
- Setelah submit ditampilkan halaman "Terima kasih telah berpartisipasi." beserta kode responden.

## Halaman dan Hak Akses

| Rute | Akses | Isi / tindakan utama |
|---|---|---|
| `/` | Publik | Judul penelitian, deskripsi, contoh platform AI, tautan kuesioner dan dashboard |
| `/kuesioner` | Publik | Form bertahap: identitas, penggunaan AI, jawaban Likert, dan konfirmasi tersimpan |
| `/metodologi` | Publik | Alur penelitian dan penjelasan fitur, standardisasi, serta dependency score |
| `/login` | Publik | Login peneliti/admin |
| `/dashboard` | Admin | Statistik responden, distribusi cluster, platform, tujuan, semester, dan skor |
| `/dashboard/responden` | Admin | Pencarian, filter universitas/prodi/semester/cluster, sort, paginasi, dan hapus data |
| `/dashboard/responden/[id]` | Admin | Profil, jawaban mentah, fitur, radar chart, cluster, dan interpretasi responden |
| `/dashboard/kuesioner` | Admin | Daftar butir kuesioner dan statistik jawaban |
| `/dashboard/clustering` | Admin | Pilih K, jalankan clustering, lihat metrik, centroid, interpretasi, dan riwayat run |
| `/dashboard/visualisasi` | Admin | Scatter PCA dua dimensi dengan kode responden, cluster, dan skor saat hover |
| `/dashboard/analisis` | Admin | Elbow dan Silhouette K=2–6, rekomendasi K |
| `/dashboard/hasil` | Admin | Tabel hasil responden dengan lima fitur dan hasil cluster |
| `/dashboard/export` | Admin | Pilih unduhan CSV, Excel, atau buka laporan |
| `/dashboard/laporan` | Admin | Laporan hasil clustering untuk dicetak / disimpan sebagai PDF |
| `/dashboard/metodologi` | Admin | Materi alur penelitian di dalam dashboard |
| `/dashboard/pengaturan` | Admin | Informasi akun, perubahan password, dan konfigurasi engine |
| `/api/export` | Admin | Endpoint unduhan dataset CSV / XLSX |

Sidebar menjadi drawer pada layar kecil. Tema terang/gelap mengikuti pengaturan tema yang dipilih. Loading menggunakan skeleton; tindakan hapus dan menjalankan clustering memakai dialog konfirmasi.

Contoh URL unduhan setelah login:

```text
/api/export?format=csv&dataset=full
/api/export?format=csv&dataset=respondents
/api/export?format=csv&dataset=raw
/api/export?format=csv&dataset=features
/api/export?format=csv&dataset=clustering
/api/export?format=xlsx
```

CSV mengekspor dataset yang dipilih. XLSX selalu berisi sheet Info, Responden, Raw Kuesioner, Fitur, Hasil Clustering, dan Centroid. Laporan PDF memakai dialog cetak browser, sehingga tidak memerlukan layanan konversi terpisah.

## Model Database dan Relasi

Schema lengkap berada di [`prisma/schema.prisma`](prisma/schema.prisma); migrasi SQL ada di [`prisma/migrations`](prisma/migrations).

| Model | Peran | Field penting |
|---|---|---|
| `User` | Akun peneliti/admin | `email` unik, `name`, `passwordHash`, `role` |
| `Respondent` | Profil mahasiswa | `seq`, `respondentCode` unik, nama opsional, umur, gender, kampus, fakultas, prodi, semester, frekuensi, platform, tujuan |
| `Question` | Definisi butir | `code` unik, `text`, `category`, `isReversed`, `order`, `isActive` |
| `QuestionnaireResponse` | Satu pengisian per responden | `respondentId` unik, `submittedAt` |
| `Answer` | Jawaban fleksibel per butir | `responseId`, `questionId`, `value`; pasangan response/butir unik |
| `ClusteringRun` | Metadata satu eksekusi ML | K, silhouette, inertia, iterasi, jumlah data, engine, centroid, label, scaler, PCA, laporan preprocessing, status aktif |
| `ClusteringResult` | Hasil per responden per run | Cluster, label, dependency score, jarak centroid, fitur, koordinat PCA |

Relasi utama:

```text
Respondent 1 ── 0..1 QuestionnaireResponse 1 ── * Answer * ── 1 Question
Respondent 1 ── * ClusteringResult * ── 1 ClusteringRun
User       (akun admin terpisah dari responden)
```

Menghapus responden juga menghapus jawaban dan hasil clustering miliknya melalui relasi cascade. Menghapus semua responden melalui aplikasi juga menghapus riwayat run. Kode responden berasal dari sequence PostgreSQL; nomor dapat melompat setelah penghapusan atau transaksi gagal dan tidak harus berurutan tanpa celah.

## Instrumen Kuesioner

Definisi teks lengkap X1–X20 dan opsi jawaban ada di [`lib/constants.ts`](lib/constants.ts). Seed menyimpan definisi ini ke tabel `Question`, sedangkan form membaca butir aktif dari database.

| Kelompok | Butir | Cakupan pernyataan |
|---|---|---|
| A. Frekuensi | X1–X4 | Pemakaian harian, saat tugas, banyak platform, dan proses belajar |
| B. Ketergantungan tugas | X5–X8 | Kesulitan tanpa AI, AI sebagai alat utama, pemakaian jawaban langsung, bantuan solusi |
| C. Pemanfaatan akademik | X9–X14 | Ide, rangkuman, pemahaman materi, coding, laporan, referensi awal |
| D. Verifikasi | X15–X17 | Cek ulang informasi, perbandingan sumber, pemeriksaan referensi |
| E. Kepercayaan | X18–X20 | Kepercayaan jawaban, penggantian pencarian manual, preferensi bertanya ke AI |

| Nilai Likert | Arti |
|---|---|
| 1 | Sangat Tidak Setuju |
| 2 | Tidak Setuju |
| 3 | Netral |
| 4 | Setuju |
| 5 | Sangat Setuju |

Identitas mencakup nama opsional, umur, jenis kelamin, universitas, fakultas, program studi, dan semester. Platform serta tujuan memakai pilihan jamak, termasuk isian tambahan untuk pilihan “Lainnya”. Frekuensi penggunaan memiliki lima opsi dari “Tidak pernah” sampai “Lebih dari 3 kali per hari”.

Profil, frekuensi kategorikal, platform, dan tujuan dipakai untuk deskripsi responden dan grafik. Input K-Means saat ini hanya **lima fitur numerik hasil agregasi Likert**, sehingga data identitas tidak ikut menentukan jarak cluster.

Nama opsional mengurangi penggunaan identitas langsung, tetapi kombinasi kampus/prodi/semester dan atribut lain tetap dapat mengidentifikasi seseorang. Penanganan dan pembagian dataset perlu mengikuti persetujuan responden.

## Alur Data dan Penyimpanan Hasil

1. Form memvalidasi identitas, pola penggunaan, dan kelengkapan jawaban. Server memeriksa skema Zod serta butir aktif sebelum menyimpan.
2. Responden, pengisian, jawaban, dan kode RSP disimpan dalam satu transaksi database.
3. Jika sudah ada model aktif, halaman terima kasih menampilkan kategori sementara berdasarkan centroid terdekat menggunakan scaler model aktif. Prediksi ini tidak menambahkan `ClusteringResult` baru.
4. Saat admin menjalankan clustering, seluruh dataset dibaca ulang, dibersihkan, diimputasi, dan diagregasi.
5. Engine menerima matriks fitur berurutan: frequency, task dependency, academic usage, verification, trust. Standardisasi dilakukan di engine sebelum clustering.
6. Hasil baru disimpan sebagai `ClusteringRun` dan `ClusteringResult`. Run lama dinonaktifkan dan run baru menjadi aktif dalam transaksi yang sama.
7. Dashboard dan export mengambil cluster dari run aktif. Responden yang masuk setelah run terakhir belum memiliki cluster tersimpan sampai clustering dijalankan ulang.

Evaluasi K optimal membutuhkan minimal **7 responden valid** agar seluruh K=2–6 dapat diperiksa. Menjalankan clustering melalui service membutuhkan minimal `max(K + 1, 10)` responden valid; untuk pilihan K=2–6 di UI berarti minimal **10**.

Metadata run menyimpan centroid skala asli, label, mean/std scaler, rasio variansi PCA, centroid terstandardisasi untuk prediksi, dan jumlah nilai yang diimputasi/dibuang. Riwayat pada halaman clustering menampilkan sepuluh run terbaru.

### Pembagian tugas antar-engine

| Tahap | TypeScript default | Python opsional |
|---|---|---|
| Baca database, cleaning, imputasi, agregasi | Next.js / TypeScript | Tetap Next.js / TypeScript |
| Standardisasi | Implementasi lokal | `StandardScaler` |
| K-Means | K-means++ + Lloyd | `sklearn.cluster.KMeans` |
| Silhouette | Jarak Euclidean berpasangan | `sklearn.metrics.silhouette_score` |
| PCA | Eigen Jacobi pada kovarians | `sklearn.decomposition.PCA` |
| Label, skor, interpretasi, penyimpanan | TypeScript / Prisma | Tetap TypeScript / Prisma |

Service Python menyediakan `GET /health`, `POST /cluster`, dan `POST /evaluate`. Setelah service berjalan, dokumentasi endpoint FastAPI tersedia di `http://localhost:8000/docs`. Gunakan `python -m uvicorn service:app --app-dir ml/python --host 127.0.0.1 --port 8000` bila executable `uvicorn` tidak terbaca dari PATH.

Engine menggunakan seed yang tetap, tetapi generator acak, kriteria berhenti, dan algoritma numerik kedua implementasi berbeda. Nomor cluster, orientasi PCA, atau metrik tidak dijamin identik lintas-engine. Bandingkan pola anggota, centroid, dan metrik dengan toleransi yang sesuai; jangan membandingkan nomor cluster mentah secara langsung.

## Panduan Demo

Untuk instalasi pertama di Windows PowerShell:

```powershell
# Terminal 1 — setup dependensi dan database lokal
npm ci
Copy-Item .env.example .env
npm run db:local
```

```powershell
# Terminal 2 — migrasi yang sudah tersimpan, data demo, dan web
npm run db:deploy
npm run db:seed
npm run dev
```

`db:deploy` menerapkan migrasi yang sudah ada. Gunakan `db:migrate` ketika mengembangkan perubahan schema dan perlu membuat migrasi baru. Sesuaikan rahasia dan kredensial di `.env` sebelum aplikasi digunakan di luar komputer pengembangan.

Urutan presentasi yang dapat dicoba:

1. Buka landing page dan jelaskan tujuan penelitian.
2. Tunjukkan kuesioner, butir Likert, nama opsional, dan validasi jawaban.
3. Login ke dashboard menggunakan akun dari `.env`.
4. Tampilkan Data Responden, filter satu kampus, lalu buka detail dan radar chart.
5. Buka Analisis untuk membandingkan inertia dan silhouette; jelaskan alasan pemilihan K.
6. Jalankan K-Means di menu Clustering; tunjukkan metrik, centroid, dan interpretasi.
7. Buka Visualisasi Clustering dan arahkan kursor ke titik mahasiswa.
8. Tampilkan Hasil Responden dan unduh dataset melalui Export.
9. Buka Metodologi atau laporan untuk menjelaskan keseluruhan alur penelitian.

Semua angka demo dari seed harus disebut sebagai hasil pengujian data sintetis. Untuk penelitian sebenarnya, kumpulkan data responden yang sah, jalankan ulang pipeline, dan laporkan metrik hasil data tersebut.

## Daftar Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan Next.js |
| `npm run build` | Build produksi dan pemeriksaan TypeScript oleh Next.js |
| `npm run start` | Menjalankan hasil build produksi |
| `npm run lint` | Pemeriksaan ESLint |
| `npm run typecheck` | Pemeriksaan tipe tanpa menghasilkan berkas JS |
| `npm run db:local` | PostgreSQL embedded pada port 5433, data di `.pgdata` |
| `npm run db:migrate` | Membuat / menerapkan migrasi untuk pengembangan |
| `npm run db:deploy` | Menerapkan migrasi yang sudah tersimpan |
| `npm run db:seed` | Reset data responden/run, isi data demo, dan clustering awal |
| `npm run db:studio` | Membuka Prisma Studio untuk melihat database |
| `npm run ml:run -- 3` | Evaluasi K lalu simpan hasil clustering K=3 |
| `npm run test:ml` | Self-check preprocessing, scaler, clustering, silhouette, PCA, dan label |
| `npx prisma generate` | Membuat ulang Prisma Client setelah schema berubah |

`test:ml` tidak membutuhkan database. Pemeriksaan web dengan login, penyimpanan kuesioner, dan export membutuhkan database aktif. Self-check ini belum merupakan pengujian integrasi atau uji browser otomatis yang lengkap.

## Troubleshooting

| Gejala | Pemeriksaan / tindakan |
|---|---|
| Prisma gagal terhubung / P1001 | Pastikan PostgreSQL berjalan, port sesuai, dan `DATABASE_URL` benar. `db:local` perlu tetap berjalan di terminal terpisah. |
| Tabel tidak ditemukan | Jalankan `npm run db:deploy` pada database yang dimaksud. |
| Prisma Client belum dibuat | Jalankan `npx prisma generate`, lalu ulangi perintah web. |
| Kuesioner belum tersedia | Pastikan tabel `Question` terisi dan aktif. Pada database demo baru, jalankan seed; jangan menjalankan seed pada data penelitian yang perlu dipertahankan. |
| Login gagal setelah mengubah `.env` | `ADMIN_EMAIL` / `ADMIN_PASSWORD` dipakai saat pembuatan akun oleh seed. Akun lama tidak otomatis berubah; gunakan Pengaturan untuk mengganti password. |
| `AUTH_SECRET` belum diatur | Isi rahasia acak di `.env`, lalu restart server. Implementasi memeriksa minimal 16 karakter; contoh konfigurasi menyarankan minimal 32. |
| Port 5433 sudah digunakan | Hentikan database demo yang duplikat atau gunakan PostgreSQL sendiri dengan URL yang sesuai. |
| Port web 3000 terpakai | Gunakan `npm run dev -- --port 3001` dan sesuaikan URL aplikasi. |
| Clustering ditolak karena data kurang | Tambah responden sampai minimal 10 data valid dan periksa jumlah baris yang dibuang preprocessing. |
| Responden baru belum memiliki cluster di tabel | Jalankan ulang clustering. Prediksi sesudah submit bersifat sementara. |
| Koneksi ke Python gagal | Periksa `ML_API_URL`, jalankan FastAPI, uji `/health`, atau kosongkan variabel untuk engine default dan restart Next.js. |
| Hasil berubah sesudah data dihapus/ditambah | Dataset, median imputasi, scaler, dan centroid dapat berubah. Jalankan ulang clustering sebelum export hasil akhir. |

## Batasan dan Pengembangan Lanjutan

- **Instrumen dan bobot:** pernyataan, bobot dependency score, dan ambang interpretasi merupakan konfigurasi aplikasi. Validitas, reliabilitas, dan justifikasi teorinya perlu ditetapkan dalam rancangan penelitian bersama pembimbing.
- **Makna label:** rendah/sedang/tinggi menyatakan urutan centroid dalam dataset yang dianalisis. Label bukan diagnosis atau batas ketergantungan yang telah divalidasi secara klinis. K=3 merupakan default; rekomendasi K dapat berbeda pada data nyata.
- **Skala data:** agregasi Likert diperlakukan sebagai fitur numerik untuk jarak Euclidean. Asumsi ini dan perlakuan X12 bagi mahasiswa non-coding perlu dibahas dalam metodologi.
- **Reproduksibilitas:** fitur pada daftar/export dihitung ulang dari data saat ini, sedangkan cluster berasal dari run aktif. Detail responden menghitung agregasi jawaban yang tersedia langsung, sehingga pada data dengan missing value dapat berbeda dari fitur hasil imputasi pipeline. Untuk analisis akhir, bekukan dataset dan simpan export serta konfigurasi run yang sama.
- **Riwayat:** hasil per run disimpan, tetapi belum ada snapshot lengkap jawaban mentah yang immutable per run. Penghapusan responden menghapus hasilnya melalui cascade; metadata jumlah anggota run lama tidak dihitung ulang otomatis.
- **Kinerja:** filter/sort/paginasi masih di memori dan silhouette menghitung jarak berpasangan O(n²). Untuk dataset besar, pertimbangkan query database, background job, dan sampling evaluasi setelah kebutuhan kinerja terukur.
- **Akses:** login sederhana belum mencakup reset password melalui email, SSO, pembatasan percobaan login, atau audit aktivitas. Form publik juga belum memiliki pencegahan pengisian berulang per mahasiswa.
- **Python:** service opsional belum diuji integrasi end-to-end pada implementasi awal. Uji endpoint dan bandingkan hasil sebelum menjadikannya engine penelitian utama; service dimaksudkan berada di jaringan lokal/internal.
- **Export:** CSV/XLSX dapat memuat nama dan atribut identitas. Kelola akses hasil unduhan dan lakukan anonimisasi sebelum membagikannya. PDF dihasilkan lewat cetak browser, bukan generator PDF di server.
- **Pengujian:** tersedia self-check algoritma ML. Pengujian integrasi database, konkurensi, keamanan, dan regresi browser otomatis masih menjadi pengembangan lanjutan.

Repository tidak menyertakan `.env`, isi database `.pgdata`, `node_modules`, atau hasil build `.next`. Berkas `.env.example` berisi contoh konfigurasi lokal. Ketentuan lisensi penggunaan ulang belum ditetapkan karena belum ada berkas `LICENSE`.
