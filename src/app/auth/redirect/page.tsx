import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");
  const role = (session.user as { role?: string }).role;
  if (role === "ADMIN") redirect("/admin");
  if (role === "INFLUENCER") redirect("/influencer/dashboard");
  redirect("/gallery");
}
