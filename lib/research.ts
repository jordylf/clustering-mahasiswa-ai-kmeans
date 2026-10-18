export const RESEARCH_TITLE =
  "Clustering Tingkat Ketergantungan Mahasiswa terhadap Generative AI dalam Aktivitas Akademik Menggunakan Algoritma K-Means";

export const METHODOLOGY_STEPS = [
  {
    title: "Pengumpulan Data",
    desc: "Data dikumpulkan melalui kuesioner daring berisi identitas responden, pola penggunaan, dan 20 pernyataan skala Likert (1 = Sangat Tidak Setuju s.d. 5 = Sangat Setuju).",
  },
  {
    title: "Data Cleaning",
    desc: "Nilai di luar skala 1–5 dianggap tidak valid. Responden dengan lebih dari 50% jawaban kosong dibuang, sisa missing value diisi median butir.",
  },
  {
    title: "Feature Selection",
    desc: "Butir diagregasi (rata-rata) menjadi lima fitur: frequency, task dependency, academic usage, verification, dan trust score.",
  },
  {
    title: "Standardization",
    desc: "Setiap fitur distandardisasi dengan StandardScaler (z = (x − μ) / σ) agar semua fitur berkontribusi setara pada perhitungan jarak Euclidean.",
  },
  {
    title: "Penentuan K",
    desc: "Elbow Method (inertia) dan Silhouette Score dihitung untuk K = 2 sampai 6. K dengan silhouette tertinggi direkomendasikan.",
  },
  {
    title: "K-Means Clustering",
    desc: "K-Means dengan inisialisasi k-means++ dan 10 kali restart mengelompokkan responden; hasil dengan inertia terkecil dipilih.",
  },
  {
    title: "Evaluasi Silhouette Score",
    desc: "Kualitas pemisahan cluster diukur dengan Silhouette Score (−1 s.d. 1). Nilai mendekati 1 berarti cluster semakin baik terpisah.",
  },
  {
    title: "Interpretasi Cluster",
    desc: "Centroid diurutkan berdasarkan dependency score, lalu dipetakan menjadi label Ketergantungan Rendah, Sedang, dan Tinggi beserta interpretasinya.",
  },
] as const;
