"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppHeader from "@/components/painting-order/AppHeader";
import {
  ArrowRight,
  Brush,
  CalendarClock,
  CheckCircle2,
  Clock,
  Frame,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Palette,
  Ruler,
  Sparkles,
  Star,
  Truck,
  UploadCloud,
  X,
} from "lucide-react";

type OrderState = {
  customerName: string;
  email: string;
  phone: string;
  paintingType: string;
  size: string;
  surface: string;
  style: string;
  quantity: string;
  deadline: string;
  budget: string;
  deliveryCity: string;
  notes: string;
};

const initialForm: OrderState = {
  customerName: "",
  email: "",
  phone: "",
  paintingType: "portrait",
  size: "medium",
  surface: "canvas",
  style: "modern",
  quantity: "1",
  deadline: "",
  budget: "",
  deliveryCity: "",
  notes: "",
};

const paintingOptions = [
  { value: "portrait", label: "Portrait Commission" },
  { value: "landscape", label: "Landscape Painting" },
  { value: "interior", label: "Interior / Wall Art" },
  { value: "event", label: "Event Live Painting" },
  { value: "pet", label: "Pet Portrait" },
  { value: "custom", label: "Custom Concept" },
];

const processSteps = [
  {
    icon: <Brush className="h-4 w-4" />,
    title: "Submit Your Brief",
    description: "Tell us about your vision — subject, style, dimensions, and your ideal timeline.",
  },
  {
    icon: <Palette className="h-4 w-4" />,
    title: "Receive a Quote",
    description: "We'll reply within 24 hours with a detailed price estimate and production timeline.",
  },
  {
    icon: <CheckCircle2 className="h-4 w-4" />,
    title: "Approve & Confirm",
    description: "Review colour palette and compositional references before production begins.",
  },
  {
    icon: <Truck className="h-4 w-4" />,
    title: "Delivered to Your Door",
    description: "Track progress updates and receive your finished painting, professionally packaged.",
  },
];

const TESTIMONIALS = [
  {
    name: "Emily R.",
    quote: "The portrait of my grandmother came out absolutely stunning. Every brushstroke was perfect.",
    avatar: "E",
  },
  {
    name: "Marcus T.",
    quote: "Commissioned a landscape of our family cabin. It's now the centrepiece of our living room.",
    avatar: "M",
  },
];

type RefImage = {
  id: string;
  file: File;
  localUrl: string;
  cloudUrl: string | null;
  uploading: boolean;
  error: string | null;
};

const MAX_REFS = 5;
const MAX_SIZE_MB = 10;

