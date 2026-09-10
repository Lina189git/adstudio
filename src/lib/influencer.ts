import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireInfluencerPageSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/influencer/dashboard");
  const role = (session.user as { role?: string }).role;
  if (role !== "INFLUENCER" && role !== "ADMIN") redirect("/");
  return session;
}

export async function requireInfluencerApiSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "INFLUENCER" && role !== "ADMIN") return null;
  return session;
}

export function unauthorizedInfluencerResponse() {
  return NextResponse.json({ error: "Influencer access required." }, { status: 403 });
}
