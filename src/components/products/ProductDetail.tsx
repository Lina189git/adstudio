"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  Frame,
  Heart,
  Maximize,
  MessagesSquare,
  Minimize,
  MonitorUp,
  Package,
  Palette,
  RotateCcw,
  ShoppingCart,
  Shield,
  Square,
  StretchHorizontal,
  Truck,
} from "lucide-react";
import { getCanvasSizeLabel, getFrameStyleLabel } from "@/lib/paintingOrder";
import { getSafeImageSrc } from "@/lib/safeImage";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePriceCents: number;
  currency: string;
  imageUrl: string | null;
  galleryImages?: string[];
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variants: Array<{
    id: string;
    name: string;
    canvasSize: string;
    frameStyle: string;
    previewImageUrl?: string | null;
    details?: string | null;
    priceCents: number;
    stockQuantity: number;
  }>;
  _count: {
    orderItems: number;
  };
}

interface ProductDetailProps {
  product: Product;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200";

export default function ProductDetail({ product }: ProductDetailProps) {
  const { data: session } = useSession();
  const sizeMenuRef = useRef<HTMLDivElement | null>(null);
  const frameMenuRef = useRef<HTMLDivElement | null>(null);
  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.canvasSize || "");
  const [selectedFrame, setSelectedFrame] = useState(product.variants[0]?.frameStyle || "");
  const [showSizeOptions, setShowSizeOptions] = useState(false);
  const [showFrameOptions, setShowFrameOptions] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(
    getSafeImageSrc(
      product.galleryImages?.[0] ||
        product.imageUrl ||
        FALLBACK_IMAGE
    )
  );

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const sizeMeta: Record<string, { icon: typeof Square; note: string }> = {
    "8x10": { icon: Minimize, note: "Compact accent format" },
    "12x16": { icon: Square, note: "Balanced studio size" },
    "18x24": { icon: StretchHorizontal, note: "Gallery-ready scale" },
    "24x36": { icon: Maximize, note: "Statement wall piece" },
  };

  const frameMeta: Record<string, { icon: typeof Frame; note: string }> = {
    none: { icon: MonitorUp, note: "Canvas-only finish" },
    black_wood: { icon: Frame, note: "Sharp modern border" },
    walnut: { icon: Frame, note: "Warm natural wood tone" },
    gold_gallery: { icon: Frame, note: "Classic gallery trim" },
  };

  const variants = useMemo(
    () =>
      [...product.variants].sort((left, right) => {
        if (left.priceCents !== right.priceCents) {
          return left.priceCents - right.priceCents;
        }

        return left.name.localeCompare(right.name);
      }),
    [product.variants]
  );

  const sizeOptions = useMemo(
    () => [...new Set(variants.map((variant) => variant.canvasSize))],
    [variants]
  );

  useEffect(() => {
    if (!variants.length) {
      return;
    }

    const currentVariant = variants.find(
      (variant) =>
        variant.canvasSize === selectedSize && variant.frameStyle === selectedFrame
    );

    if (!currentVariant) {
      setSelectedSize(variants[0].canvasSize);
      setSelectedFrame(variants[0].frameStyle);
    }
  }, [selectedFrame, selectedSize, variants]);

  const availableFrames = useMemo(() => {
    const size = selectedSize || variants[0]?.canvasSize;

    return [
      ...new Set(
        variants
          .filter((variant) => variant.canvasSize === size)
          .map((variant) => variant.frameStyle)
      ),
    ];
  }, [selectedSize, variants]);

