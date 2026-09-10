"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, ChevronLeft, ChevronRight,
  Loader2, Package, X, ZoomIn,
} from "lucide-react";
import UserMenu from "@/components/UserMenu";
import AgreementCard from "@/components/AgreementCard";

type Product = {
  id: string; name: string; slug: string;
  description: string | null; shortDescription: string | null;
  imageUrl: string | null; galleryImages: string[];
  basePriceCents: number; commissionType: string;
  commissionRate: number; commissionFixed: number;
  sampleStock: number; taskRequirements: string | null;
  category: { name: string };
};

const money = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const pct = (r: number) => `${(r * 100).toFixed(0)}%`;

// ── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  startIdx,
  onClose,
}: {
  images: string[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  // keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <p className="absolute top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-white/50">
          {idx + 1} / {images.length}
        </p>
      )}

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="relative mx-16 max-h-[88vh] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx]}
          alt={`Photo ${idx + 1}`}
          className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Dot strip */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/35"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function GalleryProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [product, setProduct]   = useState<Product | null>(null);
  const [loading, setLoading]   = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied]   = useState(false);
  const [error, setError]       = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ email: "", phone: "", pitch: "", plannedContent: "" });
  const [platforms, setPlatforms]   = useState<string[]>([]);
  const [handles, setHandles]       = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Image viewer state
  const [mainImg, setMainImg]           = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx]   = useState(0);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        const p: Product = data.product ?? data;
        setProduct(p);
        setMainImg(p.imageUrl);
      })
      .catch(() => setError("Product not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  const apply = async () => {
    if (!product) return;
    if (!agreedToTerms) {
      setError("Please read and agree to the Creator Partnership Agreement before applying.");
      return;
    }
    setApplying(true);
    try {
      const res = await fetch("/api/influencer/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          pitch: form.pitch,
          plannedContent: form.plannedContent,
          contactInfo: {
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            platforms,
            handles: Object.fromEntries(
              Object.entries(handles).filter(([k, v]) => platforms.includes(k) && v.trim())
            ),
            agreedToTerms: true,
            agreedAt: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (res.status === 401) { router.push("/auth/signin?callbackUrl=/gallery/" + slug); return; }
      if (!res.ok) throw new Error(data.error || "Failed to apply.");
      setApplied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[#6b5d54]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading...
      </div>
    );
  }
  if (!product) {
    return <div className="min-h-screen p-10 text-center text-red-600">{error || "Product not found."}</div>;
  }

  const allImages = [product.imageUrl, ...product.galleryImages].filter(Boolean) as string[];
  const commission = product.commissionType === "FIXED"
    ? money(product.commissionFixed)
    : `${pct(product.commissionRate)} of sale`;
  const noSamples = product.sampleStock === 0;

  const openLightbox = (img: string) => {
    const idx = allImages.indexOf(img);
    setLightboxIdx(Math.max(0, idx));
    setLightboxOpen(true);
  };

  return (
    <>
      {lightboxOpen && (
        <Lightbox images={allImages} startIdx={lightboxIdx} onClose={() => setLightboxOpen(false)} />
      )}

      <div className="min-h-screen bg-[#faf6ef]">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[#eadfcb] bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-lg font-bold tracking-tight text-[#1a1614]">AdStudio</Link>
              <Link href="/gallery" className="hidden items-center gap-1.5 text-sm font-medium text-[#6b5d54] hover:text-[#1a1614] sm:inline-flex">
                <ArrowLeft className="h-4 w-4" />Gallery
              </Link>
            </div>
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px]">

            {/* ── Image viewer ── */}
            <div className="space-y-3">

              {/* Main image */}
              <div className="group relative w-full overflow-hidden rounded-[1.75rem] border border-[#eadfcb] bg-white">
                {mainImg ? (
                  <button
                    type="button"
                    onClick={() => openLightbox(mainImg)}
                    className="relative block w-full cursor-zoom-in"
                    aria-label="Open full-size image"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mainImg}
                      alt={product.name}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    {/* Zoom hint */}
                    <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <ZoomIn className="h-3.5 w-3.5" />Click to expand
                    </span>
                  </button>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-[#faf6ef]">
                    <Package className="h-12 w-12 text-[#d9ccb9]" />
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {allImages.slice(0, 5).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMainImg(img)}
                      className={`group relative aspect-square overflow-hidden rounded-2xl border-2 bg-white transition ${
                        mainImg === img
                          ? "border-[#d4a574] shadow-md"
                          : "border-[#eadfcb] hover:border-[#d4a574]/60"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${product.name} — view ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                      />
                      {/* overlay on selected */}
                      {mainImg === img && (
                        <span className="absolute inset-0 rounded-2xl ring-2 ring-[#d4a574] ring-inset" />
                      )}
                    </button>
                  ))}
                  {/* "View all" tile if there are more */}
                  {allImages.length > 5 && (
                    <button
                      type="button"
                      onClick={() => openLightbox(allImages[5])}
                      className="relative aspect-square overflow-hidden rounded-2xl border-2 border-[#eadfcb] bg-[#1a1614] text-white transition hover:opacity-90"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={allImages[5]} alt="" className="h-full w-full object-cover opacity-30" />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                        +{allImages.length - 5} more
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Click-to-zoom hint for single image */}
              {allImages.length === 1 && mainImg && (
                <p className="text-center text-xs text-[#a89a8e]">Click the image to view full size</p>
              )}
            </div>

            {/* ── Product info + apply ── */}
            <div className="space-y-5">
              {/* Category + title */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8c7764]">{product.category.name}</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight text-[#1a1614]">{product.name}</h1>
                {product.shortDescription && (
                  <p className="mt-3 leading-relaxed text-[#6b5d54]">{product.shortDescription}</p>
                )}
              </div>

              {/* Commission card */}
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Your commission</p>
                <p className="mt-2 text-4xl font-bold text-emerald-800">{commission}</p>
                <p className="mt-1 text-sm text-emerald-600">Paid after your video is approved by the brand</p>
              </div>

              {/* Task requirements */}
              {product.taskRequirements && (
                <div className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8c7764]">What you&apos;ll need to create</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[#1a1614]">{product.taskRequirements}</p>
                </div>
              )}

              {/* Sample stock */}
              <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                noSamples
                  ? "border-red-200 bg-red-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}>
                <Package className={`h-5 w-5 shrink-0 ${noSamples ? "text-red-400" : "text-emerald-600"}`} />
                <span className={`text-sm font-semibold ${noSamples ? "text-red-700" : "text-emerald-800"}`}>
                  {noSamples
                    ? "No samples currently available"
                    : `${product.sampleStock} free sample${product.sampleStock !== 1 ? "s" : ""} available`}
                </span>
              </div>

              {/* Apply */}
              {applied ? (
                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 shrink-0 text-emerald-600" />
                    <p className="font-bold text-emerald-800">Application submitted!</p>
                  </div>
                  <p className="mt-2 text-sm text-emerald-700">
                    The brand will review your pitch and get back to you.{" "}
                    <Link href="/influencer/dashboard" className="font-semibold underline">Check your dashboard</Link> for updates.
                  </p>
                </div>
              ) : showForm ? (
                <div className="space-y-5 rounded-[1.5rem] border border-[#eadfcb] bg-white p-5">

                  {/* Sample availability banner */}
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <Package className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">
                        {product.sampleStock} free sample{product.sampleStock !== 1 ? "s" : ""} available
                      </p>
                      <p className="text-xs text-emerald-700">Approved influencers receive a free product sample to feature in their content</p>
                    </div>
                  </div>

                  <p className="font-bold text-[#1a1614]">Apply to promote this product</p>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
                  )}

                  {/* Contact info */}
                  <div className="space-y-3 rounded-xl border border-[#eadfcb] bg-[#faf6ef] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c7764]">Your contact info</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#6b5d54]">Email address</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/15"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#6b5d54]">Phone number</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="+1 (555) 000-0000"
                          className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/15"
                        />
                      </div>
                    </div>

                    {/* Preferred platforms */}
                    <div>
                      <p className="mb-2 text-[11px] font-semibold text-[#6b5d54]">Preferred platforms</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["tiktok", "instagram", "youtube", "twitter"] as const).map((p) => {
                          const labels: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", twitter: "Twitter" };
                          const isChecked = platforms.includes(p);
                          return (
                            <label key={p} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition select-none ${
                              isChecked ? "border-[#d4a574] bg-[#d4a574]/10" : "border-[#eadfcb] bg-white hover:border-[#d4a574]/50"
                            }`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPlatforms((prev) => [...prev, p]);
                                  } else {
                                    setPlatforms((prev) => prev.filter((x) => x !== p));
                                    setHandles((prev) => { const n = { ...prev }; delete n[p]; return n; });
                                  }
                                }}
                                className="h-3.5 w-3.5 accent-[#d4a574]"
                              />
                              <span className={`text-sm font-semibold ${isChecked ? "text-[#1a1614]" : "text-[#6b5d54]"}`}>{labels[p]}</span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Handle inputs for selected platforms */}
                      {platforms.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {platforms.map((p) => {
                            const labels: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", twitter: "Twitter" };
                            return (
                              <div key={p} className="flex items-center gap-2">
                                <span className="w-20 shrink-0 text-[11px] font-semibold text-[#8c7764]">{labels[p]}</span>
                                <input
                                  type="text"
                                  value={handles[p] || ""}
                                  onChange={(e) => setHandles((prev) => ({ ...prev, [p]: e.target.value }))}
                                  placeholder={`@your${p}handle`}
                                  className="flex-1 rounded-xl border border-[#eadfcb] bg-white px-3 py-2 text-sm outline-none focus:border-[#d4a574]"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pitch section */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c7764]">Tell the brand about yourself</p>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8c7764]">
                        Why do you want to promote this?
                      </label>
                      <textarea
                        rows={3}
                        value={form.pitch}
                        onChange={(e) => setForm((f) => ({ ...f, pitch: e.target.value }))}
                        placeholder="Tell the brand why you're a great fit and how you'd present the product…"
                        className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm outline-none transition focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/15"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8c7764]">
                        What content do you plan to create?
                      </label>
                      <textarea
                        rows={3}
                        value={form.plannedContent}
                        onChange={(e) => setForm((f) => ({ ...f, plannedContent: e.target.value }))}
                        placeholder="Describe your video concept, platform (TikTok / Reels / YouTube), expected reach…"
                        className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm outline-none transition focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/15"
                      />
                    </div>
                  </div>

                  {/* Creator Partnership Agreement */}
                  <AgreementCard
                    product={product}
                    showCheckbox
                    checked={agreedToTerms}
                    onCheck={setAgreedToTerms}
                  />

                  <div className="flex gap-3">
                    <button
                      disabled={applying || !agreedToTerms}
                      onClick={() => void apply()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a1614] py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      {applying ? "Submitting…" : "Submit application"}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="rounded-xl border border-[#eadfcb] px-5 py-3 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  disabled={noSamples}
                  onClick={() => setShowForm(true)}
                  className="w-full rounded-xl bg-[#1a1614] py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#2a2624] hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {noSamples ? "No samples available" : "Apply to promote this product"}
                </button>
              )}

              {/* Full description */}
              {product.description && (
                <div className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8c7764]">About this product</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[#6b5d54]">{product.description}</p>
                </div>
              )}

              {/* Partnership terms preview (collapsed) */}
              <AgreementCard product={product} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
