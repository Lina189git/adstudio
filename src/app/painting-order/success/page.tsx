import Link from "next/link";
import Stripe from "stripe";
import AppHeader from "@/components/painting-order/AppHeader";
import prisma from "@/lib/prisma";
import {
  getPaintingStyleLabel,
  normalizePaintingStylePreset,
} from "@/lib/paintingOrder";

interface SuccessPageProps {
  searchParams?: {
    session_id?: string;
  };
}

export default async function PaintingOrderSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const sessionId = searchParams?.session_id;

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return (
      <div className="min-h-screen bg-[#f8f1e6] text-[#1a1614]">
        <AppHeader />
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h1 className="text-4xl font-bold">Order status unavailable</h1>
          <p className="mt-4 text-[#6b5d54]">
            The Stripe session is missing or not configured.
          </p>
        </div>
      </div>
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const metadata = session.metadata || {};
  const mode = metadata.mode || "print";
  const shareToGallery = metadata.shareToGallery === "true";
  const stylePreset = normalizePaintingStylePreset(metadata.stylePreset);
  const previewUrl = metadata.previewUrl || null;
  const orderId = metadata.paintingOrderId || null;
  const isPaid = session.payment_status === "paid";

  let order = null;
  if (orderId) {
    order = await prisma.paintingOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        reference: true,
        status: true,
        paymentStatus: true,
        paidAt: true,
      },
    });

    if (order && isPaid && order.paymentStatus !== "PAID") {
      order = await prisma.paintingOrder.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: mode === "download" ? "PAID" : "IN_REVIEW",
          paidAt: new Date(),
          sharedAt: shareToGallery ? new Date() : null,
        },
        select: {
          id: true,
          reference: true,
          status: true,
          paymentStatus: true,
          paidAt: true,
        },
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#1a1614]">
      <AppHeader />
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-8 shadow-[0_20px_70px_rgba(26,22,20,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
            Painting order success
          </div>
          <h1 className="mt-3 text-4xl font-bold">
            {mode === "download"
              ? "Payment completed. Your stylized file is ready."
              : "Payment completed. Your canvas order is in production review."}
          </h1>
          <p className="mt-4 text-[#6b5d54]">
            Session: <span className="font-semibold text-[#1a1614]">{session.id}</span>
          </p>
          {order?.reference && (
            <p className="mt-2 text-[#6b5d54]">
              Order reference:{" "}
              <span className="font-semibold text-[#1a1614]">{order.reference}</span>
            </p>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-[#faf6ef] p-6">
              <div className="text-sm font-semibold text-[#6b5d54]">
                Order summary
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  Customer:{" "}
                  <span className="font-semibold">{metadata.customerName || session.customer_details?.name || "Unknown"}</span>
                </div>
                <div>
                  Email:{" "}
                  <span className="font-semibold">{metadata.email || session.customer_details?.email || "Unknown"}</span>
                </div>
                <div>
                  Product: <span className="font-semibold">{mode}</span>
                </div>
                <div>
                  Payment:{" "}
                  <span className="font-semibold">
                    {order?.paymentStatus || session.payment_status || "pending"}
                  </span>
                </div>
                <div>
                  Workflow status:{" "}
                  <span className="font-semibold">{order?.status || "PENDING_PAYMENT"}</span>
                </div>
                <div>
                  Style: <span className="font-semibold">{getPaintingStyleLabel(stylePreset)}</span>
                </div>
                {mode === "print" && (
                  <>
                    <div>
                      Canvas size:{" "}
                      <span className="font-semibold">{metadata.canvasSize || "12x16"}</span>
                    </div>
                    <div>
                      Frame style:{" "}
                      <span className="font-semibold">{metadata.frameStyle || "none"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-[#faf6ef] p-6">
              <div className="text-sm font-semibold text-[#6b5d54]">
                Next step
              </div>
              <div className="mt-4 text-sm leading-7 text-[#6b5d54]">
                {mode === "download"
                  ? "Use the download link below to retrieve the stylized oil-paint file."
                  : "Use the preview link below to review the styled artwork while the print order is finalized."}
              </div>

              {shareToGallery && (
                <div className="mt-3 text-sm text-[#6b5d54]">
                  This artwork is marked for the public gallery.
                </div>
              )}

              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white"
                >
                  {mode === "download" ? "Open download file" : "Open artwork preview"}
                </a>
              )}

              <div className="mt-4">
                <Link
                  href="/painting-order/upload"
                  className="text-sm font-semibold text-[#c89860]"
                >
                  Create another artwork
                </Link>
              </div>
              {shareToGallery && (
                <div className="mt-2">
                  <Link
                    href="/painting-order/gallery"
                    className="text-sm font-semibold text-[#c89860]"
                  >
                    View public gallery
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