  useEffect(() => {
    if (!availableFrames.length) {
      return;
    }

    if (!availableFrames.includes(selectedFrame)) {
      setSelectedFrame(availableFrames[0]);
    }
  }, [availableFrames, selectedFrame]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (sizeMenuRef.current && !sizeMenuRef.current.contains(target)) {
        setShowSizeOptions(false);
      }

      if (frameMenuRef.current && !frameMenuRef.current.contains(target)) {
        setShowFrameOptions(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const selectedVariant =
    variants.find(
      (variant) =>
        variant.canvasSize === selectedSize && variant.frameStyle === selectedFrame
    ) || variants[0];

  useEffect(() => {
    setActiveImage(
      getSafeImageSrc(
        product.galleryImages?.[0] || product.imageUrl || FALLBACK_IMAGE
      )
    );
  }, [product.galleryImages, product.imageUrl]);

  const galleryImages = useMemo(
    () =>
      [
        product.imageUrl,
        ...(product.galleryImages || []),
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => getSafeImageSrc(value))
        .filter((value, index, collection) => collection.indexOf(value) === index),
    [product.galleryImages, product.imageUrl]
  );

  const totalPrice =
    (product.basePriceCents + (selectedVariant?.priceCents || 0)) * quantity;

  const selectedFrameMeta =
    frameMeta[selectedVariant?.frameStyle || ""] || frameMeta.none;

  const selectedSizeMeta =
    sizeMeta[selectedVariant?.canvasSize || ""] || {
      icon: Square,
      note: "Custom canvas format",
    };

  const trustItems = [
    {
      icon: Truck,
      title: "Protected delivery",
      text: "Packed for framed art and shipped with tracked delivery.",
    },
    {
      icon: Palette,
      title: "Studio-crafted finish",
      text: "Each size and frame combination is curated for wall display.",
    },
    {
      icon: Shield,
      title: "30-day support window",
      text: "If the delivered piece is not right, the order can be reviewed quickly.",
    },
    {
      icon: MessagesSquare,
      title: "Collector assistance",
      text: "Use the product and account flow to keep the order traceable.",
    },
  ];

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      return;
    }

    if (!session?.user) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(
        `/products/${product.slug}`
      )}`;
      return;
    }

    setIsAddingToCart(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant.id,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      setAddedToCart(true);
      window.setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[#6b5d54]">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 transition-colors hover:text-[#1a1614]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <span>/</span>
        <Link
          href={`/products?category=${product.category.slug}`}
          className="transition-colors hover:text-[#1a1614]"
        >
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[96px_1fr]">
            <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col">
              {(galleryImages.length ? galleryImages : [activeImage]).map((imageUrl) => (
                <button
                  key={imageUrl}
                  type="button"
                  onClick={() => setActiveImage(imageUrl)}
                  className={`relative h-20 min-w-20 overflow-hidden rounded-2xl border transition ${
                    activeImage === imageUrl
                      ? "border-[#1a1614] shadow-[0_10px_25px_rgba(26,22,20,0.12)]"
                      : "border-[#eadfcb] hover:border-[#d4a574]"
                  }`}
                >
                  <Image
                    src={imageUrl}
                    alt={`${product.name} preview`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="order-1 overflow-hidden rounded-[2rem] border border-[#eadfcb] bg-white shadow-[0_18px_50px_rgba(26,22,20,0.08)] lg:order-2">
              <div className="relative aspect-[0.96] bg-[#f6efe4]">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1280px) 56vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8f1e6]">
                  <selectedSizeMeta.icon className="h-5 w-5 text-[#1a1614]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                    Canvas size
                  </p>
                  <p className="mt-1 font-semibold text-[#1a1614]">
                    {getCanvasSizeLabel(selectedVariant?.canvasSize || "")}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#6b5d54]">{selectedSizeMeta.note}</p>
            </div>

            <div className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8f1e6]">
                  <selectedFrameMeta.icon className="h-5 w-5 text-[#1a1614]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                    Frame finish
                  </p>
                  <p className="mt-1 font-semibold text-[#1a1614]">
                    {getFrameStyleLabel(selectedVariant?.frameStyle || "")}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#6b5d54]">
                {selectedVariant?.details || selectedFrameMeta.note}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8f1e6]">
                  <BadgeCheck className="h-5 w-5 text-[#1a1614]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                    Order signal
                  </p>
                  <p className="mt-1 font-semibold text-[#1a1614]">
                    {product._count.orderItems} confirmed orders
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#6b5d54]">
                Useful for buyers who want proven catalog configurations.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#eadfcb] bg-white p-6 shadow-[0_12px_35px_rgba(26,22,20,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c7764]">
              Studio note
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#1a1614]">
              Crafted to feel like a finished wall piece, not just a catalog SKU
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5d5148]">
              {product.description ||
                product.shortDescription ||
                "This product page is configured so the selected frame, size, and preview stay tied to the exact variant the customer is buying."}
            </p>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7e6d5e]">
                {product.category.name}
              </span>
              {product.isFeatured ? (
                <span className="rounded-full bg-[#1a1614] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                  Featured
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-[#1a1614]">
              {product.name}
            </h1>
            {product.shortDescription ? (
              <p className="mt-4 text-base leading-7 text-[#5d5148]">
                {product.shortDescription}
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#dbcdb9] bg-[#fffaf2] shadow-[0_18px_55px_rgba(26,22,20,0.08)]">
            <div className="border-b border-[#eadfcb] px-6 py-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                    Selected total
                  </p>
                  <p className="mt-1 text-4xl font-bold text-[#1a1614]">
                    {formatPrice(totalPrice)}
                  </p>
                  <p className="mt-2 text-sm text-[#6b5d54]">
                    Base {formatPrice(product.basePriceCents)}
                    {selectedVariant?.priceCents
                      ? ` + frame/size ${formatPrice(selectedVariant.priceCents)}`
                      : " with no added variant surcharge"}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[#eadfcb] bg-white px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8c7764]">
                    Orders
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#1a1614]">
                    {product._count.orderItems}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c7764]">
                  Configure your print
                </p>
                <h3 className="mt-2 text-xl font-bold text-[#1a1614]">
                  Select size and frame
                </h3>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                  Canvas size
                </p>
                <div ref={sizeMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSizeOptions((current) => !current);
                      setShowFrameOptions(false);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#d9ccb9] bg-[#faf6ef] px-4 py-3 text-left transition hover:border-[#d4a574] hover:bg-[#fff8ef]"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#1a1614]">
                        {getCanvasSizeLabel(selectedSize)}
                      </div>
                      <div className="mt-1 text-xs text-[#6b5d54]">
                        Compact floating selector
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#6b5d54] transition-transform ${
                        showSizeOptions ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showSizeOptions ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 space-y-2 rounded-[1.5rem] border border-[#eadfcb] bg-white p-2 shadow-[0_18px_45px_rgba(26,22,20,0.16)]">
                      {sizeOptions.map((size) => {
                        const isSelected = size === selectedSize;
                        const meta =
                          sizeMeta[size] || {
                            icon: Square,
                            note: "Custom canvas format",
                          };
                        const Icon = meta.icon;

                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setSelectedSize(size);
                              setShowSizeOptions(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                              isSelected
                                ? "border-[#1a1614] bg-[#1a1614] text-white"
                                : "border-[#d9ccb9] bg-white text-[#1a1614] hover:border-[#d4a574] hover:bg-[#fff8ef]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                  isSelected ? "bg-white/15" : "bg-[#f8f1e6]"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold">
                                  {getCanvasSizeLabel(size)}
                                </div>
                                <div
                                  className={`text-xs ${
                                    isSelected ? "text-white/75" : "text-[#6b5d54]"
                                  }`}
                                >
                                  {meta.note}
                                </div>
                              </div>
                            </div>
                            <div
                              className={`text-xs ${
                                isSelected ? "text-white/80" : "text-[#8c7764]"
                              }`}
                            >
                              {
                                variants.filter(
                                  (variant) => variant.canvasSize === size
                                ).length
                              }{" "}
                              options
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                  Frame finish
                </p>
                <div ref={frameMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFrameOptions((current) => !current);
                      setShowSizeOptions(false);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#d9ccb9] bg-[#faf6ef] px-4 py-3 text-left transition hover:border-[#d4a574] hover:bg-[#fff8ef]"
                  >
                    <div className="flex items-center gap-3">
                      {selectedVariant?.previewImageUrl ? (
                        <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-[#eadfcb] bg-white">
                          <Image
                            src={getSafeImageSrc(selectedVariant.previewImageUrl)}
                            alt={`${getFrameStyleLabel(selectedFrame)} example`}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f1e6]">
                          <Frame className="h-4 w-4 text-[#1a1614]" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-[#1a1614]">
                          {getFrameStyleLabel(selectedFrame)}
                        </div>
                        <div className="mt-1 text-xs text-[#6b5d54]">
                          {selectedVariant?.details || "Choose frame finish"}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#6b5d54] transition-transform ${
                        showFrameOptions ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showFrameOptions ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 space-y-2 rounded-[1.5rem] border border-[#eadfcb] bg-white p-2 shadow-[0_18px_45px_rgba(26,22,20,0.16)]">
                      {availableFrames.map((frame) => {
                        const isSelected = frame === selectedFrame;
                        const matchedVariant = variants.find(
                          (variant) =>
                            variant.canvasSize === selectedSize &&
                            variant.frameStyle === frame
                        );
                        const surcharge = matchedVariant?.priceCents || 0;
                        const meta =
                          frameMeta[frame] || {
                            icon: Frame,
                            note: "Custom framing",
                          };
                        const Icon = meta.icon;

                        return (
                          <button
                            key={frame}
                            type="button"
                            onClick={() => {
                              setSelectedFrame(frame);
                              setShowFrameOptions(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                              isSelected
                                ? "border-[#1a1614] bg-white shadow-[0_8px_20px_rgba(26,22,20,0.08)]"
                                : "border-[#d9ccb9] bg-white/80 hover:border-[#d4a574]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {matchedVariant?.previewImageUrl ? (
                                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[#eadfcb] bg-white">
                                  <Image
                                    src={getSafeImageSrc(
                                      matchedVariant.previewImageUrl
                                    )}
                                    alt={`${getFrameStyleLabel(frame)} example`}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div
                                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                    isSelected ? "bg-[#f8f1e6]" : "bg-[#faf6ef]"
                                  }`}
                                >
                                  <Icon className="h-4 w-4 text-[#1a1614]" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-[#1a1614]">
                                  {getFrameStyleLabel(frame)}
                                </div>
                                <div className="mt-1 text-xs text-[#6b5d54]">
                                  {matchedVariant?.details || meta.note}
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-xs text-[#6b5d54]">
                              <div>
                                {surcharge > 0
                                  ? `+${formatPrice(surcharge)}`
                                  : "Included"}
                              </div>
                              {matchedVariant &&
                              matchedVariant.stockQuantity < quantity ? (
                                <div className="mt-1 text-red-600">Low stock</div>
                              ) : (
                                <div className="mt-1 text-[#8c7764]">
                                  {isSelected ? "Selected" : "Available"}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              <div>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                    Quantity
                  </span>
                  <select
                    value={quantity}
                    onChange={(event) => setQuantity(parseInt(event.target.value))}
                    className="w-full rounded-2xl border border-[#d9ccb9] bg-white px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                      Selected build
                    </p>
                    <p className="mt-2 text-lg font-bold text-[#1a1614]">
                      {getCanvasSizeLabel(selectedVariant?.canvasSize || "")} /{" "}
                      {getFrameStyleLabel(selectedVariant?.frameStyle || "")}
                    </p>
                    <p className="mt-2 text-sm text-[#6b5d54]">
                      {selectedVariant?.details ||
                        "This selection stays attached to the exact variant added to cart."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f8f1e6] px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8c7764]">
                      Variant
                    </p>
                    <p className="mt-1 text-base font-bold text-[#1a1614]">
                      {selectedVariant?.priceCents
                        ? `+${formatPrice(selectedVariant.priceCents)}`
                        : "Included"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                    isAddingToCart ||
                    !selectedVariant ||
                    (selectedVariant.stockQuantity > 0 &&
                      selectedVariant.stockQuantity < quantity)
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1a1614] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#2a2624] disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {addedToCart ? (
                    <>
                      <Check className="h-5 w-5" />
                      Added to Cart
                    </>
                  ) : isAddingToCart ? (
                    "Adding..."
                  ) : !session?.user ? (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Sign In to Buy
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#1a1614] px-8 py-4 font-semibold text-[#1a1614] transition-colors hover:bg-[#1a1614] hover:text-white"
                >
                  <Heart className="h-5 w-5" />
                  Save for Later
                </button>
              </div>

              <div className="grid gap-3 border-t border-[#eadfcb] pt-5 sm:grid-cols-2">
                {trustItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.35rem] border border-[#eadfcb] bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f8f1e6]">
                        <item.icon className="h-4 w-4 text-[#1a1614]" />
                      </div>
                      <p className="font-semibold text-[#1a1614]">{item.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#6b5d54]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8f1e6]">
              <Package className="h-5 w-5 text-[#1a1614]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                What arrives
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#1a1614]">
                Variant-specific fulfillment
              </h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#5d5148]">
            The exact size, frame finish, and example preview selected above are
            the same values attached to the cart item and checkout order.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8f1e6]">
              <Palette className="h-5 w-5 text-[#1a1614]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                Craft focus
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#1a1614]">
                Better presentation logic
              </h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#5d5148]">
            This layout keeps the frame example visible, compresses the selectors
            into floating lists, and keeps the purchase panel in view on larger screens.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8f1e6]">
              <RotateCcw className="h-5 w-5 text-[#1a1614]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                Custom requests
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#1a1614]">
                Admin-managed options
              </h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#5d5148]">
            New frame example images and notes uploaded in admin now flow directly
            into both the product list cards and the individual product page.
          </p>
        </div>
      </div>
    </div>
  );
}