export default function PaintingOrderPage() {
  const [form, setForm] = useState<OrderState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reference: string;
    estimatedRange: string;
    timeline: string;
  } | null>(null);
  const [refImages, setRefImages] = useState<RefImage[]>([]);

  const quickEstimate = useMemo(() => {
    const baseByType: Record<string, number> = {
      portrait:  180,
      landscape: 220,
      interior:  300,
      event:     450,
      pet:       160,
      custom:    260,
    };
    const sizeFactor: Record<string, number> = {
      small:  1,
      medium: 1.35,
      large:  1.8,
      mural:  3.5,
    };
    const qty = Math.max(Number(form.quantity) || 1, 1);
    const estimate =
      (baseByType[form.paintingType] || 200) *
      (sizeFactor[form.size] || 1.2) *
      qty;
    return `$${Math.round(estimate)} – $${Math.round(estimate * 1.35)}`;
  }, [form.paintingType, form.quantity, form.size]);

  const onChange = (key: keyof OrderState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRefImagesAdd = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).slice(0, MAX_REFS - refImages.length);

    const newEntries: RefImage[] = incoming.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      localUrl: URL.createObjectURL(file),
      cloudUrl: null,
      uploading: true,
      error: null,
    }));

    setRefImages((prev) => [...prev, ...newEntries]);

    newEntries.forEach((entry) => {
      if (!entry.file.type.startsWith("image/")) {
        setRefImages((prev) =>
          prev.map((r) => r.id === entry.id ? { ...r, uploading: false, error: "Not an image file." } : r)
        );
        return;
      }
      if (entry.file.size > MAX_SIZE_MB * 1024 * 1024) {
        setRefImages((prev) =>
          prev.map((r) => r.id === entry.id ? { ...r, uploading: false, error: `File exceeds ${MAX_SIZE_MB} MB.` } : r)
        );
        return;
      }

      const fd = new FormData();
      fd.append("file", entry.file);

      fetch("/api/painting-order/upload", { method: "POST", body: fd })
        .then((res) => res.json())
        .then((data) => {
          setRefImages((prev) =>
            prev.map((r) =>
              r.id === entry.id
                ? { ...r, uploading: false, cloudUrl: data.imageUrl ?? null, error: data.error ?? null }
                : r
            )
          );
        })
        .catch(() => {
          setRefImages((prev) =>
            prev.map((r) =>
              r.id === entry.id ? { ...r, uploading: false, error: "Upload failed. Please try again." } : r
            )
          );
        });
    });
  };

  const removeRefImage = (id: string) => {
    setRefImages((prev) => {
      const removed = prev.find((r) => r.id === id);
      if (removed?.localUrl) URL.revokeObjectURL(removed.localUrl);
      return prev.filter((r) => r.id !== id);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const referenceImageUrls = refImages
        .filter((r) => r.cloudUrl)
        .map((r) => r.cloudUrl as string);

      const response = await fetch("/api/painting-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, referenceImageUrls }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit your order. Please try again.");
      }

      setResult({
        reference:      data.reference,
        estimatedRange: data.estimatedRange,
        timeline:       data.timeline,
      });
      setForm(initialForm);
      setRefImages([]);
    } catch (submitError: any) {
      setError(submitError?.message || "Unable to submit your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#1a1614]">
      <AppHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#eadfcb]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-[#f0c18b]/50 blur-3xl" />
          <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-[#d9e5c3]/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:grid lg:grid-cols-[1.15fr,0.85fr] lg:gap-12 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfcfb5] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#a87945]">
              <Brush className="h-3.5 w-3.5" />
              Custom painting commissions
            </span>
            <h1 className="mt-5 font-serif text-5xl font-bold leading-tight text-[#1a1614] md:text-6xl">
              Commission Your
              <span className="block text-[#d4a574]">Dream Painting With Our Artists Team</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#6b5d54]">
              Work directly with our artists to create a one-of-a-kind oil painting made
              exactly to your vision — portrait, landscape, pet, or any subject you love.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MetricCard
                icon={<Palette className="h-5 w-5" />}
                label="Commission types"
                value="6 specialities"
              />
              <MetricCard
                icon={<Ruler className="h-5 w-5" />}
                label="Canvas sizes"
                value="Small to mural"
              />
              <MetricCard
                icon={<CalendarClock className="h-5 w-5" />}
                label="Lead time"
                value="7 – 30 days"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/painting-order/upload"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#1a1614] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#2a2624] hover:shadow-lg"
              >
                <Sparkles className="h-4 w-4 text-[#d4a574]" />
                Try AI Style Transfer
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/painting-order/gallery"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#eadfcb] bg-white px-6 py-3 text-sm font-semibold text-[#1a1614] transition hover:border-[#d4a574]"
              >
                View Customer Gallery
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mini trust row */}
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#6b5d54]">
              {["Free quote within 24 hours", "100% satisfaction guarantee", "Ships worldwide"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#d4a574]" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Estimate Card */}
          <div className="mt-10 rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_20px_70px_rgba(26,22,20,0.08)] lg:mt-0">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-[#1a1614]">Instant Estimate</h2>
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Live
              </span>
            </div>
            <p className="mt-1 text-sm text-[#6b5d54]">
              Adjust the options in the commission form to see a real-time price range.
            </p>
            <div className="mt-5 rounded-3xl bg-[#faf6ef] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7764]">
                Your estimated range
              </div>
              <div className="mt-2 font-serif text-4xl font-bold text-[#1a1614]">{quickEstimate}</div>
              <div className="mt-2 text-sm text-[#6b5d54]">
                Final price confirmed after reviewing your references and scope.
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {processSteps.map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1614] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a1614]">{step.title}</div>
                    <div className="text-sm text-[#6b5d54]">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Commission Form Section ── */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:grid lg:grid-cols-[0.72fr,1.28fr] lg:gap-10">
        {/* Left column */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
            <h3 className="font-serif text-xl font-bold text-[#1a1614]">What we need from you</h3>
            <div className="mt-5 space-y-5">
              <RequirementRow
                icon={<ImageIcon className="h-4 w-4" />}
                title="Reference photos"
                text="For portraits and pet commissions, 3–5 clear photos help us capture the perfect likeness."
              />
              <RequirementRow
                icon={<Frame className="h-4 w-4" />}
                title="Surface & framing"
                text="Canvas, fine art paper, or wood panel — all available with optional gallery framing."
              />
              <RequirementRow
                icon={<MapPin className="h-4 w-4" />}
                title="Delivery details"
                text="Your city and deadline let us plan logistics and confirm whether rush delivery is possible."
              />
              <RequirementRow
                icon={<Clock className="h-4 w-4" />}
                title="Timeline"
                text="Standard commissions take 7–21 days. Mural and event work may need longer lead time."
              />
            </div>
          </div>

          {/* Testimonials */}
          <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
            <h3 className="font-serif text-lg font-bold text-[#1a1614]">What customers say</h3>
            <div className="mt-4 space-y-4">
              {TESTIMONIALS.map(({ name, quote, avatar }) => (
                <div key={name} className="rounded-2xl border border-[#eadfcb] bg-[#fdf8f1] p-4">
                  <div className="flex gap-0.5 mb-2">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-[#d4a574] text-[#d4a574]" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-[#3e322a]">&ldquo;{quote}&rdquo;</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1614] text-xs font-bold text-white">
                      {avatar}
                    </div>
                    <span className="text-xs font-semibold text-[#1a1614]">{name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Studio upsell */}
          <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-[#1a1614] p-6 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#d4a574]">
              <Sparkles className="h-4 w-4" />
              AI Style Transfer Studio
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Want to see your photo transformed into an oil painting before you order? Upload
              it to our AI studio and preview Monet, Van Gogh, Cézanne, and Ukiyo-e styles
              in seconds — then order the canvas print directly.
            </p>
            <Link
              href="/painting-order/upload"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#d4a574] px-5 py-3 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f4d090]"
            >
              Open AI Studio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Commission Form */}
        <div className="mt-8 rounded-[2rem] border-2 border-[#eadfcb] bg-white p-8 shadow-[0_18px_60px_rgba(26,22,20,0.07)] lg:mt-0">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#1a1614]">Request a Commission</h2>
            <p className="mt-2 text-sm text-[#6b5d54]">
              Fill in your project details and we&apos;ll reply with a confirmed quote and timeline
              within 24 hours — no obligation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
            <Field
              label="Your name *"
              value={form.customerName}
              onChange={(value) => onChange("customerName", value)}
              placeholder="Full name"
            />
            <Field
              label="Email address *"
              type="email"
              value={form.email}
              onChange={(value) => onChange("email", value)}
              placeholder="you@example.com"
            />
            <Field
              label="Phone (optional)"
              value={form.phone}
              onChange={(value) => onChange("phone", value)}
              placeholder="+1 (555) 000-0000"
            />
            <SelectField
              label="Commission type *"
              value={form.paintingType}
              onChange={(value) => onChange("paintingType", value)}
              options={paintingOptions}
            />
            <SelectField
              label="Canvas size *"
              value={form.size}
              onChange={(value) => onChange("size", value)}
              options={[
                { value: "small",  label: "Small (up to 12×16 in)" },
                { value: "medium", label: "Medium (up to 18×24 in)" },
                { value: "large",  label: "Large (up to 24×36 in)" },
                { value: "mural",  label: "Mural / oversized" },
              ]}
            />
            <SelectField
              label="Surface & medium *"
              value={form.surface}
              onChange={(value) => onChange("surface", value)}
              options={[
                { value: "canvas",  label: "Stretched canvas" },
                { value: "paper",   label: "Fine art paper" },
                { value: "board",   label: "Wood / panel board" },
                { value: "digital", label: "Digital file only" },
              ]}
            />
            <SelectField
              label="Painting style *"
              value={form.style}
              onChange={(value) => onChange("style", value)}
              options={[
                { value: "modern",        label: "Contemporary / Modern" },
                { value: "realist",       label: "Photorealist" },
                { value: "abstract",      label: "Abstract" },
                { value: "impressionist", label: "Impressionist" },
                { value: "minimal",       label: "Minimalist" },
              ]}
            />
            <Field
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(value) => onChange("quantity", value)}
              placeholder="1"
            />
            <Field
              label="Preferred delivery date"
              type="date"
              value={form.deadline}
              onChange={(value) => onChange("deadline", value)}
            />
            <Field
              label="Budget range"
              value={form.budget}
              onChange={(value) => onChange("budget", value)}
              placeholder="e.g. $400 – $800"
            />
            <div className="md:col-span-2">
              <Field
                label="Delivery city / region"
                value={form.deliveryCity}
                onChange={(value) => onChange("deliveryCity", value)}
                placeholder="City, State / Country"
              />
            </div>
            <div className="md:col-span-2">
              <TextAreaField
                label="Project description"
                value={form.notes}
                onChange={(value) => onChange("notes", value)}
                placeholder="Describe your subject, mood, colours, references, special requests, or anything that will help our artists bring your vision to life."
              />
            </div>

            {/* ── Reference image upload ── */}
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-[#1a1614]">
                    Reference photos <span className="font-normal text-[#8c7764]">(optional)</span>
                  </span>
                  <p className="mt-0.5 text-xs text-[#8c7764]">
                    Upload up to {MAX_REFS} photos — portraits, pets, scenes, or colour inspiration.
                    Our artist will use these as the basis for your painting.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#8c7764]">
                  {refImages.length}/{MAX_REFS}
                </span>
              </div>

              {/* Drop zone */}
              {refImages.length < MAX_REFS && (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[#ddcfbb] bg-[#faf6ef] py-8 text-center transition hover:border-[#d4a574] hover:bg-[#fff8ef]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a1614]">
                    <UploadCloud className="h-6 w-6 text-[#d4a574]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1614]">Click to upload reference photos</p>
                    <p className="mt-0.5 text-xs text-[#8c7764]">
                      JPG, PNG, WEBP · Up to {MAX_SIZE_MB} MB each · Max {MAX_REFS} photos
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleRefImagesAdd(e.target.files)}
                  />
                </label>
              )}

              {/* Preview grid */}
              {refImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {refImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef]"
                    >
                      {/* Preview image */}
                      <img
                        src={img.localUrl}
                        alt="Reference"
                        className="h-full w-full object-cover"
                      />

                      {/* Uploading overlay */}
                      {img.uploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 backdrop-blur-[2px]">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                          <span className="text-[10px] font-semibold text-white">Uploading…</span>
                        </div>
                      )}

                      {/* Error overlay */}
                      {img.error && !img.uploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-900/70 p-2 text-center">
                          <span className="text-[10px] font-semibold leading-tight text-white">
                            {img.error}
                          </span>
                        </div>
                      )}

                      {/* Success tick */}
                      {img.cloudUrl && !img.uploading && (
                        <div className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shadow">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeRefImage(img.id)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                        title="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add more slot */}
                  {refImages.length < MAX_REFS && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[#ddcfbb] bg-[#faf6ef] text-[#8c7764] transition hover:border-[#d4a574] hover:text-[#d4a574]">
                      <UploadCloud className="h-5 w-5" />
                      <span className="text-[10px] font-semibold">Add more</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleRefImagesAdd(e.target.files)}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Upload tip */}
              <p className="mt-3 flex items-start gap-1.5 text-xs text-[#8c7764]">
                <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#d4a574]" />
                Clear, well-lit photos produce the best results. For portraits, include at least one
                front-facing photo with good lighting.
              </p>
            </div>

            {/* Summary + Submit */}
            <div className="md:col-span-2 flex flex-col gap-4 rounded-3xl border border-[#eadfcb] bg-[#faf6ef] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#8c7764]">
                    Your estimated range
                  </div>
                  <div className="mt-1 font-serif text-2xl font-bold text-[#1a1614]">{quickEstimate}</div>
                  <div className="mt-1 text-xs text-[#8c7764]">
                    Final price confirmed after reviewing your brief
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || refImages.some((r) => r.uploading)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a1614] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#2a2624] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending your brief…</>
                  ) : refImages.some((r) => r.uploading) ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading photos…</>
                  ) : (
                    <>Request Free Quote <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {result && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-green-900">
                        Commission request received!
                      </div>
                      <div className="mt-1 text-sm text-green-700">
                        Reference: <span className="font-mono font-semibold">{result.reference}</span>
                      </div>
                      <div className="mt-1 text-sm text-green-700">
                        Estimated range: {result.estimatedRange}
                      </div>
                      <div className="mt-1 text-sm text-green-700">
                        Estimated timeline: {result.timeline}
                      </div>
                      <div className="mt-2 text-sm text-green-700">
                        We&apos;ll email your quote within 24 hours. Check your inbox!
                      </div>
                      <Link
                        href={`/commission/${result.reference}`}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-800"
                      >
                        Track Your Painting Progress <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border-2 border-[#eadfcb] bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a1614] text-[#d4a574]">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8c7764]">{label}</div>
          <div className="font-semibold text-[#1a1614]">{value}</div>
        </div>
      </div>
    </div>
  );
}

function RequirementRow({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#faf6ef] text-[#d4a574]">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-[#1a1614]">{title}</div>
        <div className="text-sm leading-relaxed text-[#6b5d54]">{text}</div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[#1a1614]">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#c89860] focus:ring-2 focus:ring-[#d4a574]/20"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[#1a1614]">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#c89860] focus:ring-2 focus:ring-[#d4a574]/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[#1a1614]">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#c89860] focus:ring-2 focus:ring-[#d4a574]/20"
      />
    </label>
  );
}
