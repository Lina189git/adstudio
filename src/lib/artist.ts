import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function requireArtistPageSession() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/signin");

  const role = session.user?.role;
  if (role !== "ARTIST" && role !== "ADMIN") redirect("/");

  return session;
}

export async function requireArtistApiSession() {
  const session = await getServerSession(authOptions);

  if (!session) return null;

  const role = session.user?.role;
  if (role !== "ARTIST" && role !== "ADMIN") return null;

  return session;
}

export function unauthorizedArtistResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
