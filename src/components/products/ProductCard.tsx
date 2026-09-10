"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  Eye,
  Frame,
  Heart,
  Maximize,
  Minimize,
  MonitorUp,
  ShoppingCart,
  Square,
  Star,
  StretchHorizontal,
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
    stockQuantity?: number;
  }>;
}

interface ProductCardProps {
  product: Product;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const sizeMeta: Record<
  string,
  { icon: typeof Square; note: string }
> = {
  "8x10": { icon: Minimize, note: "Compact accent format" },
  "12x16": { icon: Square, note: "Balanced studio size" },
  "18x24": { icon: StretchHorizontal, note: "Gallery-ready scale" },
  "24x36": { icon: Maximize, note: "Statement wall piece" },
};

const frameMeta: Record<
  string,
  { icon: typeof Frame; note: string }
> = {
  none: { icon: MonitorUp, note: "Canvas-only finish" },
  black_wood: { icon: Frame, note: "Sharp modern border" },
  walnut: { icon: Frame, note: "Warm natural wood tone" },
  gold_gallery: { icon: Frame, note: "Classic gallery trim" },
};

export default function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const sizeMenuRef = useRef<HTMLDivElement | null>(null);
  const frameMenuRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedFrame, setSelectedFrame] = useState("");
  const [showSizeOptions, setShowSizeOptions] = useState(false);
  const [showFrameOptions, setShowFrameOptions] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

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

    return [...new Set(
      variants
        .filter((variant) => variant.canvasSize === size)
        .map((variant) => variant.frameStyle)
    )];
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

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (variant) =>
          variant.canvasSize === selectedSize && variant.frameStyle === selectedFrame
      ) || variants[0],
    [selectedFrame, selectedSize, variants]
  );

  const totalPrice = product.basePriceCents + (selectedVariant?.priceCents || 0);
  const lowestVariantSurcharge = variants.reduce(
    (lowest, variant) => Math.min(lowest, variant.priceCents),
    Number.POSITIVE_INFINITY
  );
  const fromPrice = product.basePriceCents + (Number.isFinite(lowestVariantSurcharge) ? lowestVariantSurcharge : 0);

  const addToCart = async () => {
    if (!session?.user) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`;
      return;
    }

    if (!selectedVariant) {
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
          quantity: 1,
        }),
      });

      if (response.ok) {
        setAddedToCart(true);
        window.setTimeout(() => setAddedToCart(false), 2000);
      } else {
        console.error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div
      className="group relative overflow-visible rounded-[1.75rem] border-2 border-[#eadfcb] bg-white shadow-[0_10px_30px_rgba(26,22,20,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d4a574] hover:shadow-[0_20px_50px_rgba(26,22,20,0.12)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {product.isFeatured ? (
        <div className="absolute left-4 top-4 z-10 rounded-full bg-[#d4a574] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
          Featured
        </div>
      ) : null}

      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-t-[1.6rem]">
        <Image
          src={getSafeImageSrc(
            product.imageUrl ||
              "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400"
          )}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 320px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {isHovered ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-black/35 backdrop-blur-[1px]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#1a1614] shadow-lg transition-colors hover:bg-[#f8f1e6]">
              <Eye className="h-5 w-5" />
            </span>
            <button
              type="button"
              onClick={(event) => event.preventDefault()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#1a1614] shadow-lg transition-colors hover:bg-[#f8f1e6]"
            >
              <Heart className="h-5 w-5" />
            </button>
          </div>
        ) : null}
      </Link>

      <div className="space-y-2.5 p-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a87945]">
              {product.category.name}
            </span>
            {/* Static star rating */}
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-3 w-3 fill-[#d4a574] text-[#d4a574]" />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-[#8c7764]">4.9</span>
            </div>
          </div>
          <h3 className="font-serif text-base font-bold text-[#1a1614]">
            <Link href={`/products/${product.slug}`} className="transition-colors hover:text-[#d4a574]">
              {product.name}
            </Link>
          </h3>
          {product.shortDescription ? (
            <p className="mt-1 line-clamp-1 text-[11px] leading-5 text-[#6b5d54]">{product.shortDescription}</p>
          ) : null}
        </div>

        {variants.length ? (
          <div className="rounded-[1.15rem] border border-[#eadfcb] bg-[#faf6ef] p-2.5">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white px-2.5 py-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c7764]">
                  Print Builder
                </p>
                <p className="mt-0.5 truncate text-[10px] text-[#6b5d54]">
                  {variants.length} size/frame options
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8c7764]">From</p>
                <p className="text-xs font-bold text-[#1a1614]">{formatPrice(fromPrice)}</p>
              </div>
            </div>

            <div className="mt-2.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c7764]">
                Canvas size
              </p>
              <div ref={sizeMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowSizeOptions((current) => !current);
                    setShowFrameOptions(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-[#d9ccb9] bg-white px-2.5 py-2 text-left transition hover:border-[#d4a574] hover:bg-[#fff8ef]"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#1a1614]">
                      {getCanvasSizeLabel(selectedSize)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-[#6b5d54]">
                      Select size
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#6b5d54] transition-transform ${
                      showSizeOptions ? "rotate-180" : ""
                    }`}
                  />
                </button>
              {showSizeOptions ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 space-y-2 rounded-[1.4rem] border border-[#eadfcb] bg-white p-2 shadow-[0_16px_40px_rgba(26,22,20,0.16)]">
                  {sizeOptions.map((size) => {
                    const isSelected = size === selectedSize;
                    const meta = sizeMeta[size] || { icon: Square, note: "Custom canvas format" };
                    const Icon = meta.icon;
                    const variantCount = variants.filter((variant) => variant.canvasSize === size).length;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setSelectedSize(size);
                          setShowSizeOptions(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition ${
                          isSelected
                            ? "border-[#1a1614] bg-[#1a1614] text-white"
                            : "border-[#d9ccb9] bg-white text-[#1a1614] hover:border-[#d4a574] hover:bg-[#fff8ef]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                            isSelected ? "bg-white/15" : "bg-[#f8f1e6]"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold">
                              {getCanvasSizeLabel(size)}
                            </div>
                            <div className={`text-[11px] ${isSelected ? "text-white/75" : "text-[#6b5d54]"}`}>
                              {meta.note}
                            </div>
                          </div>
                        </div>
                        <div className={`text-right text-[11px] ${isSelected ? "text-white/80" : "text-[#8c7764]"}`}>
                          {variantCount} options
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              </div>
            </div>

            <div className="mt-2.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c7764]">
                Frame finish
              </p>
              <div ref={frameMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowFrameOptions((current) => !current);
                    setShowSizeOptions(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-[#d9ccb9] bg-white px-2.5 py-2 text-left transition hover:border-[#d4a574] hover:bg-[#fff8ef]"
                >
                  <div className="flex items-center gap-3">
                    {selectedVariant?.previewImageUrl ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-[#eadfcb] bg-white">
                        <Image
                          src={getSafeImageSrc(selectedVariant.previewImageUrl)}
                          alt={`${getFrameStyleLabel(selectedFrame)} example`}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8f1e6]">
                        <Frame className="h-4 w-4 text-[#1a1614]" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-[#1a1614]">
                        {getFrameStyleLabel(selectedFrame)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-[#6b5d54]">
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
                <div className="absolute left-0 right-0 top-full z-20 mt-2 space-y-2 rounded-[1.4rem] border border-[#eadfcb] bg-white p-2 shadow-[0_16px_40px_rgba(26,22,20,0.16)]">
                  {availableFrames.map((frame) => {
                    const isSelected = frame === selectedFrame;
                    const matchedVariant = variants.find(
                      (variant) =>
                        variant.canvasSize === selectedSize && variant.frameStyle === frame
                    );
                    const surcharge = matchedVariant?.priceCents || 0;
                    const meta = frameMeta[frame] || { icon: Frame, note: "Custom framing" };
                    const Icon = meta.icon;

                    return (
                      <button
                        key={frame}
                        type="button"
                        onClick={() => {
                          setSelectedFrame(frame);
                          setShowFrameOptions(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition ${
                          isSelected
                            ? "border-[#1a1614] bg-white shadow-[0_8px_20px_rgba(26,22,20,0.08)]"
                            : "border-[#d9ccb9] bg-white/80 hover:border-[#d4a574]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {matchedVariant?.previewImageUrl ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-[#eadfcb] bg-white">
                              <Image
                                src={getSafeImageSrc(matchedVariant.previewImageUrl)}
                                alt={`${getFrameStyleLabel(frame)} example`}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              isSelected ? "bg-[#f8f1e6]" : "bg-[#faf6ef]"
                            }`}>
                              <Icon className="h-4 w-4 text-[#1a1614]" />
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-semibold text-[#1a1614]">
                              {getFrameStyleLabel(frame)}
                            </div>
                            <div className="mt-1 text-[11px] text-[#6b5d54]">
                              {matchedVariant?.details || meta.note}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-[#6b5d54]">
                          <div>{surcharge > 0 ? `+${formatPrice(surcharge)}` : "Included"}</div>
                          <div className="mt-1 text-[#8c7764]">
                            {isSelected ? "Selected" : "Available"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              </div>
            </div>

            {selectedVariant ? (
              <div className="mt-3 rounded-2xl bg-white px-3 py-2.5 text-xs text-[#4e433c]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1a1614]">
                      {getCanvasSizeLabel(selectedVariant.canvasSize)} / {getFrameStyleLabel(selectedVariant.frameStyle)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#6b5d54]">
                      Base {formatPrice(product.basePriceCents)}
                      {selectedVariant.priceCents > 0 ? ` + variant ${formatPrice(selectedVariant.priceCents)}` : " with no added surcharge"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#8c7764]">Total</p>
                    <p className="text-sm font-bold text-[#1a1614]">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#5d5148]">
                  {selectedVariant.details ||
                    frameMeta[selectedVariant.frameStyle]?.note ||
                    "Curated frame finish for this print option."}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c7764]">
              Ready to order
            </p>
            <p className="mt-1 text-[11px] text-[#6b5d54]">Selected frame and size saved on add to cart</p>
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={isAddingToCart || !selectedVariant}
            className="flex items-center gap-2 rounded-xl bg-[#1a1614] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2a2624] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addedToCart ? (
              <>
                <Check className="h-4 w-4" />
                Added!
              </>
            ) : isAddingToCart ? (
              "Adding..."
            ) : !session?.user ? (
              <>
                <ShoppingCart className="h-4 w-4" />
                Sign In to Buy
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
