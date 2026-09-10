"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import CartDropdown from "@/components/CartDropdown";
import UserMenu from "@/components/UserMenu";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  Frame as FrameIcon,
  ImagePlus,
  Loader2,
  Palette,
  Printer,
  Sparkles,
} from "lucide-react";
import { CANVAS_SIZE_OPTIONS } from "@/lib/paintingOrder";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// ─────────────────────────────────────────────────────────────────
//  Style definitions — prompts are mirrored here from the API route
//  so the user can see and optionally customise exactly what is sent
//  to OpenAI before they click Generate.
// ─────────────────────────────────────────────────────────────────

type StylePreset = "monet" | "cezanne" | "vangogh" | "ukiyoe";

const AI_STYLES: {
  value: StylePreset;
  label: string;
  tagline: string;
  accentBg: string;
  accentBorder: string;
  swatchColors: string[];
  prompt: string;
}[] = [
  {
    value: "monet",
    label: "Monet Glow",
    tagline: "Soft Impressionist light, feathery brushwork, warm atmospheric colour",
    accentBg: "bg-gradient-to-br from-blue-50 to-pink-50",
    accentBorder: "border-blue-300",
    swatchColors: ["#aac4e8", "#f0c8d8", "#d0b8f0", "#f4e4b8"],
    prompt: `Transform this photograph into a luminous Impressionist oil painting in the style of Claude Monet.
Use soft, feathery brushstrokes that blend atmospheric light and shadow seamlessly.
Apply a warm, golden palette with hazy reflections, pastel pinks, lilacs, and sky blues.
Create painterly depth through layered colour washes rather than hard edges.
Give the canvas the texture of thick impasto oil paint with clearly visible, expressive brushwork.
The result should look like a gallery-quality museum painting with the warm, dreamy quality of Monet's best work.`,
  },
  {
    value: "cezanne",
    label: "Cézanne Structure",
    tagline: "Geometric colour planes and earthy Post-Impressionist depth",
    accentBg: "bg-gradient-to-br from-orange-50 to-amber-50",
    accentBorder: "border-orange-300",
    swatchColors: ["#d4924a", "#7a9e4e", "#c86e3a", "#e8c870"],
    prompt: `Convert this photograph into a Post-Impressionist oil painting masterfully inspired by Paul Cézanne.
Use structured, deliberate brushstrokes that build three-dimensional form through modulated colour planes.
Apply an earthy palette of warm ochres, muted greens, dusty oranges, and terracotta reds.
Emphasise the geometric underlying architecture of the scene through repeated, overlapping paint marks.
Include subtle distortions of perspective and the composed, analytical character of Cézanne's studio style.
The surface should have rich, tactile oil paint texture with visible directionality and a sense of studied permanence.`,
  },
  {
    value: "vangogh",
    label: "Van Gogh Motion",
    tagline: "Bold swirling strokes and vivid Expressionist drama",
    accentBg: "bg-gradient-to-br from-yellow-50 to-indigo-50",
    accentBorder: "border-yellow-400",
    swatchColors: ["#1a3a8c", "#f5d020", "#2d7a3e", "#c4461c"],
    prompt: `Reimagine this photograph as a dramatic Expressionist oil painting in the unmistakable style of Vincent van Gogh.
Use bold, swirling, energetic brushstrokes that convey intense movement, emotion, and inner life.
Apply saturated, heightened colours — deep Prussian blues, cadmium yellows, viridian greens, and burnt siennas.
Outline forms with dark, emphatic contour strokes in the manner of cloisonnism.
Create a dynamic, turbulent surface with thick impasto paint and clearly directional, rhythmic strokes throughout the entire canvas.
The final result must feel emotionally charged, vivid, and unmistakably hand-painted.`,
  },
  {
    value: "ukiyoe",
    label: "Ukiyo-e Detail",
    tagline: "Clean contours and elegant floating-world graphic refinement",
    accentBg: "bg-gradient-to-br from-red-50 to-stone-50",
    accentBorder: "border-red-300",
    swatchColors: ["#c83232", "#1a1a2e", "#e8dcc8", "#d4982a"],
    prompt: `Convert this photograph into a refined Japanese Ukiyo-e woodblock print-inspired oil painting.
Use flat, luminous colour areas bounded by clean, elegant contour lines in the floating world tradition.
Apply a refined palette of vermilion, indigo, ochre, sumi black, and ivory with decorative pattern work.
Create a graceful two-dimensional aesthetic with strong compositional balance and exquisite fine detail.
Incorporate subtle textile-like textures, cloud formations, or wave motifs where appropriate to the subject.
The painting should feel both serene and graphic, evoking the refined aesthetics of Hiroshige and Hokusai.`,
  },
];

