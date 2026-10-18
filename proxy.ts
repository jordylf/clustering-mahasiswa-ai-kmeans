import { NextResponse, type NextRequest } from "next/server";

// Pemeriksaan optimistis: tanpa cookie sesi langsung diarahkan ke /login.
// Verifikasi tanda tangan sesi yang sebenarnya dilakukan oleh requireAdmin() di server.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("skripsi_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/export/:path*"],
};
