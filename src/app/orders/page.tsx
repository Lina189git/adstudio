import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
import {
  getCanvasSizeLabel,
  getFrameStyleLabel,
  getPaintingStyleLabel,
} from "@/lib/paintingOrder";
import { getSafeImageSrc } from "@/lib/safeImage";
import { CheckCircle, Clock, Eye, Package, Truck } from "lucide-react";

async function getUserOrders(userId: string, email?: string | null) {
  try {
    return await prisma.paintingOrder.findMany({
      where: {
        OR: [
          { userId },
          ...(email ? [{ userId: null, email: email.toLowerCase() }] : []),
        ],
      },
      include: {
        orderItems: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "SHIPPED":
      return <Truck className="h-5 w-5 text-blue-600" />;
    case "PROCESSING":
    case "IN_PRODUCTION":
    case "IN_REVIEW":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    default:
      return <Package className="h-5 w-5 text-gray-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "text-green-600 bg-green-100";
    case "SHIPPED":
      return "text-blue-600 bg-blue-100";
    case "PROCESSING":
    case "IN_PRODUCTION":
    case "IN_REVIEW":
      return "text-yellow-600 bg-yellow-100";
    case "CANCELLED":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

function getOrderPreview(order: Awaited<ReturnType<typeof getUserOrders>>[number]) {
  return getSafeImageSrc(
    order.orderItems[0]?.customImageUrl ||
    order.orderItems[0]?.product?.imageUrl ||
    order.previewUrl ||
    order.sourceImageUrl ||
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200"
  );
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/orders");
  }

  const orders = await getUserOrders(session.user.id, session.user.email);
  const activeUserId = session.user.id;

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-[#1a1614]">My Orders</h1>
          <p className="text-[#6b5d54]">
            Track custom painting requests, print production, and product purchases in one place.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-[#6b5d54] opacity-50" />
            <h2 className="mb-2 text-xl font-semibold text-[#1a1614]">No orders yet</h2>
            <p className="mb-6 text-[#6b5d54]">
              You have not placed any orders yet. Start shopping or create a painting order to see it here.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/products"
                className="rounded-lg bg-[#1a1614] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#2a2624]"
              >
                Browse Products
              </Link>
              <Link
                href="/painting-order/upload"
                className="rounded-lg bg-[#f8f1e6] px-6 py-3 font-semibold text-[#1a1614] transition-colors hover:bg-[#eadfcb]"
              >
                Create Painting
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const hasLineItems = order.orderItems.length > 0;
              const previewImage = getOrderPreview(order);

              return (
                <div
                  key={order.id}
                  className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <h3 className="text-lg font-semibold text-[#1a1614]">
                          Order #{order.reference}
                        </h3>
                      </div>
                      <p className="text-sm text-[#6b5d54]">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replaceAll("_", " ")}
                      </div>
                      <p className="mt-1 text-lg font-bold text-[#1a1614]">
                        {formatPrice(order.amountCents)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4 md:grid-cols-[88px_1fr]">
                    <div className="relative h-[88px] overflow-hidden rounded-2xl border border-[#eadfcb] bg-white">
                      <Image src={previewImage} alt={order.reference} fill sizes="88px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      {hasLineItems ? (
                        <>
                          <h4 className="font-semibold text-[#1a1614]">
                            {order.orderItems[0]?.product?.name || "Product order"}
                          </h4>
                          <p className="mt-1 text-sm text-[#6b5d54]">
                            {order.orderItems
                              .map((item) => `${item.variant?.name || item.product?.name || "Item"} x ${item.quantity}`)
                              .join(" | ")}
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="font-semibold text-[#1a1614]">
                            {order.mode === "DOWNLOAD" ? "Digital oil painting" : "Custom framed oil painting"}
                          </h4>
                          <p className="mt-1 text-sm text-[#6b5d54]">
                            {getPaintingStyleLabel(order.stylePreset)}
                            {order.canvasSize ? ` | ${getCanvasSizeLabel(order.canvasSize)}` : ""}
                            {order.frameStyle ? ` | ${getFrameStyleLabel(order.frameStyle)}` : ""}
                            {order.quantity > 1 ? ` | Qty ${order.quantity}` : ""}
                          </p>
                        </>
                      )}
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                        Payment: {order.paymentStatus}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#eadfcb] pt-4">
                    <div className="text-sm text-[#6b5d54]">
                      {order.timelineEstimate || "Status updates will appear here as your order progresses."}
                    </div>
                    <Link
                      href={`/orders/${order.id}?userId=${encodeURIComponent(order.userId || activeUserId)}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#f8f1e6] px-4 py-2 text-sm font-semibold text-[#1a1614] transition-colors hover:bg-[#eadfcb]"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