// ─────────────────────────────────────────────────────────────────
//  Frame options
// ─────────────────────────────────────────────────────────────────

interface FrameOption {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  availableSizes: string[];
  priceCents: number;
}

const FALLBACK_FRAMES: FrameOption[] = [
  { id: "none",       name: "No frame",      slug: "none",        availableSizes: ["8x10","12x16","18x24","24x36"], priceCents: 0    },
  { id: "black_wood", name: "Black wood",    slug: "black_wood",  availableSizes: ["8x10","12x16","18x24","24x36"], priceCents: 2500 },
  { id: "walnut",     name: "Walnut",        slug: "walnut",      availableSizes: ["8x10","12x16","18x24","24x36"], priceCents: 3500 },
  { id: "gold_gallery", name: "Gold gallery", slug: "gold_gallery", availableSizes: ["8x10","12x16","18x24","24x36"], priceCents: 4500 },
];

// ─────────────────────────────────────────────────────────────────
//  Real photo URLs used throughout the workflow showcase
//  All from Unsplash (already whitelisted in next.config.mjs)
// ─────────────────────────────────────────────────────────────────

const IMGS = {
  // Source photos — what customers upload
  portrait:     "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=900&q=82",
  landscape:    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=82",
  couplePhoto:  "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=900&q=82",

  // AI-converted oil painting results — one per style
  monet:        "https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=900&q=82",
  vangogh:      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&q=82",
  cezanne:      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=900&q=82",
  ukiyoe:       "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=900&q=82",

  // Final product — canvas on wall
  canvasWall:   "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&q=82",
  galleryWall:  "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=900&q=82",
};

