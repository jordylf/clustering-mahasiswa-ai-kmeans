export const FEATURE_KEYS = [
  "frequency_score",
  "task_dependency_score",
  "academic_usage_score",
  "verification_score",
  "trust_score",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const QUESTION_CATEGORIES = {
  FREQUENCY: { label: "Frekuensi Penggunaan AI", feature: "frequency_score" },
  TASK_DEPENDENCY: { label: "Ketergantungan dalam Penyelesaian Tugas", feature: "task_dependency_score" },
  ACADEMIC_USAGE: { label: "Pemanfaatan Akademik", feature: "academic_usage_score" },
  VERIFICATION: { label: "Verifikasi Informasi", feature: "verification_score" },
  TRUST: { label: "Kepercayaan terhadap AI", feature: "trust_score" },
} as const satisfies Record<string, { label: string; feature: FeatureKey }>;
export type QuestionCategory = keyof typeof QUESTION_CATEGORIES;

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  frequency_score: "Frequency",
  task_dependency_score: "Task Dependency",
  academic_usage_score: "Academic Usage",
  verification_score: "Verification",
  trust_score: "Trust",
};

export const FEATURE_LABELS_ID: Record<FeatureKey, string> = {
  frequency_score: "frekuensi penggunaan",
  task_dependency_score: "ketergantungan dalam tugas",
  academic_usage_score: "pemanfaatan akademik",
  verification_score: "verifikasi informasi",
  trust_score: "kepercayaan terhadap AI",
};

export type QuestionSeed = {
  code: string;
  text: string;
  category: QuestionCategory;
  isReversed?: boolean;
};

/** Butir kuesioner X1..X20 (sumber tunggal untuk seed dan dokumentasi). */
export const QUESTIONS: QuestionSeed[] = [
  { code: "X1", category: "FREQUENCY", text: "Saya menggunakan Generative AI hampir setiap hari untuk kegiatan akademik." },
  { code: "X2", category: "FREQUENCY", text: "Saya menggunakan Generative AI setiap kali mengerjakan tugas." },
  { code: "X3", category: "FREQUENCY", text: "Saya menggunakan lebih dari satu platform Generative AI." },
  { code: "X4", category: "FREQUENCY", text: "Saya menggunakan Generative AI selama proses belajar." },
  { code: "X5", category: "TASK_DEPENDENCY", text: "Saya kesulitan mengerjakan tugas tanpa bantuan Generative AI." },
  { code: "X6", category: "TASK_DEPENDENCY", text: "Generative AI menjadi salah satu alat utama saya dalam menyelesaikan tugas." },
  { code: "X7", category: "TASK_DEPENDENCY", text: "Saya sering menggunakan jawaban Generative AI secara langsung." },
  { code: "X8", category: "TASK_DEPENDENCY", text: "Saya menggunakan Generative AI untuk membantu mencari solusi ketika mengalami kesulitan." },
  { code: "X9", category: "ACADEMIC_USAGE", text: "Saya menggunakan Generative AI untuk mencari ide tugas." },
  { code: "X10", category: "ACADEMIC_USAGE", text: "Saya menggunakan Generative AI untuk membuat rangkuman materi." },
  { code: "X11", category: "ACADEMIC_USAGE", text: "Saya menggunakan Generative AI untuk memahami materi perkuliahan." },
  { code: "X12", category: "ACADEMIC_USAGE", text: "Saya menggunakan Generative AI untuk membantu coding atau programming." },
  { code: "X13", category: "ACADEMIC_USAGE", text: "Saya menggunakan Generative AI untuk membantu penulisan laporan." },
  { code: "X14", category: "ACADEMIC_USAGE", text: "Saya menggunakan Generative AI untuk mencari referensi awal." },
  { code: "X15", category: "VERIFICATION", isReversed: true, text: "Saya selalu mengecek kembali informasi yang diberikan Generative AI." },
  { code: "X16", category: "VERIFICATION", isReversed: true, text: "Saya membandingkan jawaban Generative AI dengan sumber lain." },
  { code: "X17", category: "VERIFICATION", isReversed: true, text: "Saya memeriksa sumber atau referensi sebelum menggunakan jawaban AI." },
  { code: "X18", category: "TRUST", text: "Saya percaya sebagian besar jawaban Generative AI benar." },
  { code: "X19", category: "TRUST", text: "Saya merasa Generative AI dapat menggantikan sebagian proses pencarian informasi secara manual." },
  { code: "X20", category: "TRUST", text: "Saya lebih memilih bertanya kepada Generative AI dibanding mencari informasi sendiri." },
];

export const LIKERT_OPTIONS = [
  { value: 1, label: "Sangat Tidak Setuju", short: "STS" },
  { value: 2, label: "Tidak Setuju", short: "TS" },
  { value: 3, label: "Netral", short: "N" },
  { value: 4, label: "Setuju", short: "S" },
  { value: 5, label: "Sangat Setuju", short: "SS" },
] as const;

export const AI_FREQUENCY_OPTIONS = [
  "Tidak pernah",
  "1–2 kali per minggu",
  "3–5 kali per minggu",
  "1–3 kali per hari",
  "Lebih dari 3 kali per hari",
] as const;

export const PLATFORM_OPTIONS = [
  "ChatGPT",
  "Gemini",
  "Claude",
  "Copilot",
  "Perplexity",
  "GitHub Copilot",
  "Lainnya",
] as const;

export const PURPOSE_OPTIONS = [
  "Brainstorming",
  "Mengerjakan tugas",
  "Coding",
  "Membuat rangkuman",
  "Mencari referensi",
  "Menerjemahkan",
  "Membuat presentasi",
  "Menulis laporan",
  "Belajar materi",
  "Lainnya",
] as const;

export const GENDER_OPTIONS = ["Laki-laki", "Perempuan"] as const;

export const DEFAULT_K = 3;
export const K_RANGE = { min: 2, max: 6 } as const;
