import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireInfluencerApiSession, unauthorizedInfluencerResponse } from "@/lib/influencer";

export const dynamic = "force-dynamic";

// GET /api/influencer/applications â€” list my applications
export async function GET() {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();
  const influencerId = (session.user as { id: string }).id;

  const applications = await prisma.adApplication.findMany({
    where: { influencerId },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, slug: true, imageUrl: true, commissionType: true, commissionRate: true, commissionFixed: true } },
      sample: true,
      task: { select: { id: true, ref: true, status: true, deadline: true } },
    },
  });

  return NextResponse.json({ applications });
}

// POST /api/influencer/applications â€” submit a new application
export async function POST(request: NextRequest) {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();
  const influencerId = (session.user as { id: string }).id;

  const body = await request.json();
  const { productId, pitch, plannedContent, contactInfo } = body;

  if (!productId) return NextResponse.json({ error: "productId is required." }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const existing = await prisma.adApplication.findFirst({
    where: { productId, influencerId, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing) return NextResponse.json({ error: "You already have an active application for this product." }, { status: 409 });

  const application = await prisma.adApplication.create({
    data: {
      productId,
      influencerId,
      pitch: pitch?.trim() || null,
      plannedContent: plannedContent?.trim() || null,
      contactInfo: contactInfo ?? null,
      agreedRate: product.commissionType === "PERCENTAGE" ? product.commissionRate : null,
      agreedAmount: product.commissionType === "FIXED" ? product.commissionFixed : null,
    },
    include: { product: { select: { name: true, imageUrl: true } } },
  });

  return NextResponse.json(application, { status: 201 });
}
