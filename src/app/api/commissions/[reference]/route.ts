import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { reference: string } }
) {
  const commission = await prisma.commissionRequest.findUnique({
    where: { reference: params.reference },
    select: {
      id:            true,
      reference:     true,
      customerName:  true,
      paintingType:  true,
      size:          true,
      surface:       true,
      style:         true,
      quantity:      true,
      estimatedRange: true,
      timeline:      true,
      status:        true,
      createdAt:     true,
      updatedAt:     true,
      assignedArtist: {
        select: { name: true, image: true },
      },
      workUpdates: {
        where:   { isVisibleToCustomer: true },
        select: {
          id:          true,
          title:       true,
          description: true,
          imageUrls:   true,
          videoUrls:   true,
          step:        true,
          createdAt:   true,
          artist:      { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!commission) {
    return NextResponse.json({ error: "Commission not found." }, { status: 404 });
  }

  return NextResponse.json({ commission });
}
