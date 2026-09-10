"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, Calendar, CheckCircle, DollarSign,
  ExternalLink, Loader2, RefreshCw, RotateCcw, Video, XCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type VideoInfluencer = { id: string; name: string | null; email: string; image: string | null };
type VideoProduct    = { id: string; name: string; imageUrl: string | null; basePriceCents: number };
type VideoPayment    = { id: string; status: string; amountCents: number; paymentRef: string | null } | null;
type VideoTask = {
  id: string;
  influencerId: string;
  application: { agreedRate: number | null; agreedAmount: number | null; product: VideoProduct };
  payment: VideoPayment;
};
type VideoItem = {
  id: string; title: string; description: string | null; videoUrl: string;
  thumbnailUrl: string | null; status: string; adminComment: string | null;
  isPublic: boolean; approvedAt: string | null; createdAt: string;
  influencer: VideoInfluencer;
  task: VideoTask;
};

type PayInfluencer = { id: string; name: string | null; email: string };
type Payment = {
  id: string; amountCents: number; status: string; paymentRef: string | null;
  paidAt: string | null; createdAt: string; notes: string | null;
  influencer: PayInfluencer;
  task: {
    application: {
      agreedRate: number | null; agreedAmount: number | null;
      product: { name: string; imageUrl: string | null };
    };
  };
};
type MonthGroup = { total: number; count: number; paid: number; pending: number; approved: number; failed: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

const money   = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const monthOf = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });

function calcCommission(app: { agreedAmount: number | null; agreedRate: number | null }, basePriceCents: number) {
  if (app.agreedAmount != null) return app.agreedAmount;
  if (app.agreedRate   != null) return Math.round(app.agreedRate * basePriceCents);
  return 0;
}

const VIDEO_SC: Record<string, string> = {
  PENDING_REVIEW:     "bg-amber-50 text-amber-700 border-amber-200",
  REVISION_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  APPROVED:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED:           "bg-red-50 text-red-700 border-red-200",
  PUBLISHED:          "bg-blue-50 text-blue-700 border-blue-200",
};

const PAY_SC: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: "Pending review", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PAID:     { label: "Paid",           cls: "bg-blue-50 text-blue-700 border-blue-200" },
  FAILED:   { label: "Refunded",       cls: "bg-red-50 text-red-700 border-red-200" },
};

// ── Video Review tab ──────────────────────────────────────────────────────────

