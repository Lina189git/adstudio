"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Brush,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  Ruler,
  Save,
} from "lucide-react";
import {
  getCanvasSizeLabel,
  getFrameStyleLabel,
  getPaintingStyleLabel,
} from "@/lib/paintingOrder";
import { getSafeImageSrc, isAllowedRemoteImageUrl } from "@/lib/safeImage";

type AddressLike = Record<string, unknown> | null;
type ImageMetrics = {
  width: number;
  height: number;
  aspectRatio: string;
  megapixels: string;
  estimatedPpi: string | null;
  printQuality: string | null;
};

interface OrderItem {
  id: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  customImageUrl: string | null;
  customStylePreset: string | null;
  product: {
    name: string;
    imageUrl?: string | null;
    description?: string | null;
  } | null;
  variant: {
    name: string;
    canvasSize?: string | null;
    frameStyle?: string | null;
  } | null;
}

interface Order {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  amountCents: number;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  currency: string;
  mode: string;
  status: string;
  paymentStatus: string;
  trackingNumber: string | null;
  notes: string | null;
  timelineEstimate: string | null;
  sourceImageUrl: string | null;
  previewUrl: string | null;
  stylePreset: string | null;
  canvasSize: string | null;
  frameStyle: string | null;
  quantity: number;
  shareToGallery: boolean;
  galleryTitle: string | null;
  galleryDisplayName: string | null;
  shippingAddress: AddressLike;
  billingAddress: AddressLike;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  orderItems: OrderItem[];
  _count?: {
    orderItems: number;
  };
}

