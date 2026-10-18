import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "skripsi_session";
const MAX_AGE = 60 * 60 * 8; // 8 jam

type Session = { userId: string; exp: number };

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET belum diatur (min. 16 karakter) di .env");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

/** Cookie sesi = base64url(JSON) + "." + HMAC-SHA256. Tidak bisa dipalsukan tanpa AUTH_SECRET. */
export async function createSession(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + MAX_AGE * 1000 } satisfies Session),
  ).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

async function readSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const [payload, sig] = raw?.split(".") ?? [];
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  return session.exp > Date.now() ? session : null;
}

export async function getCurrentUser() {
  const session = await readSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
}

/** Dipanggil di setiap halaman, server action, dan route handler admin. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
