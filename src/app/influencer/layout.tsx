import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, Settings, Video } from "lucide-react";

const navItems = [
  { href: "/influencer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/influencer/tasks",     label: "My Tasks",   icon: Video },
  { href: "/gallery",              label: "Browse",     icon: Package },
  { href: "/influencer/profile",   label: "Profile",    icon: Settings },
];

export default async function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/influencer/dashboard");
  const role = (session.user as { role?: string }).role;
  if (role !== "INFLUENCER" && role !== "ADMIN") redirect("/");

  const user = session.user as { name?: string | null; email?: string | null; image?: string | null };

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <header className="border-b border-[#eadfcb] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#1a1614]">AdStudio</Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#6b5d54] transition hover:bg-[#f8f1e6] hover:text-[#1a1614]">
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            ))}
          </nav>
          <div className="text-sm font-medium text-[#6b5d54]">{user.name || user.email}</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
