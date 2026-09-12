"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/UserMenu";

const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/admin",    label: "Admin" },
    { href: "/gallery",  label: "Products" },
  ],
  INFLUENCER: [
    { href: "/gallery",               label: "Products"    },
    { href: "/influencer/dashboard",  label: "My dashboard" },
    { href: "/influencer/tasks",      label: "My tasks"    },
    { href: "/influencer/profile",    label: "Profile"     },
  ],
  USER: [
    { href: "/gallery", label: "Products" },
    { href: "/orders",  label: "My orders" },
  ],
};

export default function AppHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "USER";
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.USER;

  return (
    <header className="sticky top-0 z-30 border-b border-[#eadfcb] bg-[#fffaf2]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1614] shadow-sm">
            <TrendingUp className="h-4 w-4 text-[#d4a574]" />
          </div>
          <span className="font-serif text-[17px] font-bold tracking-[0.04em] text-[#1a1614]">
            AdStudio
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[#1a1614] text-white"
                    : "text-[#6b5d54] hover:bg-[#f0e8d8] hover:text-[#1a1614]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <UserMenu />

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#eadfcb] text-[#6b5d54] transition hover:border-[#d4a574] hover:text-[#1a1614] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#eadfcb] bg-[#fffaf2] px-6 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#1a1614] text-white"
                      : "text-[#6b5d54] hover:bg-[#f0e8d8] hover:text-[#1a1614]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
