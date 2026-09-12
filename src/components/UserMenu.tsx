"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LayoutDashboard, LogOut, Settings, Shield, TrendingUp, User, Video, ChevronDown } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; badgeCls: string; dashHref: string; dashLabel: string }> = {
  ADMIN:      { label: "Admin",      badgeCls: "bg-[#1a1614] text-white",        dashHref: "/admin",                dashLabel: "Admin dashboard"  },
  INFLUENCER: { label: "Influencer", badgeCls: "bg-[#d4a574] text-[#1a1614]",   dashHref: "/influencer/dashboard", dashLabel: "Creator dashboard" },
  USER:       { label: "User",       badgeCls: "bg-[#eadfcb] text-[#6b5d54]",   dashHref: "/gallery",              dashLabel: "Browse gallery"    },
};

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-[#eadfcb]" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/signin"
          className="text-sm font-semibold text-[#6b5d54] hover:text-[#1a1614] transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signin?signup=1"
          className="rounded-full bg-[#1a1614] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a2624]"
        >
          Sign up free
        </Link>
      </div>
    );
  }

  const role = (session.user as { role?: string }).role || "USER";
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.USER;

  const menuItems: { href: string; label: string; icon: React.ElementType }[] =
    role === "ADMIN"
      ? [
          { href: "/admin",    label: "Admin dashboard",  icon: Shield     },
          { href: "/gallery",  label: "Browse products",  icon: TrendingUp },
          { href: "/account",  label: "My account",       icon: User       },
        ]
      : role === "INFLUENCER"
      ? [
          { href: "/influencer/dashboard", label: "My dashboard",    icon: LayoutDashboard },
          { href: "/influencer/tasks",     label: "My tasks",        icon: Video           },
          { href: "/gallery",              label: "Browse products",  icon: TrendingUp      },
          { href: "/influencer/profile",   label: "Profile settings", icon: Settings        },
        ]
      : [
          { href: "/gallery",  label: "Browse products",  icon: TrendingUp },
          { href: "/orders",   label: "My orders",        icon: Video      },
          { href: "/account",  label: "My account",       icon: User       },
        ];

  const initials = session.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white py-1.5 pl-1.5 pr-3 text-[#1a1614] transition hover:border-[#d4a574] hover:bg-[#fdf8f1]"
      >
        {/* Avatar */}
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1614] text-[11px] font-bold text-white">
            {initials}
          </div>
        )}
        <span className="max-w-[90px] truncate text-sm font-semibold">
          {session.user?.name?.split(" ")[0] || "Account"}
        </span>
        {/* Role badge */}
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cfg.badgeCls}`}>
          {cfg.label}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#8c7764] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[#eadfcb] bg-white shadow-[0_16px_48px_rgba(26,22,20,0.14)]">

          {/* Identity block */}
          <div className="border-b border-[#eadfcb] p-4">
            <div className="flex items-start gap-3">
              {session.user?.image ? (
                <img src={session.user.image} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1614] text-sm font-bold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1a1614]">{session.user?.name}</p>
                <p className="truncate text-xs text-[#8c7764]">{session.user?.email}</p>
                <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.badgeCls}`}>
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Primary dashboard shortcut */}
            <Link
              href={cfg.dashHref}
              onClick={() => setIsOpen(false)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#faf6ef] py-2.5 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f0e8d8]"
            >
              <LayoutDashboard className="h-4 w-4 text-[#8c7764]" />
              {cfg.dashLabel}
            </Link>
          </div>

          {/* Nav links */}
          <div className="py-1.5">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1614] transition hover:bg-[#faf6ef]"
              >
                <item.icon className="h-4 w-4 shrink-0 text-[#8c7764]" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-[#eadfcb] p-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
