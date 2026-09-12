import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/cart/stats
export async function GET() {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const allItems = await prisma.cartItem.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, imageUrl: true, basePriceCents: true } },
      variant: { select: { id: true, name: true, priceCents: true, canvasSize: true, frameStyle: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by user
  const byUser = new Map<string, {
    user: { id: string; name: string | null; email: string | null };
    items: typeof allItems;
    totalCents: number;
  }>();

  for (const item of allItems) {
    const uid = item.userId;
    if (!byUser.has(uid)) {
      byUser.set(uid, { user: item.user, items: [], totalCents: 0 });
    }
    const entry = byUser.get(uid)!;
    entry.items.push(item);
    entry.totalCents += (item.product.basePriceCents + (item.variant?.priceCents ?? 0)) * item.quantity;
  }

  const carts = Array.from(byUser.values()).sort(
    (a, b) => b.totalCents - a.totalCents
  );

  const totalItems = allItems.reduce((s, i) => s + i.quantity, 0);
  const totalValue = carts.reduce((s, c) => s + c.totalCents, 0);

  return NextResponse.json({
    activeCarts: carts.length,
    totalItems,
    totalValueCents: totalValue,
    avgCartValueCents: carts.length > 0 ? Math.round(totalValue / carts.length) : 0,
    carts,
  });
}
