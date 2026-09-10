"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

interface CartProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  basePriceCents: number;
}

type CartVariant = {
  id: string;
  name: string;
  priceCents: number;
  canvasSize: string;
  frameStyle: string;
} | null;

interface CartItemRow {
  id: string;
  quantity: number;
  createdAt: string;
  product: CartProduct;
  variant: CartVariant;
}

interface UserCart {
  user: { id: string; name: string | null; email: string | null };
  items: CartItemRow[];
  totalCents: number;
}

interface CartStats {
  activeCarts: number;
  totalItems: number;
  totalValueCents: number;
  avgCartValueCents: number;
  carts: UserCart[];
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function initials(name: string | null, email: string | null) {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfcb] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[#6b5d54]">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-[#1a1614]">{value}</div>
      {sub && <div className="mt-1 text-xs text-[#9d8e86]">{sub}</div>}
    </div>
  );
}

function CartRow({ cart, onRemoveItem }: { cart: UserCart; onRemoveItem: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleRemove = async (itemId: string) => {
    setDeleting(itemId);
    try {
      await fetch(`/api/admin/cart/${itemId}`, { method: "DELETE" });
      onRemoveItem(itemId);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="rounded-2xl border border-[#eadfcb] bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 hover:bg-[#faf6ef] transition-colors text-left"
      >
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eadfcb] text-sm font-bold text-[#6b5d54]">
          {initials(cart.user.name, cart.user.email)}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[#1a1614] truncate">
            {cart.user.name ?? cart.user.email ?? "Unknown"}
          </div>
          {cart.user.name && (
            <div className="text-xs text-[#9d8e86] truncate">{cart.user.email}</div>
          )}
        </div>

        {/* Item count */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-[#6b5d54]">
          <Package className="h-4 w-4" />
          <span>{cart.items.reduce((s, i) => s + i.quantity, 0)} items</span>
        </div>

        {/* Cart total */}
        <div className="font-bold text-[#1a1614] text-lg w-24 text-right">
          {fmt(cart.totalCents)}
        </div>

        {open ? (
          <ChevronUp className="h-4 w-4 text-[#9d8e86] shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#9d8e86] shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-[#eadfcb] divide-y divide-[#f5ede0]">
          {cart.items.map((item) => {
            const lineTotal = (item.product.basePriceCents + (item.variant?.priceCents ?? 0)) * item.quantity;
            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                <img
                  src={item.product.imageUrl ?? "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=80"}
                  alt={item.product.name}
                  className="h-12 w-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#1a1614] text-sm truncate">{item.product.name}</div>
                  <div className="text-xs text-[#9d8e86]">
                    {item.variant ? item.variant.name : "Standard"} · qty {item.quantity}
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#1a1614] w-20 text-right">
                  {fmt(lineTotal)}
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={deleting === item.id}
                  className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40 transition-colors"
                >
                  {deleting === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────

export default function AdminCartManager() {
  const [stats, setStats] = useState<CartStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cart/stats");
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemoveItem = (itemId: string) => {
    if (!stats) return;
    const updated = stats.carts
      .map((cart) => {
        const items = cart.items.filter((i) => i.id !== itemId);
        const totalCents = items.reduce(
          (s, i) => s + (i.product.basePriceCents + (i.variant?.priceCents ?? 0)) * i.quantity,
          0
        );
        return { ...cart, items, totalCents };
      })
      .filter((c) => c.items.length > 0);

    const totalItems = updated.reduce((s, c) => s + c.items.reduce((a, i) => a + i.quantity, 0), 0);
    const totalValueCents = updated.reduce((s, c) => s + c.totalCents, 0);
    setStats({
      ...stats,
      carts: updated,
      activeCarts: updated.length,
      totalItems,
      totalValueCents,
      avgCartValueCents: updated.length > 0 ? Math.round(totalValueCents / updated.length) : 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-[#6b5d54]">Failed to load cart data.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Active carts"
          value={stats.activeCarts}
          sub="Users with items"
        />
        <StatCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Total items"
          value={stats.totalItems}
          sub="Across all carts"
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total cart value"
          value={fmt(stats.totalValueCents)}
          sub="Combined cart totals"
        />
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Avg cart value"
          value={fmt(stats.avgCartValueCents)}
          sub="Per active cart"
        />
      </div>

      {/* Cart list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1a1614]">Active carts</h2>
          <span className="rounded-full bg-[#f5ede0] px-3 py-1 text-sm font-medium text-[#6b5d54]">
            {stats.activeCarts} users
          </span>
        </div>

        {stats.carts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#eadfcb] py-16 text-center">
            <ShoppingCart className="mb-3 h-10 w-10 text-[#d4b896]" />
            <p className="font-medium text-[#6b5d54]">No active carts</p>
            <p className="mt-1 text-sm text-[#9d8e86]">All carts are empty right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.carts.map((cart) => (
              <CartRow
                key={cart.user.id}
                cart={cart}
                onRemoveItem={handleRemoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
