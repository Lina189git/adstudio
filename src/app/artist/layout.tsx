import { ReactNode } from "react";
import Link from "next/link";
import { requireArtistPageSession } from "@/lib/artist";
import prisma from "@/lib/prisma";
import AppHeader from "@/components/painting-order/AppHeader";
import {
  Palette, LayoutDashboard, Bell, Briefcase, History,
  LogOut, ExternalLink,
} from "lucide-react";

export default async function ArtistLayout({ children }: { children: ReactNode }) {
  const session = await requireArtistPageSession();
  const artistId = (session.user as { id: string }).id;

  // Live counts for sidebar badges
  const [inboxCount, activeCount, historyCount] = await Promise.all([
    prisma.commissionRequest.count({ where: { assignedArtistId: artistId, status: "ASSIGNED" } }),
    prisma.commissionRequest.count({ where: { assignedArtistId: artistId, status: { in: ["IN_PROGRESS","REVIEW","REVISION"] } } }),
    prisma.commissionRequest.count({ where: { assignedArtistId: artistId, status: { in: ["COMPLETED","CANCELLED"] } } }),
  ]);

  const revisionCount = await prisma.commissionRequest.count({
    where: { assignedArtistId: artistId, status: "REVISION" },
  });

  const artistName = session.user?.name ?? "Artist";

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex gap-6">
          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <aside className="hidden w-60 flex-shrink-0 lg:block">
            <div className="sticky top-6 space-y-3">
              {/* Brand card */}
              <div className="rounded-[1.75rem] bg-[#1a1614] p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d4a574]">
                    <Palette className="h-5 w-5 text-[#1a1614]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4a574]">Artist Portal</p>
                    <p className="truncate text-sm font-semibold text-white">{artistName}</p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                    <p className={`text-xl font-bold ${inboxCount > 0 ? "text-orange-400" : "text-white"}`}>{inboxCount}</p>
                    <p className="text-[10px] text-white/60">New</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                    <p className="text-xl font-bold text-[#d4a574]">{activeCount}</p>
                    <p className="text-[10px] text-white/60">Active</p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-2 shadow-[0_4px_20px_rgba(26,22,20,0.05)]">
                <div className="space-y-1">
                  <SideLink href="/artist" icon={LayoutDashboard} label="Dashboard" />
                  <SideLink
                    href="/artist?section=inbox"
                    icon={Bell}
                    label="Inbox"
                    count={inboxCount}
                    alert={inboxCount > 0}
                  />
                  <SideLink
                    href="/artist?section=active"
                    icon={Briefcase}
                    label="Active Work"
                    count={activeCount}
                    alert={revisionCount > 0}
                  />
                  <SideLink
                    href="/artist?section=history"
                    icon={History}
                    label="History"
                    count={historyCount}
                  />
                </div>

                <div className="mt-2 border-t border-[#f0e4cf] pt-2">
                  <a
                    href="/painting-order"
                    target="_blank"
                    className="flex items-center gap-3 rounded-[1rem] px-4 py-2.5 text-sm text-[#8c7764] transition hover:bg-[#f8f1e6] hover:text-[#1a1614]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="font-medium">Customer Form</span>
                  </a>
                  <a
                    href="/api/auth/signout"
                    className="flex items-center gap-3 rounded-[1rem] px-4 py-2.5 text-sm text-[#8c7764] transition hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Sign Out</span>
                  </a>
                </div>
              </nav>

              {/* Revision alert if needed */}
              {revisionCount > 0 && (
                <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold text-red-700">
                    {revisionCount} revision{revisionCount > 1 ? "s" : ""} requested
                  </p>
                  <p className="mt-0.5 text-xs text-red-600">Admin has requested changes.</p>
                  <Link href="/artist?section=active"
                    className="mt-2 block text-xs font-semibold text-red-700 hover:underline">
                    View now →
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* ── Mobile top nav ─────────────────────────────────────────────── */}
          <div className="mb-2 w-full lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link href="/artist"
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-xs font-semibold text-[#6b5d54] hover:bg-[#f8f1e6]">
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <Link href="/artist?section=inbox"
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold ${
                  inboxCount > 0
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-[#eadfcb] bg-white text-[#6b5d54] hover:bg-[#f8f1e6]"
                }`}>
                <Bell className="h-3.5 w-3.5" /> Inbox
                {inboxCount > 0 && (
                  <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{inboxCount}</span>
                )}
              </Link>
              <Link href="/artist?section=active"
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-xs font-semibold text-[#6b5d54] hover:bg-[#f8f1e6]">
                <Briefcase className="h-3.5 w-3.5" /> Active ({activeCount})
              </Link>
              <Link href="/artist?section=history"
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-xs font-semibold text-[#6b5d54] hover:bg-[#f8f1e6]">
                <History className="h-3.5 w-3.5" /> History
              </Link>
            </div>
          </div>

          {/* ── Main content ────────────────────────────────────────────────── */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SideLink({
  href, icon: Icon, label, count, alert,
}: {
  href: string;
  icon: any;
  label: string;
  count?: number;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[1rem] px-4 py-2.5 text-sm transition hover:bg-[#f8f1e6]"
    >
      <Icon className="h-4 w-4 text-[#8c7764]" />
      <span className="flex-1 font-medium text-[#6b5d54]">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          alert ? "bg-red-100 text-red-700" : "bg-[#f0e4cf] text-[#a87945]"
        }`}>
          {count}
        </span>
      )}
    </Link>
  );
}
