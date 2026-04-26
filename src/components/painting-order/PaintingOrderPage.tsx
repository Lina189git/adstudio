"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";
import {
  ArrowRight,
  Brush,
  CalendarClock,
  CheckCircle2,
  Frame,
  Image as ImageIcon,
  MapPin,
  Palette,
  Ruler,
  Sparkles,
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
    title: "Brief",
    description: "Share style, dimensions, deadline, and the mood you want.",
  },
  {
    title: "Quote",
    description: "Receive a structured estimate with timeline and production scope.",
  },
  {
    title: "Approval",
    description: "Approve palette, references, and draft direction before production.",
  },
  {
    title: "Delivery",
    description: "Track progress and receive the completed painting with shipping details.",
  },
];

export default function PaintingOrderPage() {
  const [form, setForm] = useState<OrderState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reference: string;
    estimatedRange: string;
    timeline: string;
  } | null>(null);

  const quickEstimate = useMemo(() => {
    const baseByType: Record<string, number> = {
      portrait: 180,
      landscape: 220,
      interior: 300,
      event: 450,
      pet: 160,
      custom: 260,
    };
    const sizeFactor: Record<string, number> = {
      small: 1,
      medium: 1.35,
      large: 1.8,
      mural: 3.5,
    };
    const qty = Math.max(Number(form.quantity) || 1, 1);
    const estimate =
      (baseByType[form.paintingType] || 200) *
      (sizeFactor[form.size] || 1.2) *
      qty;
    return `$${Math.round(estimate)} - $${Math.round(estimate * 1.35)}`;
  }, [form.paintingType, form.quantity, form.size]);

  const onChange = (
    key: keyof OrderState,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/painting-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit painting order.");
      }

      setResult({
        reference: data.reference,
        estimatedRange: data.estimatedRange,
        timeline: data.timeline,
      });
      setForm(initialForm);
    } catch (submitError: any) {
      setError(submitError?.message || "Failed to submit painting order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#1a1614]">
      <AppHeader />

      <section className="relative overflow-hidden border-b border-[#eadfcb]">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-[#f0c18b] blur-3xl" />
          <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-[#d9e5c3] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:grid lg:grid-cols-[1.15fr,0.85fr] lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfcfb5] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
              <Brush className="h-4 w-4" />
              Painting order studio
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight">
              Launch custom oil-paint commissions with a clear production plan,
              live photo conversion, and checkout workflow
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6b5d54]">
              This page now works as the commercial front door: capture custom
              briefs, route buyers into the upload studio, convert photos into
              proof images, and take payment for digital or framed canvas orders.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MetricCard
                icon={<Palette className="h-5 w-5" />}
                label="Styles"
                value="6 order types"
              />
              <MetricCard
                icon={<Ruler className="h-5 w-5" />}
                label="Sizing"
                value="Small to mural"
              />
              <MetricCard
                icon={<CalendarClock className="h-5 w-5" />}
                label="Lead time"
                value="7 to 30 days"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/painting-order/upload"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white"
              >
                Upload source photo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/painting-order/gallery"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#eadfcb] bg-white px-5 py-3 text-sm font-semibold text-[#1a1614]"
              >
                View public gallery
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="inline-flex items-center rounded-2xl border-2 border-[#eadfcb] bg-white px-5 py-3 text-sm font-semibold text-[#6b5d54]">
                Render AI conversion + Cloudinary + Stripe enabled
              </span>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_20px_70px_rgba(26,22,20,0.08)] lg:mt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quick estimate</h2>
              <span className="rounded-full bg-[#1a1614] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                Live
              </span>
            </div>
            <div className="mt-6 rounded-3xl bg-[#faf6ef] p-6">
              <div className="text-sm text-[#6b5d54]">Current range</div>
              <div className="mt-2 text-4xl font-bold">{quickEstimate}</div>
              <div className="mt-3 text-sm text-[#6b5d54]">
                Final pricing depends on references, revisions, shipping, and
                framing.
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {processSteps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1614] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{step.title}</div>
                    <div className="text-sm text-[#6b5d54]">
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-[#eadfcb] bg-[#faf6ef] p-5">
              <div className="font-semibold">Start from a customer photo</div>
              <div className="mt-2 text-sm text-[#6b5d54]">
                Need photo-to-oil-paint conversion, live style selection,
                production proofs, frame choices, gallery sharing, and payment?
                Use the dedicated upload studio.
              </div>
              <Link
                href="/painting-order/upload"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#c89860]"
              >
                Upload source photo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:grid lg:grid-cols-[0.72fr,1.28fr] lg:gap-10">
        <div className="space-y-6">
          <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
            <h3 className="text-xl font-bold">Order requirements</h3>
            <div className="mt-5 space-y-4">
              <RequirementRow
                icon={<ImageIcon className="h-4 w-4" />}
                title="Reference material"
                text="Portraits and custom concepts benefit from 3 to 5 images."
              />
              <RequirementRow
                icon={<Frame className="h-4 w-4" />}
                title="Surface and finish"
                text="Canvas, paper, board, or framed presentation can be scoped up front."
              />
              <RequirementRow
                icon={<MapPin className="h-4 w-4" />}
                title="Delivery planning"
                text="City and deadline help estimate logistics and rush handling."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-[#1a1614] p-6 text-white">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-4 w-4" />
              Suggested flow
            </div>
            <p className="mt-4 text-sm leading-7 text-white/80">
              Use this page for direct commission intake. The upload studio now
              handles converted artwork, order persistence, public gallery
              sharing, and admin review after checkout.
            </p>
            <Link
              href="/painting-order/upload"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1a1614]"
            >
              Open the upload studio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_18px_60px_rgba(26,22,20,0.07)] lg:mt-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">Submit a painting order</h2>
              <p className="mt-2 text-sm text-[#6b5d54]">
                Fill out the production brief. The route returns a structured
                intake reference and estimated delivery timeline.
              </p>
            </div>
            <span className="rounded-full border border-[#eadfcb] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#6b5d54]">
              /api/painting-order
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
            <Field
              label="Customer name"
              value={form.customerName}
              onChange={(value) => onChange("customerName", value)}
              placeholder="Name"
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => onChange("email", value)}
              placeholder="you@example.com"
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(value) => onChange("phone", value)}
              placeholder="Optional"
            />
            <SelectField
              label="Painting type"
              value={form.paintingType}
              onChange={(value) => onChange("paintingType", value)}
              options={paintingOptions}
            />
            <SelectField
              label="Size"
              value={form.size}
              onChange={(value) => onChange("size", value)}
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
                { value: "mural", label: "Mural / oversized" },
              ]}
            />
            <SelectField
              label="Surface"
              value={form.surface}
              onChange={(value) => onChange("surface", value)}
              options={[
                { value: "canvas", label: "Canvas" },
                { value: "paper", label: "Fine art paper" },
                { value: "board", label: "Wood / panel board" },
                { value: "digital", label: "Digital paint source" },
              ]}
            />
            <SelectField
              label="Style"
              value={form.style}
              onChange={(value) => onChange("style", value)}
              options={[
                { value: "modern", label: "Modern" },
                { value: "realist", label: "Realist" },
                { value: "abstract", label: "Abstract" },
                { value: "impressionist", label: "Impressionist" },
                { value: "minimal", label: "Minimal" },
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
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(value) => onChange("deadline", value)}
            />
            <Field
              label="Budget"
              value={form.budget}
              onChange={(value) => onChange("budget", value)}
              placeholder="$500 - $900"
            />
            <div className="md:col-span-2">
              <Field
                label="Delivery city"
                value={form.deliveryCity}
                onChange={(value) => onChange("deliveryCity", value)}
                placeholder="City / region"
              />
            </div>
            <div className="md:col-span-2">
              <TextAreaField
                label="Project notes"
                value={form.notes}
                onChange={(value) => onChange("notes", value)}
                placeholder="Describe palette, references, framing, room context, event details, or any production constraints."
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-4 rounded-3xl border border-[#eadfcb] bg-[#faf6ef] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
                    Estimated range
                  </div>
                  <div className="mt-2 text-2xl font-bold">{quickEstimate}</div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit painting order"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              {result && (
                <div className="rounded-2xl border border-[#d9d3c8] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 text-[#2d8a55]" />
                    <div>
                      <div className="font-semibold">
                        Painting order submitted
                      </div>
                      <div className="mt-1 text-sm text-[#6b5d54]">
                        Reference: <span className="font-semibold text-[#1a1614]">{result.reference}</span>
                      </div>
                      <div className="mt-1 text-sm text-[#6b5d54]">
                        Estimated range: {result.estimatedRange}
                      </div>
                      <div className="mt-1 text-sm text-[#6b5d54]">
                        Estimated timeline: {result.timeline}
                      </div>
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

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-[#eadfcb] bg-white px-5 py-4">
      <div className="flex items-center gap-3 text-[#1a1614]">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a1614] text-white">
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#6b5d54]">
            {label}
          </div>
          <div className="font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function RequirementRow({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#faf6ef] text-[#1a1614]">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm leading-6 text-[#6b5d54]">{text}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[#1a1614]">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#c89860]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[#1a1614]">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#c89860]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[#1a1614]">{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#c89860]"
      />
    </label>
  );
}
