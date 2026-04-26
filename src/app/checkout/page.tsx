import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppHeader from "@/components/painting-order/AppHeader";
import prisma from "@/lib/prisma";
import CheckoutClient from "@/components/checkout/CheckoutClient";

type AuthSession = Session & { user: { id: string; email?: string | null; name?: string | null } };

async function getCartItems(userId: string) {
  try {
    return await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            basePriceCents: true,
            imageUrl: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            canvasSize: true,
            frameStyle: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions) as AuthSession | null;

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/checkout");
  }

  const cartItems = await getCartItems(session.user.id);

  if (cartItems.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <AppHeader />
      <CheckoutClient
        cartItems={cartItems}
        userEmail={session.user.email ?? ""}
        userName={session.user.name ?? ""}
      />
    </div>
  );
}
