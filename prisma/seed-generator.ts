import {
  AI_FREQUENCY_OPTIONS,
  PLATFORM_OPTIONS,
  PURPOSE_OPTIONS,
  QUESTIONS,
  type QuestionCategory,
} from "../lib/constants";
import { createRng } from "../ml/clustering/kmeans";

/**
 * Generator data dummy berpola: setiap responden dibangkitkan dari salah satu profil
 * (rendah / sedang / tinggi) lalu diberi variasi individu + noise per butir, sehingga
 * data realistis tetapi tetap memiliki struktur cluster.
 */
type Profile = {
  name: "low" | "medium" | "high";
  share: number;
  means: Record<QuestionCategory, number>;
  frequencyWeights: number[];
  platformCount: [number, number];
  purposeCount: [number, number];
};

const PROFILES: Profile[] = [
  {
    name: "low",
    share: 0.3,
    means: { FREQUENCY: 1.9, TASK_DEPENDENCY: 1.8, ACADEMIC_USAGE: 2.3, VERIFICATION: 4.3, TRUST: 2.0 },
    frequencyWeights: [0.15, 0.6, 0.2, 0.05, 0],
    platformCount: [1, 1],
    purposeCount: [1, 3],
  },
  {
    name: "medium",
    share: 0.4,
    means: { FREQUENCY: 3.2, TASK_DEPENDENCY: 3.1, ACADEMIC_USAGE: 3.3, VERIFICATION: 3.1, TRUST: 3.2 },
    frequencyWeights: [0, 0.15, 0.5, 0.3, 0.05],
    platformCount: [1, 3],
    purposeCount: [3, 5],
  },
  {
    name: "high",
    share: 0.3,
    means: { FREQUENCY: 4.5, TASK_DEPENDENCY: 4.4, ACADEMIC_USAGE: 4.3, VERIFICATION: 1.9, TRUST: 4.3 },
    frequencyWeights: [0, 0, 0.1, 0.45, 0.45],
    platformCount: [2, 5],
    purposeCount: [5, 8],
  },
];

const UNIVERSITIES = [
  "Universitas Indonesia",
  "Universitas Gadjah Mada",
  "Institut Teknologi Bandung",
  "Universitas Brawijaya",
  "Universitas Airlangga",
  "Universitas Diponegoro",
  "Universitas Padjadjaran",
  "Universitas Bina Nusantara",
];

const PROGRAMS: { faculty: string; program: string; isTech: boolean }[] = [
  { faculty: "Fakultas Ilmu Komputer", program: "Informatika", isTech: true },
  { faculty: "Fakultas Ilmu Komputer", program: "Sistem Informasi", isTech: true },
  { faculty: "Fakultas Teknik", program: "Teknik Elektro", isTech: true },
  { faculty: "Fakultas Teknik", program: "Teknik Sipil", isTech: false },
  { faculty: "Fakultas Ekonomi dan Bisnis", program: "Manajemen", isTech: false },
  { faculty: "Fakultas Ekonomi dan Bisnis", program: "Akuntansi", isTech: false },
  { faculty: "Fakultas Ilmu Sosial dan Ilmu Politik", program: "Ilmu Komunikasi", isTech: false },
  { faculty: "Fakultas Psikologi", program: "Psikologi", isTech: false },
  { faculty: "Fakultas Hukum", program: "Ilmu Hukum", isTech: false },
];

const NAMES = ["Andi", "Budi", "Citra", "Dewi", "Eka", "Fajar", "Gita", "Hendra", "Indah", "Joko", "Kartika", "Lukman", "Maya", "Nanda", "Putri", "Rizky", "Sari", "Tono", "Wulan", "Yusuf"];

export type GeneratedRespondent = {
  profile: Profile["name"];
  name: string | null;
  age: number;
  gender: string;
  university: string;
  faculty: string;
  studyProgram: string;
  semester: number;
  aiUsageFrequency: string;
  platforms: string[];
  purposes: string[];
  /** kode butir -> nilai; butir yang hilang (missing) tidak ada di objek */
  answers: Record<string, number>;
};

export function generateRespondents(count = 150, seed = 2024): GeneratedRespondent[] {
  const rand = createRng(seed);
  const gaussian = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const weighted = (weights: number[]) => {
    let r = rand() * weights.reduce((s, w) => s + w, 0);
    return weights.findIndex((w) => (r -= w) < 0);
  };
  const sample = <T,>(arr: readonly T[], n: number) => [...arr].sort(() => rand() - 0.5).slice(0, n);

  return Array.from({ length: count }, (_, i) => {
    const profile = PROFILES[weighted(PROFILES.map((p) => p.share))];
    const prog = pick(PROGRAMS);
    const semester = between(1, 8);
    const shift = gaussian() * 0.25; // variasi individu dalam profil

    const answers: Record<string, number> = {};
    for (const q of QUESTIONS) {
      let mean = profile.means[q.category];
      if (q.category !== "VERIFICATION") mean += shift;
      else mean -= shift;
      if (q.code === "X12") mean += prog.isTech ? 0.8 : -0.9; // coding lebih relevan untuk prodi teknologi
      const v = Math.round(mean + gaussian() * 0.55);
      answers[q.code] = Math.min(5, Math.max(1, v));
    }
    // ~3% responden memiliki satu jawaban kosong (simulasi data kuesioner kertas)
    if (rand() < 0.03) delete answers[pick(QUESTIONS).code];

    const platformPool = PLATFORM_OPTIONS.filter((p) => p !== "Lainnya" && (p !== "GitHub Copilot" || prog.isTech));
    const platforms = Array.from(
      new Set(["ChatGPT", ...sample(platformPool, between(...profile.platformCount))]),
    ).slice(0, profile.platformCount[1]);
    const purposePool = PURPOSE_OPTIONS.filter((p) => p !== "Lainnya" && (p !== "Coding" || prog.isTech));

    return {
      profile: profile.name,
      name: rand() < 0.4 ? `${pick(NAMES)} ${String.fromCharCode(65 + (i % 26))}.` : null,
      age: 17 + Math.ceil(semester / 2) + between(0, 2),
      gender: rand() < 0.52 ? "Perempuan" : "Laki-laki",
      university: pick(UNIVERSITIES),
      faculty: prog.faculty,
      studyProgram: prog.program,
      semester,
      aiUsageFrequency: AI_FREQUENCY_OPTIONS[weighted(profile.frequencyWeights)],
      platforms,
      purposes: sample(purposePool, between(...profile.purposeCount)),
      answers,
    };
  });
}