interface OrderStats {
  total: number;
  pending: number;
  paid: number;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

const statusOptions = [
  "PENDING_PAYMENT",
  "PROCESSING",
  "IN_PRODUCTION",
  "IN_REVIEW",
  "READY_TO_SHIP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getOrderImage(order: Order, item?: OrderItem) {
  return getSafeImageSrc(
    item?.customImageUrl ||
    item?.product?.imageUrl ||
    order.previewUrl ||
    order.sourceImageUrl ||
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400"
  );
}

function formatAddress(address: AddressLike) {
  if (!address || typeof address !== "object") {
    return [];
  }

  const line1 = String(address.line1 || address.address1 || address.address || "").trim();
  const line2 = String(address.line2 || address.address2 || "").trim();
  const city = String(address.city || "").trim();
  const state = String(address.state || address.province || "").trim();
  const postalCode = String(address.postalCode || address.zip || "").trim();
  const country = String(address.country || "").trim();

  return [
    line1,
    line2,
    [city, state, postalCode].filter(Boolean).join(", "),
    country,
  ].filter(Boolean);
}

function OrderStatusBadge({ value }: { value: string }) {
  const palette =
    value === "CANCELLED"
      ? "bg-red-100 text-red-700"
      : value === "COMPLETED"
        ? "bg-emerald-100 text-emerald-700"
        : value === "SHIPPED"
          ? "bg-sky-100 text-sky-700"
          : "bg-[#1a1614] text-white";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${palette}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}

function parseCanvasSize(value?: string | null) {
  const match = String(value || "").match(/(\d+)\s*x\s*(\d+)/i);

  if (!match) {
    return null;
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

function buildImageMetrics(
  width: number,
  height: number,
  canvasSize?: string | null
): ImageMetrics {
  const printSize = parseCanvasSize(canvasSize);
  const ratio = `${width}:${height}`;

  if (!printSize) {
    return {
      width,
      height,
      aspectRatio: ratio,
      megapixels: (width * height / 1_000_000).toFixed(2),
      estimatedPpi: null,
      printQuality: null,
    };
  }

  const directFit = Math.min(width / printSize.width, height / printSize.height);
  const rotatedFit = Math.min(width / printSize.height, height / printSize.width);
  const ppi = Math.round(Math.max(directFit, rotatedFit));

  let printQuality = "Low for fine-art printing";
  if (ppi >= 300) {
    printQuality = "Excellent print quality";
  } else if (ppi >= 240) {
    printQuality = "Strong print quality";
  } else if (ppi >= 180) {
    printQuality = "Acceptable for medium viewing distance";
  }

  return {
    width,
    height,
    aspectRatio: ratio,
    megapixels: (width * height / 1_000_000).toFixed(2),
    estimatedPpi: `${ppi} PPI`,
    printQuality,
  };
}

function ArtworkAssetCard({
  title,
  rawUrl,
  orderId,
  asset,
  canvasSize,
}: {
  title: string;
  rawUrl: string | null;
  orderId: string;
  asset: "source" | "preview";
  canvasSize?: string | null;
}) {
  const [metrics, setMetrics] = useState<ImageMetrics | null>(null);
  const [loadError, setLoadError] = useState("");

  const safeUrl = getSafeImageSrc(rawUrl);
  const isDownloadable = isAllowedRemoteImageUrl(rawUrl);

  useEffect(() => {
    setMetrics(null);
    setLoadError("");

    if (!rawUrl) {
      return;
    }

    if (!isAllowedRemoteImageUrl(rawUrl)) {
      setLoadError("Image host is unsupported, so diagnostics are unavailable.");
      return;
    }

    const image = new window.Image();
    image.onload = () => {
      setMetrics(buildImageMetrics(image.naturalWidth, image.naturalHeight, canvasSize));
    };
    image.onerror = () => {
      setLoadError("Could not read image dimensions from the remote source.");
    };
    image.src = rawUrl;
  }, [canvasSize, rawUrl]);

  return (
    <div className="rounded-[1.25rem] border border-[#eadfcb] p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#8c7764]">
          {title}
        </h3>
        <div className="flex flex-wrap justify-end gap-2">
          {isDownloadable ? (
            <>
              <a
                href={rawUrl as string}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View
              </a>
              <a
                href={`/api/admin/orders/assets?orderId=${encodeURIComponent(orderId)}&asset=${asset}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </>
          ) : null}
        </div>
      </div>

      <div className="relative mt-4 h-48 overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]">
        <Image src={safeUrl} alt={title} fill sizes="(min-width: 768px) 320px, 100vw" className="object-cover" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#faf6ef] px-4 py-3 text-sm text-[#5d5148]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
            Resolution
          </p>
          <p className="mt-2 font-semibold text-[#1a1614]">
            {metrics ? `${metrics.width} x ${metrics.height}px` : "Loading..."}
          </p>
          <p className="mt-1 text-xs text-[#6b5d54]">
            {metrics
              ? `${metrics.megapixels} MP | Aspect ${metrics.aspectRatio}`
              : loadError || "Reading dimensions from the image source."}
          </p>
        </div>
        <div className="rounded-xl bg-[#faf6ef] px-4 py-3 text-sm text-[#5d5148]">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
            <Ruler className="h-3.5 w-3.5" />
            Print DPI
          </p>
          <p className="mt-2 font-semibold text-[#1a1614]">
            {metrics?.estimatedPpi || "Estimate unavailable"}
          </p>
          <p className="mt-1 text-xs text-[#6b5d54]">
            {metrics?.printQuality ||
              (canvasSize
                ? "Estimated from the selected canvas size."
                : "Canvas size is missing, so DPI cannot be estimated.")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersManager() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    paid: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState(statusOptions[0]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [timelineEstimate, setTimelineEstimate] = useState("");

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null;

  const syncSelection = useCallback((order: Order | null) => {
    if (!order) {
      setSelectedOrderId(null);
      setStatus(statusOptions[0]);
      setTrackingNumber("");
      setNotes("");
      setTimelineEstimate("");
      return;
    }

    setSelectedOrderId(order.id);
    setStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    setNotes(order.notes || "");
    setTimelineEstimate(order.timelineEstimate || "");
  }, []);

  const fetchStats = useCallback(async () => {
    const response = await fetch("/api/admin/orders/stats");
    if (!response.ok) {
      throw new Error("Failed to fetch order stats.");
    }
    setStats(await response.json());
  }, []);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "12",
      });

      if (statusFilter) {
        query.set("status", statusFilter);
      }

      if (search.trim()) {
        query.set("search", search.trim());
      }

      const response = await fetch(`/api/admin/orders?${query.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch orders.");
      }

      setOrders(data.orders);
      setPagination(data.pagination);

      const nextSelectedOrder =
        data.orders.find((order: Order) => order.id === selectedOrderId) ||
        data.orders[0] ||
        null;

      syncSelection(nextSelectedOrder);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  }, [search, selectedOrderId, statusFilter, syncSelection]);

  useEffect(() => {
    void Promise.all([fetchStats(), fetchOrders(1)]);
  }, [fetchOrders, fetchStats]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchOrders(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [fetchOrders]);

  const saveOrder = async (nextStatus = status) => {
    if (!selectedOrderId) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${selectedOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
          trackingNumber,
          notes,
          timelineEstimate,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update order.");
      }

      setSuccess(
        nextStatus === "CANCELLED"
          ? "Order cancelled successfully."
          : "Order updated successfully."
      );
      await Promise.all([fetchOrders(pagination.page), fetchStats()]);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update order."
      );
    } finally {
      setSaving(false);
    }
  };

  const shippingLines = formatAddress(selectedOrder?.shippingAddress || null);
  const billingLines = formatAddress(selectedOrder?.billingAddress || null);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total orders", value: stats.total },
          { label: "Pending payment", value: stats.pending },
          { label: "Paid orders", value: stats.paid },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8c7764]">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-[#1a1614]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_0.98fr]">
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1a1614]">Order Management</h2>
              <p className="mt-1 text-sm text-[#6b5d54]">
                Review custom painting details, customer info, and fulfillment progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchOrders(pagination.page)}
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_240px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by reference, customer, or email"
              className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]"
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-[1.25rem] border border-[#eadfcb] px-6 py-12 text-sm text-[#6b5d54]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-[1.25rem] border border-[#eadfcb] px-6 py-12 text-center text-sm text-[#6b5d54]">
                No orders matched the current filters.
              </div>
            ) : (
              orders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                const previewImage = getOrderImage(order);
                const orderItemCount =
                  order._count?.orderItems || order.orderItems.length || order.quantity;

                return (
                  <button
                    type="button"
                    key={order.id}
                    onClick={() => syncSelection(order)}
                    className={`w-full rounded-[1.35rem] border px-5 py-4 text-left transition ${
                      isSelected
                        ? "border-[#d4a574] bg-[#fff8ee] shadow-[0_12px_30px_rgba(212,165,116,0.15)]"
                        : "border-[#eadfcb] bg-white hover:bg-[#f8f1e6]"
                    }`}
                  >
                    <div className="grid gap-4 md:grid-cols-[88px_1fr_auto] md:items-center">
                      <div className="relative h-[88px] w-[88px] overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]">
                        <Image src={previewImage} alt={order.reference} fill sizes="88px" className="object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#8c7764]">
                          {order.reference}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-[#1a1614]">
                          {order.customerName}
                        </p>
                        <p className="mt-1 text-sm text-[#6b5d54]">{order.email}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <OrderStatusBadge value={order.status} />
                          <span className="rounded-full bg-[#f0e3d2] px-3 py-1 text-xs font-semibold text-[#6b5d54]">
                            Payment: {order.paymentStatus}
                          </span>
                          <span className="rounded-full bg-[#f6efe4] px-3 py-1 text-xs font-semibold text-[#8c7764]">
                            {orderItemCount} items
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-[#6b5d54]">
                          {order.mode === "PRINT" || order.mode === "DOWNLOAD"
                            ? `${getPaintingStyleLabel(order.stylePreset)}${order.canvasSize ? ` | ${getCanvasSizeLabel(order.canvasSize)}` : ""}${order.frameStyle ? ` | ${getFrameStyleLabel(order.frameStyle)}` : ""}`
                            : order.orderItems[0]?.product?.name || "Catalog order"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#1a1614]">
                          {formatMoney(order.amountCents)}
                        </p>
                        <p className="mt-1 text-sm text-[#6b5d54]">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-5 flex items-center justify-between text-sm text-[#6b5d54]">
            <span>
              Page {pagination.page} of {Math.max(pagination.pages, 1)} | {pagination.total} orders
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => void fetchOrders(pagination.page - 1)}
                className="rounded-full border border-[#eadfcb] px-4 py-2 font-semibold text-[#1a1614] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => void fetchOrders(pagination.page + 1)}
                className="rounded-full border border-[#eadfcb] px-4 py-2 font-semibold text-[#1a1614] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <h2 className="text-xl font-bold text-[#1a1614]">Order Detail</h2>
          <p className="mt-1 text-sm text-[#6b5d54]">
            Review artwork, shipping details, and update the order lifecycle.
          </p>

          {!selectedOrder ? (
            <div className="mt-6 rounded-[1.25rem] border border-dashed border-[#d9c9b3] bg-[#faf6ef] px-6 py-12 text-center text-sm text-[#6b5d54]">
              Select an order to review its artwork and admin controls.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {/* Order identity header */}
              <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7764]">Order reference</p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-[#1a1614]">
                      {selectedOrder.reference}
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-[#a89a8e]">
                      ID: {selectedOrder.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <OrderStatusBadge value={selectedOrder.status} />
                    <span className="rounded-full bg-[#f0e3d2] px-3 py-1 text-xs font-semibold text-[#6b5d54]">
                      {selectedOrder.paymentStatus}
                    </span>
                    <span className="rounded-full bg-[#f6efe4] px-3 py-1 text-xs font-semibold text-[#8c7764]">
                      {selectedOrder.mode}
                    </span>
                  </div>
                </div>
                <div className="mt-3 border-t border-[#eadfcb] pt-3">
                  <p className="font-semibold text-[#1a1614]">{selectedOrder.customerName}</p>
                  <p className="mt-0.5 text-sm text-[#6b5d54]">{selectedOrder.email}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                <div className="relative h-[120px] overflow-hidden rounded-[1.5rem] border border-[#eadfcb] bg-[#faf6ef]">
                  <Image
                    src={getOrderImage(selectedOrder)}
                    alt={selectedOrder.reference}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
                <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c7764]">Price breakdown</p>
                  <div className="mt-3 space-y-1.5 text-[#5d5148]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[#1a1614]">{formatMoney(selectedOrder.subtotalCents || selectedOrder.amountCents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="font-semibold text-[#1a1614]">{selectedOrder.shippingCents ? formatMoney(selectedOrder.shippingCents) : "Free"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span className="font-semibold text-[#1a1614]">{formatMoney(selectedOrder.taxCents || 0)}</span>
                    </div>
                    {selectedOrder.discountCents > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount</span>
                        <span className="font-semibold">−{formatMoney(selectedOrder.discountCents)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-[#eadfcb] pt-1.5 text-base font-bold text-[#1a1614]">
                      <span>Total</span>
                      <span>{formatMoney(selectedOrder.amountCents)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-[#eadfcb] p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#8c7764]">
                  Order Details
                </h3>
                <div className="mt-4 grid gap-x-8 gap-y-2 text-sm text-[#5d5148] sm:grid-cols-2">
                  <div>Created: <span className="font-semibold text-[#1a1614]">{formatDate(selectedOrder.createdAt)}</span></div>
                  {selectedOrder.user ? (
                    <div>Account: <span className="font-semibold text-[#1a1614]">{selectedOrder.user.name || selectedOrder.user.email || selectedOrder.user.id}</span></div>
                  ) : null}
                  {selectedOrder.stylePreset ? (
                    <div className="flex items-center gap-1.5"><Brush className="h-3.5 w-3.5 text-[#8c7764]" />Style: <span className="font-semibold text-[#1a1614]">{getPaintingStyleLabel(selectedOrder.stylePreset)}</span></div>
                  ) : null}
                  {selectedOrder.canvasSize ? (
                    <div>Canvas: <span className="font-semibold text-[#1a1614]">{getCanvasSizeLabel(selectedOrder.canvasSize)}</span></div>
                  ) : null}
                  {selectedOrder.frameStyle ? (
                    <div>Frame: <span className="font-semibold text-[#1a1614]">{getFrameStyleLabel(selectedOrder.frameStyle)}</span></div>
                  ) : null}
                  {selectedOrder.shareToGallery ? (
                    <div>Gallery: <span className="font-semibold text-[#1a1614]">{selectedOrder.galleryTitle || selectedOrder.galleryDisplayName || "Shared publicly"}</span></div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#1a1614]">
                  <span>Status</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-[#1a1614]">
                  <span>Tracking number</span>
                  <input
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium text-[#1a1614]">
                <span>Timeline estimate</span>
                <input
                  value={timelineEstimate}
                  onChange={(event) => setTimelineEstimate(event.target.value)}
                  className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
                  placeholder="Example: Ready for framing in 3 business days"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-[#1a1614]">
                <span>Internal notes</span>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.25rem] border border-[#eadfcb] p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#8c7764]">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h3>
                  <div className="mt-4 space-y-1 text-sm text-[#5d5148]">
                    {shippingLines.length ? shippingLines.map((line) => <p key={line}>{line}</p>) : <p>No shipping address provided.</p>}
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-[#eadfcb] p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#8c7764]">
                    <Mail className="h-4 w-4" />
                    Billing Address
                  </h3>
                  <div className="mt-4 space-y-1 text-sm text-[#5d5148]">
                    {billingLines.length ? billingLines.map((line) => <p key={line}>{line}</p>) : <p>No billing address provided.</p>}
                  </div>
                </div>
              </div>

              {selectedOrder.sourceImageUrl || selectedOrder.previewUrl ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedOrder.sourceImageUrl ? (
                    <ArtworkAssetCard
                      title="Source Photo"
                      rawUrl={selectedOrder.sourceImageUrl}
                      orderId={selectedOrder.id}
                      asset="source"
                      canvasSize={selectedOrder.canvasSize}
                    />
                  ) : null}
                  {selectedOrder.previewUrl ? (
                    <ArtworkAssetCard
                      title="Styled Preview"
                      rawUrl={selectedOrder.previewUrl}
                      orderId={selectedOrder.id}
                      asset="preview"
                      canvasSize={selectedOrder.canvasSize}
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-[1.25rem] border border-[#eadfcb] p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#8c7764]">
                  Line Items
                </h3>
                <div className="mt-4 space-y-3">
                  {selectedOrder.orderItems.length > 0 ? (
                    selectedOrder.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-4 rounded-xl border border-[#eadfcb] bg-[#faf6ef] p-4 md:grid-cols-[76px_1fr_auto]"
                      >
                        <div className="relative h-[76px] overflow-hidden rounded-2xl border border-[#eadfcb] bg-white">
                          <Image src={getOrderImage(selectedOrder, item)} alt={item.product?.name || "Order item"} fill sizes="76px" className="object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1614]">
                            {item.product?.name || "Custom painting order"}
                          </p>
                          <p className="mt-1 text-sm text-[#6b5d54]">
                            {item.variant?.name || getPaintingStyleLabel(item.customStylePreset || selectedOrder.stylePreset)} | Qty {item.quantity}
                          </p>
                          {(item.variant?.canvasSize || item.variant?.frameStyle) ? (
                            <p className="mt-1 text-xs text-[#8c7764]">
                              {getCanvasSizeLabel(item.variant?.canvasSize)} / {getFrameStyleLabel(item.variant?.frameStyle)}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#1a1614]">
                            {formatMoney(item.totalPriceCents)}
                          </p>
                          <p className="mt-1 text-xs text-[#6b5d54]">
                            Unit {formatMoney(item.unitPriceCents)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] p-4 text-sm text-[#5d5148]">
                      <div className="flex items-center gap-2 font-semibold text-[#1a1614]">
                        <Package className="h-4 w-4" />
                        Custom painting workflow order
                      </div>
                      <p className="mt-2">
                        This order was created from the painting conversion flow and stores its artwork details on the order record rather than product line items.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveOrder()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save order updates
                </button>
                <button
                  type="button"
                  disabled={saving || selectedOrder.status === "CANCELLED"}
                  onClick={() => void saveOrder("CANCELLED")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  Cancel order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
