import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { RESEARCH_TITLE } from "@/lib/research";
import { getActiveRun } from "@/services/clustering.service";
import { buildExportSheets, DATASETS, toCsv, toXlsx, type DatasetKey } from "@/services/export.service";

export async function GET(request: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const dataset = (request.nextUrl.searchParams.get("dataset") ?? "full") as DatasetKey;
  if (!(dataset in DATASETS) || !["csv", "xlsx"].includes(format)) {
    return NextResponse.json({ error: "Parameter format/dataset tidak valid" }, { status: 400 });
  }

  try {
    const sheets = await buildExportSheets();
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      return new NextResponse(toCsv(sheets[dataset]), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${dataset}-${stamp}.csv"`,
        },
      });
    }

    const run = await getActiveRun();
    const buffer = await toXlsx(
      [sheets.respondents, sheets.raw, sheets.features, sheets.clustering, sheets.centroids],
      {
        Judul: RESEARCH_TITLE,
        "Tanggal export": new Date().toLocaleString("id-ID"),
        "Jumlah responden": sheets.respondents.rows.length,
        "Jumlah cluster (K)": run?.numberOfClusters ?? "-",
        "Silhouette score": run ? Number(run.silhouetteScore.toFixed(4)) : "-",
        Inertia: run ? Number(run.inertia.toFixed(4)) : "-",
      },
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="dataset-clustering-${stamp}.xlsx"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal membuat file export" }, { status: 500 });
  }
}
