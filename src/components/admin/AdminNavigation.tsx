"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white/90 p-2 shadow-[0_10px_35px_rgba(26,22,20,0.06)]">
      <nav className="grid gap-2 md:grid-cols-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition ${
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
