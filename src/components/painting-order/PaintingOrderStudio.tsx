"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import AppHeader from "@/components/painting-order/AppHeader";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Frame,
  ImagePlus,
  Loader2,
  Palette,
  Printer,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import {
  CANVAS_SIZE_OPTIONS,
  DEFAULT_PAINTING_STYLE,
  FRAME_STYLE_OPTIONS,
  PAINTING_STYLE_OPTIONS,
  estimatePaintingPrice,
  type PaintingStyleOption,
  type PaintingStylePreset,
} from "@/lib/paintingOrder";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type StyleServiceStatus = "loading" | "live" | "fallback";
type BackendFeedback = {
  serviceUrl?: string;
  timeoutMs?: number;
  isTimeout?: boolean;
  notice?: string;
};

export default function PaintingOrderStudio() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [sourcePublicId, setSourcePublicId] = useState<string | null>(null);
  const [styleOptions, setStyleOptions] =
    useState<PaintingStyleOption[]>(PAINTING_STYLE_OPTIONS);
  const [stylePreset, setStylePreset] =
    useState<PaintingStylePreset>(DEFAULT_PAINTING_STYLE);
  const [stylePreviewMap, setStylePreviewMap] = useState<Record<string, string>>(
    {}
  );
  const [styleServiceStatus, setStyleServiceStatus] =
    useState<StyleServiceStatus>("loading");
  const [styleServiceUrl, setStyleServiceUrl] = useState<string | null>(null);
  const [styleServiceNotice, setStyleServiceNotice] = useState<string | null>(null);
  const [transformedUrl, setTransformedUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"download" | "print">("print");
  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZE_OPTIONS[1].value);
  const [frameStyle, setFrameStyle] = useState(FRAME_STYLE_OPTIONS[1].value);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [shareToGallery, setShareToGallery] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryDisplayName, setGalleryDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewingStyle, setPreviewingStyle] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const [backendFeedback, setBackendFeedback] = useState<BackendFeedback | null>(
    null
  );
  const [conversionProvider, setConversionProvider] = useState<
    "render-cyclegan" | "gemini"
  >("render-cyclegan");

  const pricing = useMemo(
    () =>
      estimatePaintingPrice({
        mode,
        canvasSize,
        frameStyle,
        quantity,
      }),
    [mode, canvasSize, frameStyle, quantity]
  );
  const selectedStylePreview =
    stylePreviewMap[stylePreset] || transformedUrl || null;

  useEffect(() => {
    let cancelled = false;

    const loadStyles = async () => {
      try {
        const response = await fetch("/api/painting-order/styles", {
          cache: "no-store",
        });
        const data = await response.json();

        if (cancelled) {
          return;
        }

        const nextStyles: PaintingStyleOption[] =
          Array.isArray(data?.styles) && data.styles.length > 0
            ? data.styles
            : PAINTING_STYLE_OPTIONS;

        setStyleOptions(nextStyles);
        setStylePreset((current) =>
          nextStyles.some((option) => option.value === current)
            ? current
            : nextStyles[0].value
        );
        setStyleServiceStatus(
          data?.providerUsed === "render-cyclegan" ? "live" : "fallback"
        );
        setStyleServiceUrl(data?.serviceUrl || null);
        setStyleServiceNotice(data?.backendNotice || null);
      } catch {
        if (!cancelled) {
          setStyleOptions(PAINTING_STYLE_OPTIONS);
          setStyleServiceStatus("fallback");
          setStyleServiceNotice(
            "The style server status could not be loaded. The page will keep using fallback labels until the backend responds."
          );
        }
      }
    };

    loadStyles();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose an image to upload.");
      return null;
    }

    setUploading(true);
    setError(null);
    setWarning(null);
    setProviderUsed(null);
    setBackendFeedback(null);
    setTransformedUrl(null);
    setStylePreviewMap({});

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/painting-order/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Upload failed.");
      }

      setSourceImageUrl(data.imageUrl);
      setSourcePublicId(data.publicId);
      return data as { imageUrl: string; publicId: string };
    } catch (uploadError: any) {
      setError(uploadError?.message || "Upload failed.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async (targetStyle: PaintingStylePreset = stylePreset) => {
    let activePublicId = sourcePublicId;
    let activeImageUrl = sourceImageUrl;

    if ((!activePublicId || !activeImageUrl) && file) {
      const uploaded = await handleUpload();
      activePublicId = uploaded?.publicId || null;
      activeImageUrl = uploaded?.imageUrl || null;
    }

    if (!activePublicId || !activeImageUrl) {
      setError("Choose and upload an image first.");
      return;
    }

    setGenerating(targetStyle === stylePreset);
    setPreviewingStyle(targetStyle);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch("/api/painting-order/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: activePublicId,
          imageUrl: activeImageUrl,
          stylePreset: targetStyle,
          provider: conversionProvider,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Preview generation failed.");
      }

      setTransformedUrl(data.transformedUrl);
      setStylePreviewMap((current) => ({
        ...current,
        [targetStyle]: data.transformedUrl,
      }));
      setProviderUsed(data.providerUsed || null);
      setWarning(data.warning || null);
      setBackendFeedback(data.backendFeedback || null);
    } catch (transformError: any) {
      setError(transformError?.message || "Preview generation failed.");
    } finally {
      setGenerating(false);
      setPreviewingStyle(null);
    }
  };

  const handleSelectStyle = async (targetStyle: PaintingStylePreset) => {
    setStylePreset(targetStyle);

    if ((!file && !sourcePublicId) || stylePreviewMap[targetStyle]) {
      return;
    }

    await handleGenerate(targetStyle);
  };

  const handleCheckout = async () => {
    if (!sourcePublicId || !transformedUrl) {
      setError("Generate the oil-paint preview before checkout.");
      return;
    }

    setCheckingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/painting-order/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          sourcePublicId,
          sourceImageUrl,
          transformedUrl,
          stylePreset,
          canvasSize,
          frameStyle,
          quantity,
          customerName,
          email,
          notes,
          shareToGallery,
          galleryTitle,
          galleryDisplayName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Checkout failed.");
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe is not available.");
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message || "Stripe checkout failed.");
      }
    } catch (checkoutError: any) {
      setError(checkoutError?.message || "Checkout failed.");
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#1a1614]">
      <AppHeader />

      {/* Visitor Check */}
      {status === "loading" ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4a574]"></div>
        </div>
      ) : !session ? (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-[2rem] border-2 border-[#eadfcb] p-8 text-center">
            <div className="mb-6">
              <Sparkles className="w-16 h-16 text-[#d4a574] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1a1614] mb-2">
                Create Your Custom Oil Painting
              </h2>
              <p className="text-[#6b5d54] max-w-md mx-auto">
                Transform your photos into beautiful oil paintings. Sign in to upload images and convert them into custom artwork.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="inline-block bg-[#1a1614] text-white px-8 py-3 rounded-lg hover:bg-[#2a2624] transition-colors font-semibold"
              >
                Sign In to Get Started
              </Link>
              <p className="text-sm text-[#6b5d54]">
                Don't have an account?{" "}
                <Link href="/auth/signin" className="text-[#d4a574] hover:underline">
                  Sign up with Google
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#eadfcb]">
              <h3 className="text-lg font-semibold text-[#1a1614] mb-4">
                What You Can Do
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <UploadCloud className="w-8 h-8 text-[#d4a574] mx-auto mb-2" />
                  <p className="text-[#6b5d54]">Upload Photos</p>
                </div>
                <div className="text-center">
                  <Palette className="w-8 h-8 text-[#d4a574] mx-auto mb-2" />
                  <p className="text-[#6b5d54]">Convert to Oil Paintings</p>
                </div>
                <div className="text-center">
                  <Frame className="w-8 h-8 text-[#d4a574] mx-auto mb-2" />
                  <p className="text-[#6b5d54]">Order Custom Frames</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <section className="relative overflow-hidden border-b border-[#eadfcb]">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-[#f4c98d] blur-3xl" />
          <div className="absolute right-0 top-12 h-[28rem] w-[28rem] rounded-full bg-[#dce6c4] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ddcfbb] bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
                <Sparkles className="h-4 w-4" />
                Commercial oil-paint conversion studio
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                Upload a photo, convert it with the live style engine, then order
                a framed canvas or digital artwork.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#6b5d54] md:text-lg">
                The workflow is now production-oriented: Cloudinary handles the
                source upload, your Render CycleGAN service handles style
                conversion, and Stripe completes the order.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/painting-order"
                className="rounded-2xl border-2 border-[#e8dcc4] bg-white px-4 py-3 text-sm font-semibold text-[#1a1614] hover:border-[#d4a574]"
              >
                Back to intake page
              </Link>
              <Link
                href="/painting-order/gallery"
                className="rounded-2xl border-2 border-[#e8dcc4] bg-white px-4 py-3 text-sm font-semibold text-[#1a1614] hover:border-[#d4a574]"
              >
                View gallery
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatusCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Style engine"
              value={
                styleServiceStatus === "loading"
                  ? "Checking backend"
                  : styleServiceStatus === "live"
                    ? "Render backend live"
                    : "Fallback preview only"
              }
              text={
                styleServiceStatus === "live"
                  ? styleServiceUrl
                    ? styleServiceUrl.replace(/^https?:\/\//, "")
                    : "Remote style service"
                  : "Cloudinary backup preview"
              }
            />
            <StatusCard
              icon={<Frame className="h-5 w-5" />}
              title="Print options"
              value="Canvas + frames"
              text="8x10 to 24x36, framed or unstretched"
            />
            <StatusCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Checkout"
              value="Stripe enabled"
              text="Digital download or printed artwork"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        {(styleServiceNotice || backendFeedback?.notice) && (
          <div className="mb-6 rounded-3xl border border-[#eadfcb] bg-white px-5 py-4">
            <div className="text-sm font-semibold text-[#1a1614]">
              Style server feedback
            </div>
            {styleServiceNotice && (
              <div className="mt-2 text-sm text-[#6b5d54]">{styleServiceNotice}</div>
            )}
            {backendFeedback?.notice && (
              <div className="mt-2 text-sm text-amber-700">
                {backendFeedback.notice}
              </div>
            )}
            {(backendFeedback?.serviceUrl || styleServiceUrl) && (
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8a796d]">
                Server:{" "}
                {(backendFeedback?.serviceUrl || styleServiceUrl || "").replace(
                  /^https?:\/\//,
                  ""
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[0.92fr,1.08fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a1614] text-white">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">1. Upload source photo</h2>
                  <p className="text-sm text-[#6b5d54]">
                    Best results come from a clear single-subject image under 10MB.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border-2 border-dashed border-[#ddcfbb] bg-[#faf6ef] p-6">
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] || null;
                      setFile(nextFile);
                      setWarning(null);
                      setError(null);
                      setProviderUsed(null);
                      setSourcePublicId(null);
                      setTransformedUrl(null);
                      setSourceImageUrl(
                        nextFile ? URL.createObjectURL(nextFile) : null
                      );
                    }}
                  />
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ImagePlus className="h-10 w-10 text-[#c89860]" />
                    <div className="mt-3 font-semibold">
                      {file ? file.name : "Choose image"}
                    </div>
                    <div className="mt-2 text-sm text-[#6b5d54]">
                      JPG, PNG, WEBP, or BMP
                    </div>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a1614] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading source...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Upload to Cloudinary
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">2. Choose painting style</h2>
                  <p className="mt-1 text-sm text-[#6b5d54]">
                    Select a supported model from the live backend, then preview
                    the converted oil painting before ordering.
                  </p>
                </div>
                <span className="rounded-full bg-[#faf6ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
                  {styleServiceStatus === "live" ? "Live backend" : "Fallback"}
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {styleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectStyle(option.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      stylePreset === option.value
                        ? "border-[#d4a574] bg-[#fff7eb]"
                        : "border-[#eadfcb] hover:border-[#d4a574]"
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="mt-1 text-sm text-[#6b5d54]">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-[#eadfcb] bg-[#faf6ef] p-4">
                <div className="text-sm font-semibold text-[#1a1614]">
                  Conversion engine
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setConversionProvider("render-cyclegan")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      conversionProvider === "render-cyclegan"
                        ? "border-[#d4a574] bg-[#fff7eb]"
                        : "border-[#eadfcb] hover:border-[#d4a574]"
                    }`}
                  >
                    <div className="font-semibold">Render CycleGAN</div>
                    <div className="mt-1 text-sm text-[#6b5d54]">
                      Original live style service conversion.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConversionProvider("gemini")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      conversionProvider === "gemini"
                        ? "border-[#d4a574] bg-[#fff7eb]"
                        : "border-[#eadfcb] hover:border-[#d4a574]"
                    }`}
                  >
                    <div className="font-semibold">AI (DALL-E)</div>
                    <div className="mt-1 text-sm text-[#6b5d54]">
                      Generate an oil painting preview using OpenAI DALL-E.
                    </div>
                  </button>
                </div>
                <div className="mt-4 text-sm text-[#6b5d54]">
                  {conversionProvider === "gemini"
                    ? "DALL-E uses AI to create an oil painting preview by editing the uploaded image."
                    : "The live backend keeps the existing style transfer flow."}
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-[#eadfcb] bg-[#faf6ef] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#1a1614]">
                      Selected style proof
                    </div>
                    <div className="text-sm text-[#6b5d54]">
                      Choose a style to preview the converted oil painting before checkout.
                    </div>
                  </div>
                  {previewingStyle === stylePreset && (
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b5d54]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Rendering preview
                    </div>
                  )}
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl bg-white">
                  {selectedStylePreview ? (
                    <img
                      src={selectedStylePreview}
                      alt={`${stylePreset} preview`}
                      className="h-56 w-full object-cover"
                    />
                  ) : sourceImageUrl ? (
                    <img
                      src={sourceImageUrl}
                      alt="Source preview"
                      className="h-56 w-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-[#6b5d54]">
                      Upload a source image, then click a style card to generate its preview here.
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGenerate(stylePreset)}
                disabled={(!file && !sourcePublicId) || generating || uploading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#e8dcc4] px-4 py-3 text-sm font-semibold text-[#1a1614] hover:border-[#d4a574] disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading source...
                  </>
                ) : generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {conversionProvider === "gemini"
                      ? "Creating Gemini preview..."
                      : "Converting selected style..."}
                  </>
                ) : (
                  <>
                    <Palette className="h-4 w-4" />
                    {conversionProvider === "gemini"
                      ? "Preview with Gemini AI"
                      : "Preview selected style"}
                  </>
                )}
              </button>
            </div>

            <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-[#1a1614] p-6 text-white">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Workflow
              </div>
              <div className="mt-4 space-y-4 text-sm text-white/80">
                <StepRow number="1" text="Upload a customer photo to Cloudinary." />
                <StepRow number="2" text="Send the image to the Render style-transfer service." />
                <StepRow number="3" text="Review the converted artwork and select product specs." />
                <StepRow number="4" text="Pay in Stripe and optionally publish to the gallery." />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">3. Proof preview</h2>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
                  Before / after
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <PreviewCard
                  title="Source"
                  imageUrl={sourceImageUrl}
                  fallback="Upload a source image first."
                />
                <LockedPreviewCard
                  title="Converted artwork"
                  imageUrl={transformedUrl}
                  fallback="Run the style conversion to create the customer proof."
                />
              </div>

              {transformedUrl && (
                <div className="mt-4 rounded-2xl border border-[#eadfcb] bg-[#fff8ed] px-4 py-3 text-sm text-[#6b5d54]">
                  The converted artwork is intentionally blurred on this page. Customers must complete payment before the full image can be viewed or downloaded.
                </div>
              )}

              {(providerUsed || warning) && (
                <div className="mt-4 rounded-2xl bg-[#faf6ef] p-4 text-sm text-[#6b5d54]">
                  {providerUsed && (
                    <div>
                      Provider used:{" "}
                      <span className="font-semibold text-[#1a1614]">
                        {providerUsed}
                      </span>
                    </div>
                  )}
                  {warning && (
                    <div className="mt-1 text-amber-700">{warning}</div>
                  )}
                  {backendFeedback?.isTimeout && (
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8a796d]">
                      Backend timeout while waiting for Render conversion
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border-2 border-[#eadfcb] bg-white p-6">
              <h2 className="text-2xl font-bold">4. Product and checkout</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <ModeCard
                  active={mode === "print"}
                  onClick={() => setMode("print")}
                  icon={<Printer className="h-5 w-5" />}
                  title="Canvas print"
                  text="Physical production with canvas size, frame, and quantity options."
                />
                <ModeCard
                  active={mode === "download"}
                  onClick={() => setMode("download")}
                  icon={<Download className="h-5 w-5" />}
                  title="Digital download"
                  text="Deliver the converted file immediately after payment."
                />
              </div>

              {mode === "print" && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <SelectInput
                    label="Canvas size"
                    value={canvasSize}
                    onChange={(value) =>
                      setCanvasSize(value as (typeof CANVAS_SIZE_OPTIONS)[number]["value"])
                    }
                    options={CANVAS_SIZE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: `${option.label} - $${option.basePrice}`,
                    }))}
                  />
                  <SelectInput
                    label="Frame style"
                    value={frameStyle}
                    onChange={(value) =>
                      setFrameStyle(value as (typeof FRAME_STYLE_OPTIONS)[number]["value"])
                    }
                    options={FRAME_STYLE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: `${option.label}${option.surcharge ? ` (+$${option.surcharge})` : ""}`,
                    }))}
                  />
                  <Input
                    label="Quantity"
                    type="number"
                    value={String(quantity)}
                    onChange={(value) =>
                      setQuantity(Math.max(Number(value) || 1, 1))
                    }
                  />
                </div>
              )}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input
                  label="Customer name"
                  value={customerName}
                  onChange={setCustomerName}
                  placeholder="Full name"
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                />
              </div>

              <div className="mt-4">
                <TextAreaInput
                  label="Production notes"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Example: sharpen facial detail, keep background soft, gift order, or rush production."
                />
              </div>

              <div className="mt-5 rounded-2xl border border-[#eadfcb] bg-[#fffdfa] p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={shareToGallery}
                    onChange={(event) => setShareToGallery(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#c89860]"
                  />
                  <div>
                    <div className="font-semibold text-[#1a1614]">
                      Publish this artwork in the public gallery after payment
                    </div>
                    <div className="mt-1 text-sm text-[#6b5d54]">
                      Shared items can appear on the public gallery for future buyers.
                    </div>
                  </div>
                </label>

                {shareToGallery && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Input
                      label="Gallery title"
                      value={galleryTitle}
                      onChange={setGalleryTitle}
                      placeholder="Golden portrait study"
                    />
                    <Input
                      label="Public display name"
                      value={galleryDisplayName}
                      onChange={setGalleryDisplayName}
                      placeholder="Studio customer"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-3xl bg-[#faf6ef] p-5">
                <div className="grid gap-5 md:grid-cols-[1fr,auto] md:items-end">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
                      Order total
                    </div>
                    <div className="text-3xl font-bold">${pricing.total}</div>
                    <div className="text-sm text-[#6b5d54]">{pricing.label}</div>
                    <div className="text-sm text-[#6b5d54]">
                      {mode === "print"
                        ? "Production review starts after successful payment, and the full artwork proof unlocks after checkout."
                        : "Digital delivery and the full artwork preview unlock immediately after payment."}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={!transformedUrl || checkingOut}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        {mode === "print" ? (
                          <Frame className="h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {mode === "print"
                          ? "Pay and place order"
                          : "Pay and unlock download"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
              </div>
            </div>
          </div>
        </div>
      </section>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  icon,
  title,
  value,
  text,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-[#eadfcb] bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1a1614] text-white">
          {icon}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
            {title}
          </div>
          <div className="font-semibold">{value}</div>
          <div className="text-sm text-[#6b5d54]">{text}</div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  imageUrl,
  fallback,
}: {
  title: string;
  imageUrl: string | null;
  fallback: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-3xl border border-[#eadfcb] bg-[#faf6ef] p-4">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white cursor-pointer" onClick={() => imageUrl && setIsModalOpen(true)}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-[400px] w-full object-contain hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="flex h-[400px] items-center justify-center px-6 text-center text-sm text-[#6b5d54]">
              {fallback}
            </div>
          )}
        </div>
        {imageUrl && (
          <div className="mt-2 text-xs text-[#6b5d54] text-center">
            Click to view full size
          </div>
        )}
      </div>

      {isModalOpen && imageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setIsModalOpen(false)}>
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-full object-contain"
            />
            <button
              className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function LockedPreviewCard({
  title,
  imageUrl,
  fallback,
}: {
  title: string;
  imageUrl: string | null;
  fallback: string;
}) {
  return (
    <div className="rounded-3xl border border-[#eadfcb] bg-[#faf6ef] p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3 overflow-hidden rounded-2xl bg-white">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-[400px] w-full object-contain"
          />
        ) : (
          <div className="flex h-[400px] items-center justify-center px-6 text-center text-sm text-[#6b5d54]">
            {fallback}
          </div>
        )}
      </div>
    </div>
  );
}

function StepRow({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
        {number}
      </div>
      <div>{text}</div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ? "border-[#d4a574] bg-[#fff7eb]" : "border-[#eadfcb]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a1614] text-white">
          {icon}
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-[#6b5d54]">{text}</div>
        </div>
      </div>
    </button>
  );
}

function Input({
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
      <div className="mb-2 text-sm font-semibold">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none transition focus:border-[#c89860]"
      />
    </label>
  );
}

function TextAreaInput({
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
      <div className="mb-2 text-sm font-semibold">{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none transition focus:border-[#c89860]"
      />
    </label>
  );
}

function SelectInput({
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
      <div className="mb-2 text-sm font-semibold">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none transition focus:border-[#c89860]"
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