// CSS-gradient fallback shown while a photo is loading or if it fails
function ImgWithFallback({
  src, alt, className, fallbackGradient,
}: {
  src: string; alt: string; className?: string; fallbackGradient: string;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={className} style={{ background: fallbackGradient }} aria-label={alt} />
  ) : (
    <img
      src={src} alt={alt}
      className={`${className} object-cover`}
      onError={() => setFailed(true)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
//  Small shared UI helpers
// ─────────────────────────────────────────────────────────────────

function FieldInput({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#1a1614]">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none transition focus:border-[#c89860]" />
    </label>
  );
}

function FieldSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#1a1614]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none transition focus:border-[#c89860]">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}


// ─────────────────────────────────────────────────────────────────
//  Workflow showcase — Walgreens-style real photography layout
// ─────────────────────────────────────────────────────────────────

const STYLE_PAINTING_IMG: Record<string, string> = {
  monet:   IMGS.monet,
  cezanne: IMGS.cezanne,
  vangogh: IMGS.vangogh,
  ukiyoe:  IMGS.ukiyoe,
};

const STYLE_FALLBACK: Record<string, string> = {
  monet:   "linear-gradient(135deg,#b8ccec 0%,#e8ccd8 40%,#d8c8e8 100%)",
  cezanne: "linear-gradient(135deg,#d4924a 0%,#7a9e4e 50%,#c86e3a 100%)",
  vangogh: "linear-gradient(135deg,#1a3a8c 0%,#f5d020 50%,#2d7a3e 100%)",
  ukiyoe:  "linear-gradient(135deg,#c83232 0%,#e8dcc8 50%,#1a1a2e 100%)",
};

function WorkflowShowcase() {
  return (
    <section className="border-b border-[#eadfcb] bg-[#fdf8f1] py-16">
      <div className="mx-auto max-w-7xl px-6">

        {/* ── Section header ── */}
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#a87945]">
            End-to-end workflow
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#1a1614] md:text-4xl">
            From photo to gallery canvas — in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#6b5d54]">
            Each step uses a professional AI prompt tuned for your chosen painting master.
            The result is a genuine oil painting aesthetic — not a filter.
          </p>
        </div>

        {/* ── 5-step card row ── */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">

          {/* Step 1 — Upload */}
          <div className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_8px_32px_rgba(26,22,20,0.08)] transition hover:shadow-[0_16px_48px_rgba(26,22,20,0.14)]">
            <div className="relative h-52 w-full overflow-hidden">
              <ImgWithFallback
                src={IMGS.portrait}
                alt="Woman portrait — source photo example"
                className="h-full w-full transition duration-500 group-hover:scale-105"
                fallbackGradient="linear-gradient(135deg,#87ceeb,#90ee90)"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-[#1a1614] shadow">01</span>
              <span className="absolute bottom-3 left-3 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                Your photo
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#f4ede0] text-[#c89860]">
                  <ImagePlus className="h-3.5 w-3.5" />
                </div>
                <p className="font-bold text-[#1a1614]">Upload your photo</p>
              </div>
              <p className="text-sm leading-relaxed text-[#6b5d54]">
                Portrait, landscape, or scene — any clear photo under 10 MB becomes your source canvas.
              </p>
            </div>
          </div>

          {/* Step 2 — Choose style */}
          <div className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_8px_32px_rgba(26,22,20,0.08)] transition hover:shadow-[0_16px_48px_rgba(26,22,20,0.14)]">
            <div className="relative h-52 w-full overflow-hidden bg-[#faf6ef] p-4">
              <span className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-[#1a1614] shadow">02</span>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {AI_STYLES.map((s) => (
                  <div key={s.value} className={`overflow-hidden rounded-xl border-2 ${s.accentBorder}`}>
                    <ImgWithFallback
                      src={STYLE_PAINTING_IMG[s.value]}
                      alt={`${s.label} oil painting example`}
                      className="h-14 w-full"
                      fallbackGradient={STYLE_FALLBACK[s.value]}
                    />
                    <div className={`${s.accentBg} px-2 py-1`}>
                      <div className="flex gap-0.5">
                        {s.swatchColors.map((c) => (
                          <div key={c} className="h-2 flex-1 rounded-full" style={{ background: c }} />
                        ))}
                      </div>
                      <p className="mt-0.5 text-[9px] font-bold text-[#3e322a]">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#f4ede0] text-[#c89860]">
                  <Palette className="h-3.5 w-3.5" />
                </div>
                <p className="font-bold text-[#1a1614]">Choose a master style</p>
              </div>
              <p className="text-sm leading-relaxed text-[#6b5d54]">
                Pick from 4 masters. Each unlocks a dedicated professional prompt sent to OpenAI.
              </p>
            </div>
          </div>

          {/* Step 3 — AI converts (real before/after) */}
          <div className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_8px_32px_rgba(26,22,20,0.08)] transition hover:shadow-[0_16px_48px_rgba(26,22,20,0.14)]">
            <div className="relative h-52 w-full overflow-hidden">
              {/* Before half */}
              <ImgWithFallback
                src={IMGS.portrait}
                alt="Before — source photo"
                className="absolute bottom-0 left-0 top-0 h-full w-1/2 transition duration-500 group-hover:scale-105"
                fallbackGradient="linear-gradient(135deg,#87ceeb,#90ee90)"
              />
              {/* After half */}
              <ImgWithFallback
                src={IMGS.monet}
                alt="After — Monet oil painting result"
                className="absolute bottom-0 right-0 top-0 h-full w-1/2 transition duration-500 group-hover:scale-105"
                fallbackGradient={STYLE_FALLBACK.monet}
              />
              {/* Centre badge */}
              <div className="absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4a574] shadow-lg ring-2 ring-white">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <span className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-[#1a1614] shadow">03</span>
              <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">Before</span>
              <span className="absolute bottom-3 right-3 rounded-full bg-[#d4a574]/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">After</span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#f4ede0] text-[#c89860]">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <p className="font-bold text-[#1a1614]">OpenAI converts</p>
              </div>
              <p className="text-sm leading-relaxed text-[#6b5d54]">
                Your style prompt and photo go to gpt-image-1. A gallery-quality oil painting returns in seconds.
              </p>
            </div>
          </div>

          {/* Step 4 — Preview result (real painting) */}
          <div className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_8px_32px_rgba(26,22,20,0.08)] transition hover:shadow-[0_16px_48px_rgba(26,22,20,0.14)]">
            <div className="relative h-52 w-full overflow-hidden">
              <ImgWithFallback
                src={IMGS.vangogh}
                alt="AI oil painting result — Van Gogh style"
                className="h-full w-full transition duration-500 group-hover:scale-105"
                fallbackGradient={STYLE_FALLBACK.vangogh}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-[#1a1614] shadow">04</span>
              <span className="absolute bottom-3 left-3 rounded-full bg-[#d4a574]/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                Oil painting result
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#f4ede0] text-[#c89860]">
                  <Download className="h-3.5 w-3.5" />
                </div>
                <p className="font-bold text-[#1a1614]">Preview &amp; download</p>
              </div>
              <p className="text-sm leading-relaxed text-[#6b5d54]">
                Compare original and painting side by side. Download the high-res file instantly.
              </p>
            </div>
          </div>

          {/* Step 5 — Canvas on wall */}
          <div className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_8px_32px_rgba(26,22,20,0.08)] transition hover:shadow-[0_16px_48px_rgba(26,22,20,0.14)]">
            <div className="relative h-52 w-full overflow-hidden">
              <ImgWithFallback
                src={IMGS.canvasWall}
                alt="Framed canvas print hanging on wall"
                className="h-full w-full transition duration-500 group-hover:scale-105"
                fallbackGradient="linear-gradient(135deg,#6b4e18,#c8a855)"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-[#1a1614] shadow">05</span>
              <span className="absolute bottom-3 left-3 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                Ships to your door
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#f4ede0] text-[#c89860]">
                  <FrameIcon className="h-3.5 w-3.5" />
                </div>
                <p className="font-bold text-[#1a1614]">Order a canvas print</p>
              </div>
              <p className="text-sm leading-relaxed text-[#6b5d54]">
                Choose size and frame, pay via Stripe. Your painting ships as a professional canvas.
              </p>
            </div>
          </div>
        </div>

        {/* ── Big before / after comparison ── */}
        <div className="mt-16">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.35em] text-[#a87945]">
            See the transformation
          </p>
          <div className="overflow-hidden rounded-[2rem] shadow-[0_20px_60px_rgba(26,22,20,0.14)]">
            <div className="grid md:grid-cols-2">
              {/* Before */}
              <div className="relative">
                <ImgWithFallback
                  src={IMGS.landscape}
                  alt="Source landscape photo — before conversion"
                  className="h-80 w-full md:h-[420px]"
                  fallbackGradient="linear-gradient(135deg,#87ceeb,#90ee90)"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">Step 1</p>
                  <p className="mt-1 text-xl font-bold text-white">Your original photo</p>
                  <p className="mt-1 text-sm text-white/80">Any clear photo — portrait, landscape, or scene</p>
                </div>
              </div>
              {/* After */}
              <div className="relative">
                <ImgWithFallback
                  src={IMGS.monet}
                  alt="Monet Glow oil painting — after AI conversion"
                  className="h-80 w-full md:h-[420px]"
                  fallbackGradient={STYLE_FALLBACK.monet}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f4d090]">Result</p>
                  <p className="mt-1 text-xl font-bold text-white">Gallery-quality oil painting</p>
                  <p className="mt-1 text-sm text-white/80">Generated by OpenAI in seconds</p>
                </div>
                {/* Sparkles badge */}
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[#d4a574] px-3 py-1.5 shadow-lg">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                  <span className="text-xs font-bold text-white">Monet Glow</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Four style painting gallery ── */}
        <div className="mt-16">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.35em] text-[#a87945]">
            Four master painting styles
          </p>
          <p className="mb-8 text-center text-sm text-[#6b5d54]">
            Each style applies a unique professional AI prompt — select one in the studio above.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AI_STYLES.map((s) => (
              <div
                key={s.value}
                className="group overflow-hidden rounded-[1.75rem] shadow-[0_8px_28px_rgba(26,22,20,0.10)] transition hover:shadow-[0_16px_48px_rgba(26,22,20,0.18)] hover:-translate-y-1"
              >
                {/* Real painting image */}
                <div className="relative h-48 overflow-hidden">
                  <ImgWithFallback
                    src={STYLE_PAINTING_IMG[s.value]}
                    alt={`${s.label} oil painting example`}
                    className="h-full w-full transition duration-500 group-hover:scale-105"
                    fallbackGradient={STYLE_FALLBACK[s.value]}
                  />
                  {/* Colour swatch overlay bar */}
                  <div className="absolute bottom-0 left-0 right-0 flex h-2">
                    {s.swatchColors.map((c) => (
                      <div key={c} className="flex-1" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                {/* Style info */}
                <div className={`${s.accentBg} px-4 pb-5 pt-4`}>
                  <p className="font-bold text-[#1a1614]">{s.label}</p>
                  <p className="mt-1 text-sm text-[#5c4f45]">{s.tagline}</p>
                  <p className="mt-3 line-clamp-2 text-xs italic leading-relaxed text-[#8a7a6f]">
                    &ldquo;{s.prompt.split("\n")[0]}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────

export default function AIPaintingStudio() {
  const { data: session, status } = useSession();

  const [file, setFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<StylePreset>("monet");
  // The active prompt — initialised from the style, editable by the user
  const [activePrompt, setActivePrompt] = useState(AI_STYLES[0].prompt);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [frames, setFrames] = useState<FrameOption[]>(FALLBACK_FRAMES);
  const [mode, setMode] = useState<"download" | "print">("print");
  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZE_OPTIONS[1].value);
  const [selectedFrameId, setSelectedFrameId] = useState(FALLBACK_FRAMES[1].id);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (session?.user?.name) setCustomerName(session.user.name);
    if (session?.user?.email) setEmail(session.user.email);
  }, [session]);

  useEffect(() => {
    fetch("/api/frames")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.frames) && data.frames.length > 0) {
          setFrames(data.frames);
          setSelectedFrameId(data.frames[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => { if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl); };
  }, [localPreviewUrl]);

  // When style changes, replace prompt with the canonical style prompt
  const handleStyleChange = (value: StylePreset) => {
    const def = AI_STYLES.find((s) => s.value === value)!;
    setStyle(value);
    setActivePrompt(def.prompt);
    setResultUrl(null);
    setError(null);
    // Auto-expand prompt panel briefly so the user notices the change
    setPromptExpanded(true);
  };

  const selectedStyleDef = AI_STYLES.find((s) => s.value === style)!;
  const selectedFrame = frames.find((f) => f.id === selectedFrameId) ?? frames[0];
  const frameSurcharge = selectedFrame?.priceCents ?? 0;
  const canvasOption = CANVAS_SIZE_OPTIONS.find((c) => c.value === canvasSize);

  const pricing = useMemo(() => {
    if (mode === "download") return { total: 29, label: "Digital oil-paint file", unitAmount: 2900 };
    const base = canvasOption?.basePrice ?? 99;
    const frameAdd = frameSurcharge / 100;
    const unit = base + frameAdd;
    return {
      total: unit * Math.max(quantity, 1),
      label: `Canvas print ${canvasSize}${selectedFrame?.name && selectedFrame.name !== "No frame" ? ` / ${selectedFrame.name}` : ""}`,
      unitAmount: unit * 100,
    };
  }, [mode, canvasSize, frameSurcharge, quantity, selectedFrame, canvasOption]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResultUrl(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleGenerate = async () => {
    if (!file) { setError("Please choose a photo to convert."); return; }
    setGenerating(true);
    setError(null);
    setResultUrl(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("style", style);
      // Send the (possibly user-edited) active prompt as customPrompt
      fd.append("customPrompt", activePrompt.trim());

      const res = await fetch("/api/ai-painting/preview", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed.");
      if (!data?.imageDataUrl) throw new Error("The AI server did not return an image.");
      setResultUrl(data.imageDataUrl);
    } catch (err: any) {
      setError(err?.message || "Unable to generate the artwork.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `oil-painting-${style}.png`;
    a.click();
  };

  const handleCheckout = async () => {
    if (!resultUrl) { setError("Generate the oil painting preview before checkout."); return; }
    if (!customerName.trim() || !email.trim()) { setError("Please enter your name and email."); return; }
    setCheckingOut(true);
    setError(null);

    try {
      const res = await fetch("/api/painting-order/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode, sourcePublicId: null, sourceImageUrl: localPreviewUrl,
          transformedUrl: resultUrl, stylePreset: style, canvasSize,
          frameStyle: selectedFrame?.slug ?? "none", quantity, customerName, email, notes,
          shareToGallery: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed.");
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe is not available.");
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (stripeError) throw new Error(stripeError.message || "Stripe checkout failed.");
    } catch (err: any) {
      setError(err?.message || "Checkout failed.");
      setCheckingOut(false);
    }
  };

  // ── Loading / unauthenticated states ──

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#d4a574]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f8f1e6]">
        <header className="sticky top-0 z-20 border-b border-[#eadfcb] bg-[#fffaf2]/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-[0.08em]">OIL PAINTING</Link>
            <div className="flex items-center gap-3">
              <CartDropdown />
              <UserMenu />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-8 text-center">
            <Sparkles className="mx-auto mb-4 h-16 w-16 text-[#d4a574]" />
            <h2 className="text-2xl font-bold text-[#1a1614]">AI Oil Painting AI Studio</h2>
            <p className="mx-auto mt-3 max-w-md text-[#6b5d54]">
              Sign in to convert your photos into professional oil paintings with OpenAI.
            </p>
            <Link href="/auth/signin" className="mt-6 inline-block rounded-2xl bg-[#1a1614] px-8 py-3 font-semibold text-white hover:bg-[#2a2624]">
              Sign in to get started
            </Link>
          </div>
        </div>
        <WorkflowShowcase />
      </div>
    );
  }

  // ── Authenticated studio ──

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#1a1614]">

      {/* Site header */}
      <header className="sticky top-0 z-20 border-b border-[#eadfcb] bg-[#fffaf2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-[0.08em]">OIL PAINTING</Link>
          <nav className="hidden md:flex flex-wrap gap-3 text-sm font-semibold text-[#6b5d54]">
            <Link href="/products" className="rounded-full border border-[#eadfcb] px-4 py-2 transition hover:border-[#d4a574] hover:text-[#1a1614]">Products</Link>
            <Link href="/painting-order" className="rounded-full border border-[#eadfcb] px-4 py-2 transition hover:border-[#d4a574] hover:text-[#1a1614]">Custom Order</Link>
            <Link href="/painting-order/gallery" className="rounded-full border border-[#eadfcb] px-4 py-2 transition hover:border-[#d4a574] hover:text-[#1a1614]">Gallery</Link>
            <span className="rounded-full border border-[#d4a574] bg-[#fdf3e7] px-4 py-2 text-[#1a1614]">AI Studio</span>
          </nav>
          <div className="flex items-center gap-3">
            <CartDropdown />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#eadfcb]">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-[#f4c98d] blur-3xl" />
          <div className="absolute right-0 top-12 h-[28rem] w-[28rem] rounded-full bg-[#dce6c4] blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ddcfbb] bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
            <Sparkles className="h-4 w-4" />
            AI Oil Painting AI Studio — OpenAI powered
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Upload a photo, choose a master style, and order a framed canvas print.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6b5d54]">
            Each style selection applies a professional prompt that instructs OpenAI exactly how to
            paint. The prompt is shown below your selection — you can read and refine it before generating.
          </p>

        </div>
      </section>

      {/* Workflow showcase */}
      <WorkflowShowcase />

      {/* Studio */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">

          {/* ── Left column ── */}
          <div className="space-y-6">

            {/* Step 1: Upload */}
            <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a1614] text-white">
                  <ImagePlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">1. Upload your photo</h2>
                  <p className="text-sm text-[#6b5d54]">Clear, single-subject images work best. Under 10 MB.</p>
                </div>
              </div>
              <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[#ddcfbb] bg-[#faf6ef] py-10 text-center transition hover:border-[#d4a574]">
                <ImagePlus className="h-9 w-9 text-[#c89860]" />
                <span className="font-semibold">{file ? file.name : "Choose an image"}</span>
                <span className="text-sm text-[#6b5d54]">JPG, PNG, WEBP</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {/* Step 2: Style + Prompt */}
            <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
              <h2 className="text-xl font-bold">2. Choose painting style</h2>
              <p className="mt-1 text-sm text-[#6b5d54]">
                Selecting a style loads its professional AI prompt below — you can review or customise it before generating.
              </p>

              <div className="mt-5 grid gap-3">
                {AI_STYLES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStyleChange(opt.value)}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      style === opt.value
                        ? `${opt.accentBg} ${opt.accentBorder} shadow-md`
                        : "border-[#eadfcb] hover:border-[#d4a574]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-[#1a1614]">{opt.label}</p>
                        <p className="mt-0.5 text-sm text-[#6b5d54]">{opt.tagline}</p>
                      </div>
                      {/* Style swatch dots */}
                      <div className="flex shrink-0 gap-1 pt-0.5">
                        {opt.swatchColors.map((c) => (
                          <div key={c} className="h-4 w-4 rounded-full shadow-sm" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* ── Prompt panel ── */}
              <div className={`mt-5 overflow-hidden rounded-2xl border-2 transition-all ${selectedStyleDef.accentBorder} ${selectedStyleDef.accentBg}`}>
                <button
                  type="button"
                  onClick={() => setPromptExpanded((p) => !p)}
                  className="flex w-full items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#c89860]" />
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#6b5d54]">
                      AI prompt sent to OpenAI
                    </span>
                    <span className="rounded-full bg-[#d4a574]/20 px-2 py-0.5 text-[10px] font-bold text-[#a87945]">
                      {selectedStyleDef.label}
                    </span>
                  </div>
                  {promptExpanded
                    ? <ChevronUp className="h-4 w-4 text-[#8a7a6f]" />
                    : <ChevronDown className="h-4 w-4 text-[#8a7a6f]" />}
                </button>

                {promptExpanded && (
                  <div className="border-t border-white/50 px-4 pb-4">
                    <p className="mb-2 text-xs text-[#6b5d54]">
                      This is the exact instruction sent to OpenAI for the <strong>{selectedStyleDef.label}</strong> style.
                      You can refine it to add extra direction for your specific image.
                    </p>
                    <textarea
                      ref={promptRef}
                      value={activePrompt}
                      onChange={(e) => setActivePrompt(e.target.value)}
                      rows={7}
                      className="w-full resize-y rounded-xl border border-white/60 bg-white/70 px-4 py-3 font-mono text-xs leading-relaxed text-[#1a1614] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#d4a574]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setActivePrompt(selectedStyleDef.prompt)}
                      className="mt-2 text-xs text-[#a87945] underline underline-offset-2 hover:text-[#7a5930]"
                    >
                      Reset to default {selectedStyleDef.label} prompt
                    </button>
                  </div>
                )}
              </div>

              {/* Generate button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !file}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a1614] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating oil painting…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate with OpenAI</>
                )}
              </button>
            </div>

            {/* Step 3: Order options */}
            <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
              <h2 className="text-xl font-bold">3. Product &amp; checkout</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  { id: "print" as const, icon: <Printer className="h-5 w-5" />, title: "Canvas print", text: "Physical canvas — choose size and frame." },
                  { id: "download" as const, icon: <Download className="h-5 w-5" />, title: "Digital download", text: "High-res file delivered after payment." },
                ].map((m) => (
                  <button key={m.id} type="button" onClick={() => setMode(m.id)}
                    className={`rounded-2xl border p-4 text-left transition ${mode === m.id ? "border-[#d4a574] bg-[#fff7eb]" : "border-[#eadfcb]"}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a1614] text-white">{m.icon}</div>
                      <div>
                        <p className="font-semibold">{m.title}</p>
                        <p className="text-sm text-[#6b5d54]">{m.text}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {mode === "print" && (
                <div className="mt-5 space-y-4">
                  <FieldSelect
                    label="Canvas size"
                    value={canvasSize}
                    onChange={(v) => setCanvasSize(v as typeof canvasSize)}
                    options={CANVAS_SIZE_OPTIONS.map((c) => ({ value: c.value, label: `${c.label} — $${c.basePrice}` }))}
                  />

                  {/* Frame selector */}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-[#1a1614]">Frame style</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {frames.filter((f) => f.availableSizes.includes(canvasSize)).map((f) => (
                        <button key={f.id} type="button" onClick={() => setSelectedFrameId(f.id)}
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                            selectedFrameId === f.id ? "border-[#d4a574] bg-[#fff7eb]" : "border-[#eadfcb] hover:border-[#d4c7ad]"
                          }`}>
                          {f.imageUrl ? (
                            <img src={f.imageUrl} alt={f.name} className="h-12 w-12 rounded-xl object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0e8da]">
                              <FrameIcon className="h-5 w-5 text-[#c89860]" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold">{f.name}</p>
                            <p className="text-xs text-[#6b5d54]">
                              {f.priceCents === 0 ? "No surcharge" : `+$${(f.priceCents / 100).toFixed(0)}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedFrame?.description && <p className="mt-2 text-xs text-[#8a7a6f]">{selectedFrame.description}</p>}
                  </div>

                  <FieldInput label="Quantity" type="number" value={String(quantity)} onChange={(v) => setQuantity(Math.max(Number(v) || 1, 1))} />
                </div>
              )}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FieldInput label="Your name" value={customerName} onChange={setCustomerName} placeholder="Full name" />
                <FieldInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
              </div>

              <div className="mt-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Notes</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                    placeholder="Special instructions, gift note, or production details…"
                    className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none transition focus:border-[#c89860]" />
                </label>
              </div>

              {/* Pricing + checkout */}
              <div className="mt-6 rounded-3xl bg-[#faf6ef] p-5">
                <div className="flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">Order total</p>
                    <p className="mt-1 text-3xl font-bold">${pricing.total.toFixed(2)}</p>
                    <p className="mt-1 text-sm text-[#6b5d54]">{pricing.label}</p>
                  </div>
                  <button type="button" onClick={handleCheckout} disabled={!resultUrl || checkingOut}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                    {checkingOut ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                    ) : (
                      <>{mode === "print" ? <FrameIcon className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                      {mode === "print" ? "Pay and place order" : "Pay and unlock download"}
                      <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
                {!resultUrl && <p className="mt-3 text-xs text-[#8a7a6f]">Generate the oil painting preview above before checking out.</p>}
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              </div>
            </div>
          </div>

          {/* ── Right column: preview ── */}
          <div className="space-y-6">
            <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Preview</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">Before / after</span>
              </div>

              <div className="mt-6 space-y-4">
                {/* Source */}
                <div className="overflow-hidden rounded-3xl border border-[#eadfcb] bg-[#faf6ef]">
                  <p className="border-b border-[#eadfcb] bg-[#f4ede0] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#8a7a6f]">
                    Source photo
                  </p>
                  {localPreviewUrl ? (
                    <img src={localPreviewUrl} alt="Source" className="max-h-72 w-full object-contain" />
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-[#b89c80]">Upload a photo above</div>
                  )}
                </div>

                {/* Result */}
                <div className="overflow-hidden rounded-3xl border border-[#eadfcb] bg-[#faf6ef]">
                  <div className="flex items-center justify-between border-b border-[#eadfcb] bg-[#f4ede0] px-5 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#8a7a6f]">
                      {selectedStyleDef.label} painting
                    </p>
                    {resultUrl && (
                      <button onClick={handleDownload}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4a574] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b88d4d]">
                        <Download className="h-3.5 w-3.5" />Download
                      </button>
                    )}
                  </div>
                  {generating ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-4">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#eadfcb] border-t-[#d4a574]" />
                      <p className="text-sm text-[#5c4f45]">Generating {selectedStyleDef.label}…</p>
                    </div>
                  ) : resultUrl ? (
                    <img src={resultUrl} alt="Generated oil painting" className="max-h-72 w-full object-contain" />
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-[#b89c80]">
                      Click &quot;Generate with OpenAI&quot; to create your painting
                    </div>
                  )}
                </div>

                {/* Active style + prompt summary card */}
                <div className={`rounded-2xl border-2 p-4 ${selectedStyleDef.accentBg} ${selectedStyleDef.accentBorder}`}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {selectedStyleDef.swatchColors.map((c) => (
                        <div key={c} className="h-4 w-4 rounded-full shadow-sm" style={{ background: c }} />
                      ))}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6b5d54]">
                      {selectedStyleDef.label}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[#3e322a]">{selectedStyleDef.tagline}</p>
                  <p className="mt-2 line-clamp-2 text-xs italic text-[#6b5d54]">
                    &ldquo;{activePrompt.split("\n")[0]}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => { setPromptExpanded(true); promptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                    className="mt-2 text-xs text-[#a87945] underline underline-offset-2 hover:text-[#7a5930]"
                  >
                    View full AI prompt →
                  </button>
                </div>

                {/* Selected frame */}
                {mode === "print" && selectedFrame && (
                  <div className="rounded-2xl border border-[#eadfcb] bg-[#fffaf2] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#8a7a6f]">Selected frame</p>
                    <div className="mt-3 flex items-center gap-3">
                      {selectedFrame.imageUrl ? (
                        <img src={selectedFrame.imageUrl} alt={selectedFrame.name} className="h-16 w-16 rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0e8da]">
                          <FrameIcon className="h-7 w-7 text-[#c89860]" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#1a1614]">{selectedFrame.name}</p>
                        <p className="text-sm text-[#6b5d54]">{canvasSize} canvas</p>
                        <p className="text-sm text-[#6b5d54]">
                          {selectedFrame.priceCents === 0 ? "Included" : `+$${(selectedFrame.priceCents / 100).toFixed(0)} surcharge`}
                        </p>
                      </div>
                    </div>
                    {selectedFrame.description && <p className="mt-2 text-xs text-[#8a7a6f]">{selectedFrame.description}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
