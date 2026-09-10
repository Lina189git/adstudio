import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

// DELETE /api/admin/cart/:itemId — admin removes a single cart item
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  await prisma.cartItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ ok: true });
}
