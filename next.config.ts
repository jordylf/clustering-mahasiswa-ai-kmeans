import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data penelitian selalu dibaca langsung dari database (dynamic rendering),
  // jadi Cache Components tidak diaktifkan agar alur kode tetap sederhana.
  cacheComponents: false,
  serverExternalPackages: ["exceljs"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
