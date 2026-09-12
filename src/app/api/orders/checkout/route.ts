import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateReference(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${yy}${mm}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      country,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
    } = body;

    if (!firstName?.trim() || !lastName?.trim() || !address?.trim() || !city?.trim() || !zip?.trim() || !country?.trim()) {
      return NextResponse.json(
        { error: "Please fill in all required shipping fields." },
        { status: 400 }
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true, variant: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    // Generate a unique reference (retry on collision)
    let reference = generateReference();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await prisma.paintingOrder.findUnique({ where: { reference } });
      if (!clash) break;
      reference = generateReference();
    }

    const shippingAddress = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || null,
      line1: address.trim(),
      city: city.trim(),
      state: state?.trim() || "",
      postalCode: zip.trim(),
      country: country.trim(),
    };

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.paintingOrder.create({
        data: {
          reference,
          customerName: `${firstName.trim()} ${lastName.trim()}`,
          email: (email?.trim() || session.user.email || "").toLowerCase(),
          userId: session.user.id,
          mode: "CATALOG",
          subtotalCents: subtotalCents ?? 0,
          shippingCents: shippingCents ?? 0,
          taxCents: taxCents ?? 0,
          amountCents: totalCents ?? 0,
          shippingAddress,
          billingAddress: shippingAddress,
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          orderItems: {
            create: cartItems.map((item) => {
              const unitPrice =
                item.product.basePriceCents + (item.variant?.priceCents ?? 0);
              return {
                productId: item.productId,
                variantId: item.variantId ?? undefined,
                quantity: item.quantity,
                unitPriceCents: unitPrice,
                totalPriceCents: unitPrice * item.quantity,
              };
            }),
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { userId: session.user.id } });

      return created;
    });

    return NextResponse.json({
      orderId: order.id,
      reference: order.reference,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to place order. Please try again." },
      { status: 500 }
    );
  }
}
