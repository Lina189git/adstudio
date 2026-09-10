import { NextResponse } from "next/server";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const payments = await prisma.commissionPayment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      influencer: { select: { id: true, name: true, email: true, image: true } },
      task: {
        include: {
          application: {
            select: {
              agreedRate: true,
              agreedAmount: true,
              product: {
                select: {
                  id: true, name: true, imageUrl: true,
                  basePriceCents: true, commissionType: true,
                  commissionRate: true, commissionFixed: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Monthly aggregation (over all payments, regardless of status)
  const monthly: Record<string, { total: number; count: number; paid: number; pending: number; approved: number; failed: number }> = {};
  for (const p of payments) {
    const key = new Date(p.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" });
    if (!monthly[key]) monthly[key] = { total: 0, count: 0, paid: 0, pending: 0, approved: 0, failed: 0 };
    monthly[key].total   += p.amountCents;
    monthly[key].count   += 1;
    if (p.status === "PAID")     monthly[key].paid     += p.amountCents;
    if (p.status === "PENDING")  monthly[key].pending  += p.amountCents;
    if (p.status === "APPROVED") monthly[key].approved += p.amountCents;
    if (p.status === "FAILED")   monthly[key].failed   += p.amountCents;
  }

  return NextResponse.json({ payments, monthly });
}
