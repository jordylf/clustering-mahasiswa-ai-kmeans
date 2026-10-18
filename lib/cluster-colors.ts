/**
 * Warna cluster berdasarkan peringkat ketergantungan (bukan nomor cluster), sehingga
 * "Rendah" selalu berwarna sama di semua halaman. Indeks merujuk ke slot --series-N.
 * Untuk K = 3 dipakai tiga slot pertama yang lolos uji buta warna antar semua pasangan.
 */
const RANK_SLOTS: Record<number, number[]> = {
  2: [3, 2],
  3: [3, 1, 2],
  4: [3, 1, 7, 2],
  5: [3, 1, 7, 4, 2],
  6: [6, 3, 1, 7, 4, 2],
};

export function rankColor(rank: number, k: number): string {
  const slots = RANK_SLOTS[k] ?? [1, 2, 3, 4, 5, 6, 7, 8];
  return `var(--series-${slots[rank % slots.length]})`;
}