function VideoReviewTab({ onPaymentsUpdate }: { onPaymentsUpdate: () => void }) {
  const [videos,       setVideos]       = useState<VideoItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState<string | null>(null);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [comments,     setComments]     = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${statusFilter}` : "";
      const d = await (await fetch(`/api/admin/videos${q}`)).json();
      setVideos(d.videos || []);
      setError("");
    } catch { setError("Failed to load."); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const update = async (id: string, payload: Record<string, unknown>) => {
    setSaving(id);
    try {
      const res  = await fetch(`/api/admin/videos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      const msg = data.commissionCreated
        ? "Video approved — commission payment queued. Go to Payments tab to review."
        : "Video updated.";
      setSuccess(msg);
      setTimeout(() => setSuccess(""), 5000);
      await load();
      if (data.commissionCreated) onPaymentsUpdate();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed."); }
    finally { setSaving(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#6b5d54]">Review submissions — approving auto-queues a commission payment.</p>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]">
            <option value="">All</option>
            {["PENDING_REVIEW","REVISION_REQUESTED","APPROVED","REJECTED","PUBLISHED"].map((s) =>
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <button onClick={() => void load()} className="rounded-xl border border-[#eadfcb] px-3 py-2.5 text-[#1a1614] hover:bg-[#f8f1e6]">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error   && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="overflow-hidden rounded-[1.25rem] border border-[#eadfcb]">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#6b5d54]">
            <Loader2 className="h-4 w-4 animate-spin" />Loading videos…
          </div>
        ) : videos.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6b5d54]">No videos found.</div>
        ) : (
          <div className="divide-y divide-[#eadfcb]">
            {videos.map((v) => {
              const sc         = VIDEO_SC[v.status] ?? "bg-gray-50 text-gray-600 border-gray-200";
              const isExpanded = expandedId === v.id;
              const autoCalc   = calcCommission(v.task.application, v.task.application.product.basePriceCents);

              return (
                <div key={v.id} className="bg-white">
                  <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_1fr_140px_100px] md:items-center">
                    {/* Thumbnail + info */}
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-20 shrink-0 overflow-hidden rounded-xl border border-[#eadfcb] bg-[#faf6ef]">
                        {v.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1a1614]">{v.title}</p>
                        <p className="text-xs text-[#8c7764]">{v.influencer.name || v.influencer.email}</p>
                        <p className="text-xs text-[#a89a8e]">{v.task.application.product.name}</p>
                      </div>
                    </div>

                    {/* Commission preview */}
                    <div className="text-xs">
                      {v.task.payment ? (
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${PAY_SC[v.task.payment.status]?.cls ?? ""}`}>
                          {money(v.task.payment.amountCents)} · {PAY_SC[v.task.payment.status]?.label ?? v.task.payment.status}
                        </span>
                      ) : autoCalc > 0 ? (
                        <span className="text-[#a89a8e]">~{money(autoCalc)} on approve</span>
                      ) : (
                        <span className="text-[#a89a8e]">No commission set</span>
                      )}
                      <div className="mt-0.5 text-[#a89a8e]">{new Date(v.createdAt).toLocaleDateString()}</div>
                    </div>

                    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${sc}`}>
                      {v.status.replace(/_/g, " ")}
                    </span>

                    <button onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      className="rounded-xl border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#1a1614] hover:bg-[#f8f1e6]">
                      {isExpanded ? "Collapse" : "Review"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 border-t border-[#eadfcb] bg-[#faf6ef] px-5 py-5">
                      <a href={v.videoUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-sm font-semibold text-[#1a1614] hover:bg-[#f8f1e6]">
                        <ExternalLink className="h-4 w-4" />Watch video
                      </a>

                      {v.description && <p className="text-sm text-[#6b5d54]">{v.description}</p>}

                      {/* Comment */}
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Review comment (shown to influencer)</p>
                        <textarea rows={2} value={comments[v.id] ?? v.adminComment ?? ""}
                          onChange={(e) => setComments((p) => ({ ...p, [v.id]: e.target.value }))}
                          placeholder="Feedback, revision notes, or approval message…"
                          className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2 text-sm outline-none focus:border-[#d4a574]" />
                      </div>

                      {/* Commission hint */}
                      {autoCalc > 0 && !v.task.payment && (
                        <div className="flex items-center gap-2 rounded-xl border border-[#eadfcb] bg-white px-3 py-2 text-xs text-[#6b5d54]">
                          <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          Auto-commission on approve:
                          <strong className="text-[#1a1614]">{money(autoCalc)}</strong>
                          <span className="text-[#a89a8e]">— adjust in the Payments tab</span>
                        </div>
                      )}
                      {v.task.payment && (
                        <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${PAY_SC[v.task.payment.status]?.cls ?? ""}`}>
                          <DollarSign className="h-3.5 w-3.5" />
                          Commission {money(v.task.payment.amountCents)} — {PAY_SC[v.task.payment.status]?.label ?? v.task.payment.status}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {v.status !== "APPROVED" && v.status !== "PUBLISHED" && (
                          <button disabled={saving === v.id}
                            onClick={() => void update(v.id, { status: "APPROVED", isPublic: true, adminComment: comments[v.id] || undefined })}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60">
                            {saving === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                            Approve
                          </button>
                        )}
                        {v.status === "APPROVED" && (
                          <button disabled={saving === v.id}
                            onClick={() => void update(v.id, { status: "PUBLISHED", isPublic: true })}
                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60">
                            Publish publicly
                          </button>
                        )}
                        <button disabled={saving === v.id}
                          onClick={() => void update(v.id, { status: "REVISION_REQUESTED", adminComment: comments[v.id] || undefined })}
                          className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60">
                          Request revision
                        </button>
                        <button disabled={saving === v.id}
                          onClick={() => void update(v.id, { status: "REJECTED", adminComment: comments[v.id] || undefined })}
                          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60">
                          <XCircle className="h-3 w-3" />Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Commission Payments tab ───────────────────────────────────────────────────

function CommissionPaymentsTab({ refreshKey }: { refreshKey: number }) {
  const [payments,     setPayments]     = useState<Payment[]>([]);
  const [monthly,      setMonthly]      = useState<Record<string, MonthGroup>>({});
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState<string | null>(null);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [payRefs,      setPayRefs]      = useState<Record<string, string>>({});
  const [amtEdits,     setAmtEdits]     = useState<Record<string, string>>({});
  const [refundConfirm, setRefundConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await (await fetch("/api/admin/ad-payments")).json();
      setPayments(d.payments || []);
      setMonthly(d.monthly || {});
      setError("");
    } catch { setError("Failed to load payments."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load, refreshKey]);

  const act = async (id: string, action: string, extra?: Record<string, unknown>) => {
    setSaving(id);
    try {
      const res  = await fetch(`/api/admin/ad-payments/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      const msgs: Record<string, string> = {
        approve:       "Payment approved — ready to issue check.",
        pay:           "Check issued! Payment marked as paid.",
        refund:        "Payment refunded / clawed back.",
        update_amount: "Amount updated.",
      };
      setSuccess(msgs[action] ?? "Updated.");
      setRefundConfirm(null);
      setTimeout(() => setSuccess(""), 5000);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed."); }
    finally { setSaving(null); }
  };

  // Client-side filter
  const filtered = statusFilter ? payments.filter((p) => p.status === statusFilter) : payments;

  // Unique month keys in order (payments are sorted desc so this is most-recent first)
  const monthKeys = [...new Set(filtered.map((p) => monthOf(p.createdAt)))];
  const byMonth: Record<string, Payment[]> = {};
  for (const p of filtered) {
    const k = monthOf(p.createdAt);
    (byMonth[k] ??= []).push(p);
  }

  // Summary totals (always over ALL payments, not filtered)
  const totalPending  = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amountCents, 0);
  const totalApproved = payments.filter((p) => p.status === "APPROVED").reduce((s, p) => s + p.amountCents, 0);
  const totalPaid     = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amountCents, 0);
  const pendingCount  = payments.filter((p) => p.status === "PENDING").length;
  const approvedCount = payments.filter((p) => p.status === "APPROVED").length;
  const paidCount     = payments.filter((p) => p.status === "PAID").length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending review</p>
          <p className="mt-1.5 text-2xl font-bold text-amber-900">{money(totalPending)}</p>
          <p className="mt-1 text-xs text-amber-700">{pendingCount} payment{pendingCount !== 1 ? "s" : ""} awaiting approval</p>
        </div>
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved — ready to pay</p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-900">{money(totalApproved)}</p>
          <p className="mt-1 text-xs text-emerald-700">{approvedCount} check{approvedCount !== 1 ? "s" : ""} to issue</p>
        </div>
        <div className="rounded-[1.25rem] border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Total paid (all time)</p>
          <p className="mt-1.5 text-2xl font-bold text-blue-900">{money(totalPaid)}</p>
          <p className="mt-1 text-xs text-blue-700">{paidCount} check{paidCount !== 1 ? "s" : ""} issued</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[#6b5d54]">Approve commissions, issue payment checks, and manage refunds. Grouped by month.</p>
        <div className="flex shrink-0 gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]">
            <option value="">All statuses</option>
            {["PENDING","APPROVED","PAID","FAILED"].map((s) => (
              <option key={s} value={s}>{PAY_SC[s]?.label ?? s}</option>
            ))}
          </select>
          <button onClick={() => void load()} className="rounded-xl border border-[#eadfcb] px-3 py-2.5 text-[#1a1614] hover:bg-[#f8f1e6]">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error   && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#6b5d54]">
          <Loader2 className="h-4 w-4 animate-spin" />Loading payments…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-[#6b5d54]">No commission payments yet.</div>
      ) : (
        <div className="space-y-6">
          {monthKeys.map((mk) => {
            const rows = byMonth[mk] ?? [];
            const mg   = monthly[mk]; // full stats for this month (from server)
            return (
              <div key={mk} className="overflow-hidden rounded-[1.25rem] border border-[#eadfcb]">

                {/* Month header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfcb] bg-[#faf6ef] px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#8c7764]" />
                    <p className="font-bold text-[#1a1614]">{mk}</p>
                    {mg && <span className="text-xs text-[#a89a8e]">· {mg.count} payment{mg.count !== 1 ? "s" : ""}</span>}
                  </div>
                  {mg && (
                    <div className="flex flex-wrap gap-4 text-xs">
                      {mg.pending  > 0 && <span className="font-semibold text-amber-700">{money(mg.pending)} pending</span>}
                      {mg.approved > 0 && <span className="font-semibold text-emerald-700">{money(mg.approved)} approved</span>}
                      {mg.paid     > 0 && <span className="font-semibold text-blue-700">{money(mg.paid)} paid</span>}
                      {mg.failed   > 0 && <span className="font-semibold text-red-600">{money(mg.failed)} refunded</span>}
                      <span className="font-bold text-[#1a1614]">Total {money(mg.total)}</span>
                    </div>
                  )}
                </div>

                {/* Payment rows */}
                <div className="divide-y divide-[#eadfcb] bg-white">
                  {rows.map((pay) => {
                    const ps         = PAY_SC[pay.status] ?? { label: pay.status, cls: "bg-gray-50 text-gray-600 border-gray-200" };
                    const isExpanded = expandedId === pay.id;

                    return (
                      <div key={pay.id}>
                        <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_100px_140px_100px] md:items-center">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1614] text-sm font-bold text-white">
                              {(pay.influencer.name || pay.influencer.email)[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#1a1614]">
                                {pay.influencer.name || pay.influencer.email}
                              </p>
                              <p className="truncate text-xs text-[#8c7764]">{pay.task.application.product.name}</p>
                              <p className="text-xs text-[#a89a8e]">{fmtDate(pay.createdAt)}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-[#1a1614]">{money(pay.amountCents)}</p>
                          <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${ps.cls}`}>{ps.label}</span>
                          <button onClick={() => setExpandedId(isExpanded ? null : pay.id)}
                            className="rounded-xl border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#1a1614] hover:bg-[#f8f1e6]">
                            {isExpanded ? "Collapse" : "Manage"}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-[#eadfcb] bg-[#faf6ef] px-5 py-5">
                            <div className="grid gap-5 md:grid-cols-2">

                              {/* Payment details */}
                              <div className="space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c7764]">Payment details</p>
                                <div className="space-y-1.5 rounded-xl border border-[#eadfcb] bg-white p-4 text-xs text-[#6b5d54]">
                                  <p><span className="font-semibold">Influencer:</span> {pay.influencer.name || pay.influencer.email}</p>
                                  <p><span className="font-semibold">Product:</span> {pay.task.application.product.name}</p>
                                  <p><span className="font-semibold">Amount:</span> <span className="font-bold text-[#1a1614]">{money(pay.amountCents)}</span></p>
                                  <p><span className="font-semibold">Status:</span> {ps.label}</p>
                                  {pay.paymentRef && <p><span className="font-semibold">Payment ref:</span> {pay.paymentRef}</p>}
                                  {pay.paidAt    && <p><span className="font-semibold">Paid on:</span> {fmtDate(pay.paidAt)}</p>}
                                  {pay.notes     && <p><span className="font-semibold">Notes:</span> {pay.notes}</p>}
                                </div>

                                {/* Amount adjustment (PENDING or APPROVED only) */}
                                {(pay.status === "PENDING" || pay.status === "APPROVED") && (
                                  <div>
                                    <p className="mb-1.5 text-[11px] font-semibold text-[#8c7764]">Adjust commission amount</p>
                                    <div className="flex gap-2">
                                      <div className="relative flex-1">
                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8c7764]">$</span>
                                        <input
                                          type="number" min="0" step="0.01"
                                          value={amtEdits[pay.id] ?? (pay.amountCents / 100).toFixed(2)}
                                          onChange={(e) => setAmtEdits((p) => ({ ...p, [pay.id]: e.target.value }))}
                                          className="w-full rounded-xl border border-[#eadfcb] bg-white py-2.5 pl-7 pr-3 text-sm outline-none focus:border-[#d4a574]"
                                        />
                                      </div>
                                      <button
                                        disabled={saving === pay.id}
                                        onClick={() => void act(pay.id, "update_amount", { amountCents: Math.round(Number(amtEdits[pay.id] ?? pay.amountCents / 100) * 100) })}
                                        className="rounded-xl border border-[#eadfcb] bg-white px-4 py-2.5 text-xs font-semibold text-[#1a1614] hover:bg-[#f8f1e6] disabled:opacity-60">
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c7764]">Actions</p>

                                {/* PENDING → APPROVED */}
                                {pay.status === "PENDING" && (
                                  <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <p className="text-xs text-emerald-800">
                                      Verify the commission amount is correct, then approve to prepare for payment.
                                    </p>
                                    <button
                                      disabled={saving === pay.id}
                                      onClick={() => void act(pay.id, "approve")}
                                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                                      {saving === pay.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                      Approve commission
                                    </button>
                                  </div>
                                )}

                                {/* APPROVED → PAID (Issue Check) */}
                                {pay.status === "APPROVED" && (
                                  <div className="space-y-2 rounded-xl border border-[#d4a574]/40 bg-[#d4a574]/5 p-4">
                                    <p className="text-xs font-semibold text-[#8c7764]">
                                      Enter your check number or bank transfer reference, then mark as paid.
                                    </p>
                                    <input
                                      type="text"
                                      value={payRefs[pay.id] ?? ""}
                                      onChange={(e) => setPayRefs((p) => ({ ...p, [pay.id]: e.target.value }))}
                                      placeholder="Check #, wire ref, or PayPal transaction ID…"
                                      className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                                    />
                                    <button
                                      disabled={saving === pay.id || !payRefs[pay.id]?.trim()}
                                      onClick={() => void act(pay.id, "pay", { paymentRef: payRefs[pay.id] })}
                                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1614] py-2.5 text-sm font-semibold text-white hover:bg-[#2a2624] disabled:cursor-not-allowed disabled:opacity-50">
                                      {saving === pay.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                                      Issue check — Mark as paid
                                    </button>
                                  </div>
                                )}

                                {/* PAID → FAILED (Refund / Clawback) */}
                                {pay.status === "PAID" && (
                                  <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
                                    {refundConfirm === pay.id ? (
                                      <>
                                        <p className="flex items-center gap-1.5 text-xs font-semibold text-red-800">
                                          <AlertTriangle className="h-3.5 w-3.5" />Confirm refund / clawback of {money(pay.amountCents)}?
                                        </p>
                                        <div className="flex gap-2">
                                          <button
                                            disabled={saving === pay.id}
                                            onClick={() => void act(pay.id, "refund")}
                                            className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                                            {saving === pay.id ? <Loader2 className="inline h-3 w-3 animate-spin" /> : "Yes, refund"}
                                          </button>
                                          <button onClick={() => setRefundConfirm(null)}
                                            className="flex-1 rounded-xl border border-red-200 bg-white py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
                                            Cancel
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <button onClick={() => setRefundConfirm(pay.id)}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100">
                                        <RotateCcw className="h-3.5 w-3.5" />Refund / Clawback commission
                                      </button>
                                    )}
                                  </div>
                                )}

                                {pay.status === "FAILED" && (
                                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                                    This commission has been refunded / cancelled.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function AdminVideosManager() {
  const [tab,        setTab]        = useState<"videos" | "payments">("videos");
  const [paymentsKey, setPaymentsKey] = useState(0);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1.5 rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-1.5">
        <button
          onClick={() => setTab("videos")}
          className={`flex items-center gap-2 rounded-[1rem] px-5 py-2.5 text-sm font-semibold transition ${
            tab === "videos" ? "bg-[#1a1614] text-white shadow-md" : "text-[#6b5d54] hover:bg-white"
          }`}>
          <Video className="h-4 w-4" />Video Review
        </button>
        <button
          onClick={() => setTab("payments")}
          className={`flex items-center gap-2 rounded-[1rem] px-5 py-2.5 text-sm font-semibold transition ${
            tab === "payments" ? "bg-[#1a1614] text-white shadow-md" : "text-[#6b5d54] hover:bg-white"
          }`}>
          <DollarSign className="h-4 w-4" />Commission Payments
        </button>
      </div>

      {tab === "videos" && (
        <VideoReviewTab onPaymentsUpdate={() => setPaymentsKey((k) => k + 1)} />
      )}
      {tab === "payments" && (
        <CommissionPaymentsTab refreshKey={paymentsKey} />
      )}
    </div>
  );
}
