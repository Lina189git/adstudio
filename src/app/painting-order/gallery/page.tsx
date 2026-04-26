import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Painting Gallery",
  description:
    "Public gallery of shared converted oil-paint artworks from painting-order users.",
};

async function getGalleryItems() {
  return prisma.paintingOrder.findMany({
    where: {
      shareToGallery: true,
      paymentStatus: "PAID",
    },
    orderBy: [{ isFeatured: "desc" }, { sharedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      reference: true,
      previewUrl: true,
      galleryTitle: true,
      galleryDisplayName: true,
      stylePreset: true,
      canvasSize: true,
      frameStyle: true,
      mode: true,
      isFeatured: true,
      sharedAt: true,
      createdAt: true,
    },
    take: 48,
  });
}

export default async function PaintingGalleryPage() {
  const items = await getGalleryItems();

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#1a1614]">
      <AppHeader />

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
              Public painting gallery
            </div>
            <h1 className="mt-3 text-4xl font-bold">
              Shared converted oil-paint artworks
            </h1>
            <p className="mt-3 max-w-3xl text-[#6b5d54]">
              Users can choose to publish converted artworks after preview and payment.
              This gallery displays those shared pieces.
            </p>
          </div>
          <Link
            href="/painting-order/upload"
            className="rounded-2xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white"
          >
            Create your artwork
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border-2 border-[#eadfcb] bg-white p-10 text-center text-[#6b5d54]">
            No shared artworks yet.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-[1.75rem] border-2 border-[#eadfcb] bg-white shadow-[0_10px_30px_rgba(26,22,20,0.06)]"
              >
                <div className="relative">
                  <img
                    src={
                      item.previewUrl ||
                      "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="
                    }
                    alt={item.galleryTitle || item.reference}
                    className="h-72 w-full object-cover"
                  />
                  {item.isFeatured && (
                    <div className="absolute left-4 top-4 rounded-full bg-[#1a1614] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                      Featured
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="text-lg font-semibold">
                    {item.galleryTitle || "Untitled oil-paint conversion"}
                  </div>
                  <div className="mt-1 text-sm text-[#6b5d54]">
                    by {item.galleryDisplayName || "Anonymous"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#6b5d54]">
                    <span className="rounded-full bg-[#faf6ef] px-3 py-1">
                      {item.stylePreset}
                    </span>
                    <span className="rounded-full bg-[#faf6ef] px-3 py-1">
                      {item.mode}
                    </span>
                    {item.canvasSize && (
                      <span className="rounded-full bg-[#faf6ef] px-3 py-1">
                        {item.canvasSize}
                      </span>
                    )}
                    {item.frameStyle && (
                      <span className="rounded-full bg-[#faf6ef] px-3 py-1">
                        {item.frameStyle}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
