import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";
import prisma from "@/lib/prisma";
import {
  getCanvasSizeLabel,
  getFrameStyleLabel,
  getPaintingStyleLabel,
} from "@/lib/paintingOrder";
import { getSafeImageSrc } from "@/lib/safeImage";
import {
  ArrowLeft,
  Brush,
  CheckCircle,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Truck,
} from "lucide-react";

async function getOrder(orderId: string, userId: string, email?: string | null) {
  try {
    return await prisma.paintingOrder.findFirst({
      where: {
        id: orderId,
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
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    case "SHIPPED":
      return <Truck className="h-6 w-6 text-blue-600" />;
    case "PROCESSING":
    case "IN_PRODUCTION":
    case "IN_REVIEW":
      return <Clock className="h-6 w-6 text-yellow-600" />;
    default:
      return <Package className="h-6 w-6 text-gray-600" />;
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

function formatAddress(address: unknown) {
  if (!address || typeof address !== "object") {
    return [];
  }

  const entry = address as Record<string, unknown>;
  const line1 = String(entry.line1 || entry.address1 || entry.address || "").trim();
  const line2 = String(entry.line2 || entry.address2 || "").trim();
  const city = String(entry.city || "").trim();
  const state = String(entry.state || entry.province || "").trim();
  const postalCode = String(entry.postalCode || entry.zip || "").trim();
  const country = String(entry.country || "").trim();

  return [line1, line2, [city, state, postalCode].filter(Boolean).join(", "), country].filter(Boolean);
}

function getOrderPreview(order: NonNullable<Awaited<ReturnType<typeof getOrder>>>) {
  return getSafeImageSrc(
    order.orderItems[0]?.customImageUrl ||
    order.orderItems[0]?.product?.imageUrl ||
    order.previewUrl ||
    order.sourceImageUrl ||
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800"
  );
}

interface OrderPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    userId?: string;
  };
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/orders/${params.id}`);
  }

  if (searchParams?.userId && searchParams.userId !== session.user.id) {
    notFound();
  }

  const order = await getOrder(params.id, session.user.id, session.user.email);

  if (!order) {
    notFound();
  }

  const shippingLines = formatAddress(order.shippingAddress);
  const billingLines = formatAddress(order.billingAddress);
  const hasLineItems = order.orderItems.length > 0;

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <Link
            href="/orders"
            className="mb-4 inline-flex items-center gap-2 text-[#6b5d54] transition-colors hover:text-[#1a1614]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          <div className="mb-2 flex items-center gap-3">
            {getStatusIcon(order.status)}
            <h1 className="text-3xl font-bold text-[#1a1614]">Order #{order.reference}</h1>
          </div>

          <p className="text-[#6b5d54]">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <div className="relative h-[360px] overflow-hidden rounded-[1.5rem] border border-[#eadfcb] bg-[#faf6ef]">
                <Image
                  src={getOrderPreview(order)}
                  alt={order.reference}
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="object-cover"
                />
              </div>

              {(order.sourceImageUrl || order.previewUrl) && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {order.sourceImageUrl ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                        Source photo
                      </p>
                      <div className="relative h-28 overflow-hidden rounded-xl border border-[#eadfcb] bg-[#faf6ef]">
                        <Image src={getSafeImageSrc(order.sourceImageUrl)} alt="Source photo" fill sizes="220px" className="object-cover" />
                      </div>
                    </div>
                  ) : null}
                  {order.previewUrl ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                        Styled preview
                      </p>
                      <div className="relative h-28 overflow-hidden rounded-xl border border-[#eadfcb] bg-[#faf6ef]">
                        <Image src={getSafeImageSrc(order.previewUrl)} alt="Styled preview" fill sizes="220px" className="object-cover" />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="mb-4 text-xl font-semibold text-[#1a1614]">
                {hasLineItems ? "Order Items" : "Painting Details"}
              </h2>

              {hasLineItems ? (
                <div className="space-y-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="grid gap-4 rounded-lg bg-[#faf6ef] p-4 md:grid-cols-[76px_1fr_auto]">
                      <div className="relative h-[76px] overflow-hidden rounded-xl border border-[#eadfcb] bg-white">
                        <Image
                          src={item.customImageUrl || item.product?.imageUrl || getOrderPreview(order)}
                          alt={item.product?.name || "Product"}
                          fill
                          sizes="76px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1a1614]">
                          {item.product?.name || "Custom Order"}
                        </h3>
                        <p className="mt-1 text-sm text-[#6b5d54]">
                          {item.variant?.name || "Standard"} x {item.quantity}
                        </p>
                        {(item.variant?.canvasSize || item.variant?.frameStyle) ? (
                          <p className="mt-1 text-xs text-[#8c7764]">
                            {getCanvasSizeLabel(item.variant?.canvasSize)} / {getFrameStyleLabel(item.variant?.frameStyle)}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#1a1614]">{formatPrice(item.totalPriceCents)}</p>
                        <p className="mt-1 text-xs text-[#6b5d54]">Unit {formatPrice(item.unitPriceCents)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-[#faf6ef] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Style</p>
                    <p className="mt-2 flex items-center gap-2 font-semibold text-[#1a1614]">
                      <Brush className="h-4 w-4 text-[#8c7764]" />
                      {getPaintingStyleLabel(order.stylePreset)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#faf6ef] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Format</p>
                    <p className="mt-2 font-semibold text-[#1a1614]">
                      {order.mode === "DOWNLOAD" ? "Digital download" : `${getCanvasSizeLabel(order.canvasSize)} / ${getFrameStyleLabel(order.frameStyle)}`}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#faf6ef] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Quantity</p>
                    <p className="mt-2 font-semibold text-[#1a1614]">{order.quantity}</p>
                  </div>
                  <div className="rounded-xl bg-[#faf6ef] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Timeline</p>
                    <p className="mt-2 font-semibold text-[#1a1614]">{order.timelineEstimate || "Pending review"}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 border-t border-[#eadfcb] pt-4">
                <div className="flex justify-between text-sm text-[#6b5d54]">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotalCents || order.amountCents)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-[#6b5d54]">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shippingCents || 0)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-[#6b5d54]">
                  <span>Tax</span>
                  <span>{formatPrice(order.taxCents || 0)}</span>
                </div>
                <div className="mt-4 flex justify-between text-lg font-bold text-[#1a1614]">
                  <span>Total</span>
                  <span>{formatPrice(order.amountCents)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="mb-4 text-xl font-semibold text-[#1a1614]">Order Status</h2>
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.replaceAll("_", " ")}
              </div>
              <p className="mt-3 text-sm text-[#6b5d54]">
                {order.timelineEstimate || "We will continue updating this order as production and fulfillment progress."}
              </p>

              {order.trackingNumber ? (
                <div className="mt-4 border-t border-[#eadfcb] pt-4">
                  <p className="mb-1 text-sm font-medium text-[#1a1614]">Tracking Number</p>
                  <p className="font-mono text-sm text-[#6b5d54]">{order.trackingNumber}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[#1a1614]">
                <CreditCard className="h-5 w-5" />
                Payment
              </h2>
              <div className="space-y-3 text-sm text-[#5d5148]">
                <div>
                  <p className="font-medium text-[#1a1614]">User ID</p>
                  <p className="mt-1 break-all">{order.userId || session.user.id}</p>
                </div>
                <div>
                  <p className="font-medium text-[#1a1614]">Email</p>
                  <p className="mt-1 flex items-center gap-2"><Mail className="h-4 w-4 text-[#8c7764]" />{order.email}</p>
                </div>
                <div>
                  <p className="font-medium text-[#1a1614]">Payment Status</p>
                  <p className="mt-1">{order.paymentStatus}</p>
                </div>
                <div>
                  <p className="font-medium text-[#1a1614]">Order Mode</p>
                  <p className="mt-1">{order.mode}</p>
                </div>
                {order.notes ? (
                  <div>
                    <p className="font-medium text-[#1a1614]">Notes</p>
                    <p className="mt-1">{order.notes}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[#1a1614]">
                <MapPin className="h-5 w-5" />
                Address
              </h2>
              <div className="grid gap-4">
                <div>
                  <p className="font-medium text-[#1a1614]">Shipping Address</p>
                  <div className="mt-1 text-sm text-[#6b5d54]">
                    {shippingLines.length ? shippingLines.map((line) => <p key={line}>{line}</p>) : <p>Not provided.</p>}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[#1a1614]">Billing Address</p>
                  <div className="mt-1 text-sm text-[#6b5d54]">
                    {billingLines.length ? billingLines.map((line) => <p key={line}>{line}</p>) : <p>Not provided.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
