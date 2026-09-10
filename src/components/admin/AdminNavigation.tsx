"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Film, LayoutDashboard, Package, Users, Video } from "lucide-react";

const navItems = [
  { href: "/admin",              label: "Overview",      icon: LayoutDashboard },
  { href: "/admin/products",     label: "Products",      icon: Package },
  { href: "/admin/applications", label: "Applications",  icon: ClipboardList },
  { href: "/admin/tasks",        label: "Tasks",         icon: Film },
  { href: "/admin/videos",       label: "Videos",        icon: Video },
  { href: "/admin/users",        label: "Users",         icon: Users },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white/90 p-2 shadow-[0_10px_35px_rgba(26,22,20,0.06)]">
      <nav className="flex flex-wrap gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-[1.25rem] px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#1a1614] text-white shadow-[0_10px_30px_rgba(26,22,20,0.18)]"
                  : "text-[#6b5d54] hover:bg-[#f8f1e6] hover:text-[#1a1614]"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
