"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle, Clock, DollarSign,
  ExternalLink, Loader2, Package, RotateCcw, Truck,
  UploadCloud, Video,
} from "lucide-react";
import AgreementCard from "@/components/AgreementCard";

// ── Types ─────────────────────────────────────────────────────────────────────

type VideoSub = {
  id: string; title: string; description: string | null;
  videoUrl: string; thumbnailUrl: string | null;
  status: string; adminComment: string | null; createdAt: string;
};
type Payment = {
  id: string; status: string; amountCents: number;
  paymentRef: string | null; paidAt: string | null; notes: string | null;
};
type Task = {
  id: string; ref: string; status: string; readme: string | null; requirements: string[];
  deadline: string | null;
  application: {
    product: {
      name: string; imageUrl: string | null; description: string | null; taskRequirements: string | null;
      basePriceCents: number; commissionType: string; commissionRate: number; commissionFixed: number;
    };
    sample: {
      status: string; trackingNumber: string | null;
      carrier: string | null; shippedAt: string | null; deliveredAt: string | null; notes: string | null;
    } | null;
    agreedRate: number | null; agreedAmount: number | null;
    contactInfo?: { agreedToTerms?: boolean; agreedAt?: string | null } | null;
  };
  videos: VideoSub[];
  payment: Payment | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const pct = (r: number) => `${(r * 100).toFixed(0)}%`;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const TASK_SC: Record<string, string> = {
  ACTIVE:             "bg-blue-50 text-blue-700 border-blue-200",
  SUBMITTED:          "bg-amber-50 text-amber-700 border-amber-200",
  REVISION_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  APPROVED:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED:          "bg-purple-50 text-purple-700 border-purple-200",
  CANCELLED:          "bg-gray-100 text-gray-600 border-gray-200",
};
const VIDEO_SC: Record<string, string> = {
  PENDING_REVIEW:     "bg-amber-50 text-amber-700 border-amber-200",
  REVISION_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  APPROVED:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED:           "bg-red-50 text-red-700 border-red-200",
  PUBLISHED:          "bg-blue-50 text-blue-700 border-blue-200",
};

const PAY_LABEL: Record<string, string> = {
  PENDING:  "Pending admin approval",
  APPROVED: "Approved — check being prepared",
  PAID:     "Paid",
  FAILED:   "Refunded",
};

// ── Shipment timeline ─────────────────────────────────────────────────────────

const SHIP_STEPS = [
  { key: "PREPARING",  label: "Preparing",  desc: "Brand is packing your sample" },
  { key: "SHIPPED",    label: "Shipped",    desc: "Package handed to carrier" },
  { key: "IN_TRANSIT", label: "In transit", desc: "On its way to you" },
  { key: "DELIVERED",  label: "Delivered",  desc: "Sample received — start filming!" },
];

function ShipmentTimeline({ sample }: { sample: NonNullable<Task["application"]["sample"]> }) {
  const currentIdx = SHIP_STEPS.findIndex((s) => s.key === sample.status);
  const isFailed   = sample.status === "FAILED";

  if (isFailed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <Truck className="h-4 w-4 shrink-0" />
        Shipment failed. Contact the brand for a replacement.
        {sample.notes && <span className="ml-1 text-xs">({sample.notes})</span>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-px bg-[#eadfcb]" />
        <div className="space-y-0">
          {SHIP_STEPS.map((step, idx) => {
            const done   = idx <= currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.key} className="relative flex items-start gap-4 pb-5 last:pb-0">
                <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  done ? "border-[#d4a574] bg-[#d4a574]" : "border-[#eadfcb] bg-white"
                }`}>
                  {done
                    ? <CheckCircle className="h-4 w-4 text-white" />
                    : <span className="h-2 w-2 rounded-full bg-[#eadfcb]" />}
                </div>
                <div className="pt-0.5">
                  <p className={`text-sm font-semibold ${done ? "text-[#1a1614]" : "text-[#a89a8e]"}`}>
                    {step.label}
                    {active && <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-[#d4a574] align-middle" />}
                  </p>
                  <p className={`text-xs ${done ? "text-[#6b5d54]" : "text-[#c0b4aa]"}`}>{step.desc}</p>
                  {active && (
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#8c7764]">
                      {sample.carrier       && <span>{sample.carrier}</span>}
                      {sample.trackingNumber && <span className="font-mono text-[#1a1614]">{sample.trackingNumber}</span>}
                      {sample.shippedAt  && step.key === "SHIPPED"   && <span>Shipped {fmt(sample.shippedAt)}</span>}
                      {sample.deliveredAt && step.key === "DELIVERED" && <span>Delivered {fmt(sample.deliveredAt)}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {sample.notes && <p className="text-xs text-[#8c7764]">Note: {sample.notes}</p>}
    </div>
  );
}

// ── Commission panel ──────────────────────────────────────────────────────────

const COMM_STEPS = [
  { key: "submitted", label: "Video submitted",     desc: "Awaiting brand review" },
  { key: "reviewed",  label: "Video approved",       desc: "Brand accepted your content" },
  { key: "approved",  label: "Commission confirmed", desc: "Payment amount verified" },
  { key: "paid",      label: "Check issued",         desc: "Payment sent to you" },
];

function commissionStep(task: Task): number {
  if (!task.videos.length) return -1;
  const latestVideo = task.videos[0];
  if (task.payment?.status === "PAID")     return 3;
  if (task.payment?.status === "APPROVED") return 2;
  if (task.payment?.status === "PENDING")  return 1;
  if (latestVideo.status === "APPROVED" || latestVideo.status === "PUBLISHED") return 1;
  return 0;
}

function CommissionPanel({ task, onDispute }: { task: Task; onDispute: () => void }) {
  const step    = commissionStep(task);
  const payment = task.payment;
  const hasDispute = payment?.notes?.includes("DISPUTE REQUEST:") ?? false;

  const commission = payment
    ? money(payment.amountCents)
    : task.application.agreedAmount != null
    ? money(task.application.agreedAmount)
    : task.application.agreedRate != null
    ? `${pct(task.application.agreedRate)} of sale`
    : null;

  if (step < 0) return null;

  return (
    <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fdf8f1]">
          <DollarSign className="h-4 w-4 text-[#d4a574]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1a1614]">Commission &amp; payment</h2>
          <p className="text-xs text-[#8c7764]">Track your earnings through the review and payment process</p>
        </div>
      </div>

      {/* Commission amount */}
      {commission && (
        <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
          payment?.status === "PAID"
            ? "border-blue-200 bg-blue-50"
            : payment?.status === "APPROVED"
            ? "border-emerald-200 bg-emerald-50"
            : payment?.status === "FAILED"
            ? "border-red-200 bg-red-50"
            : "border-[#d4a574]/30 bg-[#d4a574]/5"
        }`}>
          <div>
            <p className={`text-2xl font-bold ${
              payment?.status === "PAID"     ? "text-blue-900" :
              payment?.status === "APPROVED" ? "text-emerald-900" :
              payment?.status === "FAILED"   ? "text-red-800" :
              "text-[#1a1614]"
            }`}>{commission}</p>
            <p className="mt-0.5 text-xs text-[#8c7764]">
              {payment ? (PAY_LABEL[payment.status] ?? payment.status) : "Estimated commission"}
            </p>
          </div>
          {payment?.status === "PAID" && (
            <div className="text-right text-xs text-blue-700">
              {payment.paymentRef && <p className="font-mono font-semibold">Ref: {payment.paymentRef}</p>}
              {payment.paidAt && <p>{fmt(payment.paidAt)}</p>}
            </div>
          )}
        </div>
      )}

      {/* 4-step progress */}
      <div className="relative">
        {/* Connector bar */}
        <div className="absolute left-[15px] top-4 h-[calc(100%-2.5rem)] w-px bg-[#eadfcb]" />
        <div className="space-y-0">
          {COMM_STEPS.map((s, idx) => {
            const done   = idx <= step;
            const active = idx === step;
            return (
              <div key={s.key} className="relative flex items-start gap-4 pb-5 last:pb-0">
                <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? idx === 3
                      ? "border-blue-400 bg-blue-400"
                      : "border-[#d4a574] bg-[#d4a574]"
                    : "border-[#eadfcb] bg-white"
                }`}>
                  {done
                    ? idx === 3
                      ? <DollarSign className="h-4 w-4 text-white" />
                      : <CheckCircle className="h-4 w-4 text-white" />
                    : active
                    ? <Clock className="h-3.5 w-3.5 text-[#d4a574]" />
                    : <span className="h-2 w-2 rounded-full bg-[#eadfcb]" />}
                </div>
                <div className="pt-0.5">
                  <p className={`text-sm font-semibold ${done || active ? "text-[#1a1614]" : "text-[#a89a8e]"}`}>
                    {s.label}
                    {active && <span className="ml-2 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4a574] align-middle" />}
                  </p>
                  <p className={`text-xs ${done || active ? "text-[#6b5d54]" : "text-[#c0b4aa]"}`}>{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispute / Refund section */}
      {payment && payment.status !== "FAILED" && (
        <div className="border-t border-[#eadfcb] pt-4">
          {hasDispute ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">Dispute submitted</p>
                <p className="text-xs text-amber-700">Our team will review your request and get back to you shortly.</p>
              </div>
            </div>
          ) : payment.status === "PAID" ? (
            <p className="text-xs text-[#a89a8e]">
              Payment has been issued. To dispute a paid commission, contact{" "}
              <a href="mailto:support@adstudio.com" className="text-[#d4a574] underline">support@adstudio.com</a>.
            </p>
          ) : (
            <button
              onClick={onDispute}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />Request refund / dispute commission
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dispute form ──────────────────────────────────────────────────────────────

function DisputeModal({
  taskId,
  onClose,
  onSuccess,
}: {
  taskId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason,     setReason]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const submit = async () => {
    if (!reason.trim()) { setError("Please describe your issue."); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/influencer/tasks/${taskId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit.");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-[#1a1614]">Request refund / dispute</h3>
            <p className="text-xs text-[#8c7764]">Describe your issue and we&apos;ll review it within 1–2 business days</p>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
              Reason for dispute
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue — e.g. incorrect commission amount, wrong product received, want to cancel the deal…"
              className="w-full rounded-2xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm outline-none focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/15"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <strong>Note:</strong> Submitting a dispute will flag your commission for admin review. You&apos;ll be notified by email once it&apos;s resolved.
          </div>

          <div className="flex gap-3">
            <button
              disabled={submitting}
              onClick={() => void submit()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1a1614] py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {submitting ? "Submitting…" : "Submit dispute"}
            </button>
            <button
              onClick={onClose}
              className="rounded-2xl border border-[#eadfcb] px-5 py-3 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TaskDetail({ taskId }: { taskId: string }) {
  const [task,       setTask]       = useState<Task | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const videoFileRef = useRef<HTMLInputElement | null>(null);
  const thumbFileRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({ title: "", description: "", videoUrl: "", thumbnailUrl: "" });

  const loadTask = () => {
    setLoading(true);
    fetch(`/api/influencer/tasks/${taskId}`)
      .then((r) => r.json())
      .then(setTask)
      .catch(() => setError("Failed to load task."))
      .finally(() => setLoading(false));
  };
  useEffect(loadTask, [taskId]);

  const uploadFile = async (file: File, type: "video" | "thumb") => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/influencer/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      if (type === "video") setForm((f) => ({ ...f, videoUrl: json.url }));
      else setForm((f) => ({ ...f, thumbnailUrl: json.url }));
      setSuccess(`${type === "video" ? "Video" : "Thumbnail"} uploaded successfully.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submitVideo = async () => {
    if (!form.title || !form.videoUrl) { setError("Please provide a title and video URL."); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/influencer/tasks/${taskId}/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit.");
      setSuccess("Video submitted for review! The brand will respond shortly.");
      setForm({ title: "", description: "", videoUrl: "", thumbnailUrl: "" });
      loadTask();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[#6b5d54]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading task…
      </div>
    );
  }
  if (!task) {
    return <div className="py-20 text-center text-sm text-red-600">Task not found.</div>;
  }

  const { application } = task;
  const canSubmit = !["CANCELLED", "COMPLETED"].includes(task.status);
  const commission = application.agreedAmount != null
    ? money(application.agreedAmount)
    : application.agreedRate != null
    ? `${pct(application.agreedRate)} of sale`
    : null;

  return (
    <>
      {showDispute && (
        <DisputeModal
          taskId={taskId}
          onClose={() => setShowDispute(false)}
          onSuccess={() => {
            setShowDispute(false);
            setSuccess("Dispute submitted. Our team will review it within 1–2 business days.");
            loadTask();
          }}
        />
      )}

      <div className="space-y-5">
        {error   && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold">!</span>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />{success}
          </div>
        )}

        {/* ── Header card ── */}
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6">
          <div className="flex gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]">
              {application.product.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={application.product.imageUrl} alt={application.product.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-[#1a1614]">{application.product.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${TASK_SC[task.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {task.status.replace(/_/g, " ")}
                </span>
                {commission && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Earn {commission}
                  </span>
                )}
                {task.deadline && (
                  <span className="text-xs text-[#8c7764]">Due {fmt(task.deadline)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Shipment timeline ── */}
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fdf8f1]">
              <Package className="h-4 w-4 text-[#d4a574]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1a1614]">Sample shipment</h2>
              <p className="text-xs text-[#8c7764]">Track your free product sample</p>
            </div>
          </div>
          {application.sample ? (
            <ShipmentTimeline sample={application.sample} />
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#d9ccb9] bg-[#faf6ef] px-5 py-4">
              <Package className="h-5 w-5 shrink-0 text-[#c0b4aa]" />
              <div>
                <p className="text-sm font-semibold text-[#6b5d54]">Awaiting preparation</p>
                <p className="text-xs text-[#a89a8e]">The brand will start packing and update tracking here.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Task brief ── */}
        {(task.readme || task.requirements.length > 0 || application.product.taskRequirements) && (
          <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fdf8f1]">
                <Video className="h-4 w-4 text-[#d4a574]" />
              </div>
              <h2 className="text-base font-bold text-[#1a1614]">Task brief</h2>
            </div>
            {task.readme && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#1a1614]">{task.readme}</p>
            )}
            {!task.readme && application.product.taskRequirements && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#1a1614]">{application.product.taskRequirements}</p>
            )}
            {task.requirements.length > 0 && (
              <div className="rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Requirements checklist</p>
                <ul className="space-y-2">
                  {task.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#1a1614]">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Submitted videos ── */}
        {task.videos.length > 0 && (
          <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 space-y-4">
            <h2 className="text-base font-bold text-[#1a1614]">Your submissions</h2>
            <div className="space-y-3">
              {task.videos.map((v) => {
                const vc = VIDEO_SC[v.status] ?? "bg-gray-50 text-gray-600 border-gray-200";
                return (
                  <div key={v.id} className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#1a1614]">{v.title}</p>
                        <p className="text-xs text-[#a89a8e]">{new Date(v.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${vc}`}>
                        {v.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {v.adminComment && (
                      <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs text-orange-800">
                        <span className="font-semibold">Brand feedback:</span> {v.adminComment}
                      </div>
                    )}
                    <a href={v.videoUrl} target="_blank" rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#8c7764] hover:text-[#1a1614]">
                      <ExternalLink className="h-3.5 w-3.5" />View video
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Commission & payment panel ── */}
        <CommissionPanel task={task} onDispute={() => setShowDispute(true)} />

        {/* ── Partnership agreement ── */}
        <AgreementCard
          product={application.product}
          agreedAt={application.contactInfo?.agreedAt}
        />

        {/* ── Submit video ── */}
        {canSubmit && (
          <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fdf8f1]">
                <UploadCloud className="h-4 w-4 text-[#d4a574]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1a1614]">Submit your video</h2>
                <p className="text-xs text-[#8c7764]">Upload or link your ad video for brand review</p>
              </div>
            </div>

            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Video title"
              className="w-full rounded-2xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm outline-none focus:border-[#d4a574]"
            />
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description (optional)"
              className="w-full rounded-2xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm outline-none focus:border-[#d4a574]"
            />

            {/* Video input */}
            <div className="rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Video file or URL</p>
                <button type="button" disabled={uploading} onClick={() => videoFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfcb] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1614] hover:bg-[#f8f1e6] disabled:opacity-60">
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                  Upload file
                </button>
              </div>
              <input ref={videoFileRef} type="file" accept="video/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f, "video"); e.currentTarget.value = ""; }} />
              {form.videoUrl
                ? <p className="text-xs font-medium text-emerald-700 break-all">✓ {form.videoUrl}</p>
                : <input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                    placeholder="or paste YouTube / Vimeo / direct URL"
                    className="w-full rounded-xl border border-[#eadfcb] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]" />
              }
            </div>

            {/* Thumbnail input */}
            <div className="rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
                  Thumbnail <span className="font-normal normal-case text-[#a89a8e]">(optional)</span>
                </p>
                <button type="button" disabled={uploading} onClick={() => thumbFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfcb] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1614] hover:bg-[#f8f1e6] disabled:opacity-60">
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                  Upload image
                </button>
              </div>
              <input ref={thumbFileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f, "thumb"); e.currentTarget.value = ""; }} />
              {form.thumbnailUrl
                ? <p className="text-xs font-medium text-emerald-700 break-all">✓ {form.thumbnailUrl}</p>
                : <input value={form.thumbnailUrl} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                    placeholder="or paste thumbnail image URL"
                    className="w-full rounded-xl border border-[#eadfcb] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]" />
              }
            </div>

            <button
              disabled={submitting || uploading}
              onClick={() => void submitVideo()}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1a1614] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#2a2624] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              Submit video for review
            </button>
          </div>
        )}
      </div>
    </>
  );
}
