"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, ShoppingCart, Package, LogOut, Settings, Shield } from "lucide-react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-2 bg-[#1a1614] text-white px-4 py-2 rounded-lg hover:bg-[#2a2624] transition-colors"
      >
        <User className="w-4 h-4" />
        Account Sign In
      </Link>
    );
  }

  const role = session.user?.role || "USER";
  const menuItems = [
    ...(role === "ADMIN"
      ? [{ href: "/admin", label: "Admin Dashboard", icon: Shield }]
      : []),
    { href: "/account", label: "Account Settings", icon: Settings },
    { href: "/orders", label: "My Orders", icon: Package },
    { href: "/cart", label: "Shopping Cart", icon: ShoppingCart },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#f8f1e6] text-[#1a1614] px-3 py-2 rounded-lg hover:bg-[#eadfcb] transition-colors"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <User className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {session.user?.name?.split(" ")[0] || "User"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#eadfcb] z-50">
          <div className="p-3 border-b border-[#eadfcb]">
            <p className="text-sm font-medium text-[#1a1614]">
              {session.user?.name}
            </p>
            <p className="text-xs text-[#6b5d54]">{session.user?.email}</p>
          </div>

          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-[#1a1614] hover:bg-[#f8f1e6] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#eadfcb] py-1">
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
