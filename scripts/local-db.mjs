// Menjalankan PostgreSQL lokal tanpa instalasi (paket embedded-postgres).
// Opsional: lewati ini bila sudah punya PostgreSQL sendiri / Docker.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const dataDir = "./.pgdata";
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: true,
});

const firstRun = !existsSync(dataDir);
if (firstRun) await pg.initialise();
await pg.start();
if (firstRun) await pg.createDatabase("skripsi_kmeans");

console.log("PostgreSQL lokal berjalan di postgresql://postgres:postgres@localhost:5433/skripsi_kmeans");
console.log("Tekan Ctrl+C untuk menghentikan.");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
