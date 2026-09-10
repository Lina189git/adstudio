"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Palette, Clock, CheckCircle, AlertCircle, ChevronRight,
  User, Calendar, Layers, Image as ImageIcon, Loader2,
  ThumbsUp, ThumbsDown, Play, Send, RotateCcw, X,
  Bell, Briefcase, History, MessageSquare, RefreshCw,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Commission = {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  paintingType: string;
  size: string;
  surface: string;
  style: string;
  quantity: string;
  deadline: string | null;
  budget: string | null;
  notes: string | null;
  estimatedRange: string | null;
  timeline: string | null;
  status: string;
  adminNotes: string | null;
  referenceImageUrls: string[];
  assignedArtist: { id: string; name: string | null; email: string } | null;
  workUpdates: { id: string; step: string; createdAt: string }[];
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  portrait: "Portrait", landscape: "Landscape", interior: "Interior",
  event: "Event", pet: "Pet Portrait", custom: "Custom",
};

const SIZE_LABELS: Record<string, string> = {
  small: "Small (8×10″)", medium: "Medium (12×16″)",
  large: "Large (18×24″)", mural: "Mural (36×48+)",
};

const STEP_LABELS: Record<string, string> = {
  sketch: "Sketch", base_coat: "Base Coat", main_elements: "Main Elements",
  details: "Details", finishing: "Finishing", final: "Final",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ASSIGNED:    { label: "New Assignment",  color: "text-orange-700 bg-orange-50 border-orange-200",  icon: Bell },
  IN_PROGRESS: { label: "In Progress",    color: "text-[#a87945] bg-[#fdf8f1] border-[#d4a574]",   icon: Palette },
  REVIEW:      { label: "Under Review",   color: "text-indigo-700 bg-indigo-50 border-indigo-200",  icon: AlertCircle },
  REVISION:    { label: "Needs Revision", color: "text-red-700 bg-red-50 border-red-200",           icon: RotateCcw },
  COMPLETED:   { label: "Completed",      color: "text-green-700 bg-green-50 border-green-200",     icon: CheckCircle },
  CANCELLED:   { label: "Cancelled",      color: "text-gray-500 bg-gray-50 border-gray-200",        icon: X },
};

function fmt(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Decline Modal ────────────────────────────────────────────────────────────

function DeclineModal({
  commission,
  onClose,
  onDeclined,
}: {
  commission: Commission;
  onClose: () => void;
  onDeclined: () => void;
}) {
  const [reason, setReason]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/artist/commissions/${commission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline", reason: reason.trim() || "Unable to take this commission." }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to decline.");
      return;
    }
    onDeclined();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1a1614]">Decline Commission</h2>
            <p className="mt-1 text-sm text-[#8c7764]">
              <span className="font-mono">{commission.reference}</span> will be returned to the admin queue.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#8c7764] hover:bg-[#f8f1e6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-4 text-sm text-[#6b5d54]">
          <p className="font-semibold text-[#1a1614]">
            {TYPE_LABELS[commission.paintingType] ?? commission.paintingType} — {commission.customerName}
          </p>
          <p className="mt-1">{SIZE_LABELS[commission.size] ?? commission.size} · {commission.style}</p>
          {commission.deadline && (
            <p className="mt-1 font-semibold text-orange-600">Due: {commission.deadline}</p>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
            Reason (optional — helps admin reassign better)
          </span>
          <textarea
            ref={textareaRef}
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. Schedule conflict, outside my specialty, too short deadline…"
            className="w-full rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none focus:border-[#d4a574]"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-[#eadfcb] py-3 text-sm font-semibold text-[#6b5d54] hover:bg-[#f8f1e6]"
          >
            Keep It
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
            Decline Commission
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inbox card (new assignment) ─────────────────────────────────────────────

function InboxCard({
  commission,
  onAccept,
  onDecline,
  accepting,
}: {
  commission: Commission;
  onAccept: (id: string) => void;
  onDecline: (c: Commission) => void;
  accepting: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border-2 border-orange-200 bg-white shadow-[0_4px_24px_rgba(251,146,60,0.12)] transition hover:shadow-[0_8px_32px_rgba(251,146,60,0.2)]">
      {/* Header strip */}
      <div className="flex items-center gap-3 bg-orange-50 px-6 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100">
          <Bell className="h-3.5 w-3.5 text-orange-600" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
          New Commission — Action Required
        </span>
        <span className="ml-auto font-mono text-xs text-orange-500">{commission.reference}</span>
      </div>

      <div className="p-6">
        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1a1614]">
              {TYPE_LABELS[commission.paintingType] ?? commission.paintingType} Commission
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6b5d54]">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#d4a574]" /> {commission.customerName}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#d4a574]" />
                {SIZE_LABELS[commission.size] ?? commission.size} · {commission.style}
              </span>
              {commission.deadline && (
                <span className="flex items-center gap-1.5 font-semibold text-orange-600">
                  <Clock className="h-3.5 w-3.5" /> Due: {commission.deadline}
                </span>
              )}
            </div>
          </div>

          {commission.estimatedRange && (
            <div className="rounded-2xl bg-[#fdf8f1] px-4 py-2 text-center">
              <p className="text-[10px] text-[#8c7764]">Your fee</p>
              <p className="font-serif text-lg font-bold text-[#a87945]">{commission.estimatedRange}</p>
            </div>
          )}
        </div>

        {/* Key info grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Surface",    value: commission.surface },
            { label: "Quantity",   value: `${commission.quantity} piece${Number(commission.quantity) > 1 ? "s" : ""}` },
            { label: "Timeline",   value: commission.timeline ?? "TBD" },
            { label: "Budget",     value: commission.budget ?? "Not specified" },
          ].map(f => (
            <div key={f.label} className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8c7764]">{f.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-[#1a1614]">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Toggle extra details */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#d4a574] hover:text-[#a87945]"
        >
          {expanded ? "Hide details" : "Show customer notes & reference images"}
          <ChevronRight className={`h-3.5 w-3.5 transition ${expanded ? "rotate-90" : ""}`} />
        </button>

        {expanded && (
          <div className="mt-4 space-y-4">
            {commission.notes && (
              <div className="rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Customer Notes</p>
                <p className="text-sm leading-relaxed text-[#6b5d54]">{commission.notes}</p>
              </div>
            )}

            {commission.adminNotes && (
              <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-orange-700">Admin Notes for You</p>
                <p className="text-sm leading-relaxed text-orange-800">{commission.adminNotes}</p>
              </div>
            )}

            {commission.referenceImageUrls.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
                  Reference Images ({commission.referenceImageUrls.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {commission.referenceImageUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                       className="group relative overflow-hidden rounded-xl">
                      <Image src={url} alt={`Ref ${i + 1}`} width={90} height={90}
                             className="h-20 w-20 object-cover transition group-hover:scale-105" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                        <ExternalLink className="h-4 w-4 text-white opacity-0 transition group-hover:opacity-100" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accept / Decline */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => onAccept(commission.id)}
            disabled={accepting === commission.id}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1a1614] py-3.5 text-sm font-bold text-white transition hover:bg-[#2a2624] disabled:opacity-60"
          >
            {accepting === commission.id
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ThumbsUp className="h-4 w-4" />}
            Accept Commission
          </button>
          <button
            onClick={() => onDecline(commission)}
            disabled={accepting === commission.id}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-red-200 bg-white py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            <ThumbsDown className="h-4 w-4" />
            Decline
          </button>
          <Link
            href={`/artist/commissions/${commission.id}`}
            className="flex items-center justify-center gap-2 rounded-full border border-[#eadfcb] bg-white px-5 py-3.5 text-sm font-semibold text-[#6b5d54] transition hover:bg-[#f8f1e6]"
          >
            Full Details <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Active work card ─────────────────────────────────────────────────────────

function ActiveCard({ commission }: { commission: Commission }) {
  const lastUpdate = commission.workUpdates[commission.workUpdates.length - 1];
  const pct = commission.status === "REVIEW"      ? 90
            : commission.status === "REVISION"    ? Math.min(20 + commission.workUpdates.length * 15, 70)
            : commission.status === "IN_PROGRESS" ? Math.min(15 + commission.workUpdates.length * 15, 80)
            : 10;

  return (
    <Link
      href={`/artist/commissions/${commission.id}`}
      className="group block rounded-[1.75rem] border border-[#eadfcb] bg-white p-5 shadow-[0_4px_20px_rgba(26,22,20,0.06)] transition hover:border-[#d4a574] hover:shadow-[0_8px_30px_rgba(212,165,116,0.15)]"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <StatusBadge status={commission.status} />
        <span className="font-mono text-[10px] text-[#8c7764]">{commission.reference}</span>
      </div>

      <h3 className="font-serif text-base font-bold text-[#1a1614] transition group-hover:text-[#a87945]">
        {TYPE_LABELS[commission.paintingType] ?? commission.paintingType}
      </h3>

      <div className="mt-2 space-y-1 text-xs text-[#6b5d54]">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-[#d4a574]" /> {commission.customerName}
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-[#d4a574]" />
          {SIZE_LABELS[commission.size] ?? commission.size} · {commission.style}
        </div>
        {commission.deadline && (
          <div className="flex items-center gap-1.5 font-semibold text-orange-600">
            <Clock className="h-3 w-3" /> Due: {commission.deadline}
          </div>
        )}
        {lastUpdate && (
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3 text-[#d4a574]" />
            Last: {STEP_LABELS[lastUpdate.step] ?? lastUpdate.step} · {fmt(lastUpdate.createdAt)}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] text-[#8c7764]">
          <span>{commission.workUpdates.length} update{commission.workUpdates.length !== 1 ? "s" : ""} posted</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#eadfcb]">
          <div
            className={`h-full rounded-full transition-all ${
              commission.status === "REVISION" ? "bg-red-400" :
              commission.status === "REVIEW"   ? "bg-indigo-400" : "bg-[#d4a574]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#f0e4cf] pt-3">
        <span className="text-xs font-semibold text-[#a87945]">{commission.estimatedRange ?? "Estimate TBD"}</span>
        <ChevronRight className="h-4 w-4 text-[#d4a574] transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({ commission }: { commission: Commission }) {
  const cfg = STATUS_CONFIG[commission.status];
  const Icon = cfg?.icon ?? CheckCircle;
  return (
    <Link
      href={`/artist/commissions/${commission.id}`}
      className="flex items-center gap-4 rounded-2xl border border-[#eadfcb] bg-white px-5 py-4 transition hover:border-[#d4a574] hover:bg-[#faf6ef]"
    >
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border ${cfg?.color ?? ""}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-semibold text-sm text-[#1a1614]">
          {TYPE_LABELS[commission.paintingType] ?? commission.paintingType} · {commission.customerName}
        </p>
        <p className="text-xs text-[#8c7764]">
          {commission.reference} · {commission.workUpdates.length} updates
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-xs font-semibold text-[#a87945]">{commission.estimatedRange ?? "—"}</p>
        <p className="text-[10px] text-[#8c7764]">{fmt(commission.createdAt)}</p>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#c0b4aa]" />
    </Link>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function ArtistDashboard({
  artistId,
  artistName,
  isAdmin,
  initialSection,
}: {
  artistId: string;
  artistName: string;
  isAdmin: boolean;
  initialSection?: string;
}) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [accepting, setAccepting]     = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Commission | null>(null);
  const [section, setSection]         = useState<"inbox" | "active" | "history">(
    (initialSection as "inbox" | "active" | "history") ?? "inbox"
  );

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/artist/commissions")
      .then(r => r.json())
      .then(d => setCommissions(d.commissions ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-switch section based on what has content
  useEffect(() => {
    if (!commissions.length) return;
    const inbox = commissions.filter(c => c.status === "ASSIGNED");
    if (inbox.length) { setSection("inbox"); return; }
    const active = commissions.filter(c => ["IN_PROGRESS","REVIEW","REVISION"].includes(c.status));
    if (active.length) { setSection("active"); return; }
    setSection("history");
  }, [commissions]);

  const inbox    = commissions.filter(c => c.status === "ASSIGNED");
  const active   = commissions.filter(c => ["IN_PROGRESS","REVIEW","REVISION"].includes(c.status));
  const history  = commissions.filter(c => ["COMPLETED","CANCELLED"].includes(c.status));
  const revision = active.filter(c => c.status === "REVISION");

  async function handleAccept(id: string) {
    setAccepting(id);
    const res = await fetch(`/api/artist/commissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    setAccepting(null);
    if (res.ok) {
      load();
      setSection("active");
    }
  }

  function handleDeclineOpen(c: Commission) { setDeclineTarget(c); }
  function handleDeclineDone() { load(); }

  const shown = section === "inbox"   ? inbox
              : section === "active"  ? active
              : history;

  return (
    <>
      {declineTarget && (
        <DeclineModal
          commission={declineTarget}
          onClose={() => setDeclineTarget(null)}
          onDeclined={handleDeclineDone}
        />
      )}

      <div className="space-y-8">
        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <div className="rounded-[2rem] bg-[#1a1614] px-8 py-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d4a574]">
                Artist Portal
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold">
                {artistName}&rsquo;s Studio
              </h1>
              <p className="mt-1 text-sm text-[#8c7764]">
                {isAdmin ? "Admin view — all commissions shown" : "Your personal commission management workspace"}
              </p>
            </div>

            {/* Live stat pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: "New",       value: inbox.length,    color: inbox.length    ? "bg-orange-500" : "bg-white/10", text: "text-white" },
                { label: "Active",    value: active.length,   color: active.length   ? "bg-[#d4a574]"  : "bg-white/10", text: "text-[#1a1614]" },
                { label: "Revision",  value: revision.length, color: revision.length ? "bg-red-500"    : "bg-white/10", text: "text-white" },
                { label: "Done",      value: history.filter(c => c.status === "COMPLETED").length, color: "bg-white/10", text: "text-white" },
              ].map(s => (
                <div key={s.label} className={`flex flex-col items-center rounded-2xl px-5 py-3 ${s.color}`}>
                  <span className={`text-2xl font-bold ${s.text}`}>{s.value}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{s.label}</span>
                </div>
              ))}
              <button
                onClick={load}
                className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-3 text-xs font-semibold text-white/80 transition hover:bg-white/20"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── Revision alert ───────────────────────────────────────────────── */}
        {revision.length > 0 && (
          <div className="flex items-center gap-4 rounded-[1.5rem] border-2 border-red-200 bg-red-50 px-6 py-4">
            <RotateCcw className="h-6 w-6 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">
                {revision.length} commission{revision.length > 1 ? "s need" : " needs"} revision
              </p>
              <p className="text-sm text-red-600">The admin has requested changes. Please review and update your work.</p>
            </div>
            <button onClick={() => setSection("active")}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
              View
            </button>
          </div>
        )}

        {/* ── Section tabs ────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          {[
            { key: "inbox",   icon: Bell,      label: "Inbox",       count: inbox.length,   alert: inbox.length > 0 },
            { key: "active",  icon: Briefcase, label: "Active Work", count: active.length,  alert: revision.length > 0 },
            { key: "history", icon: History,   label: "History",     count: history.length, alert: false },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = section === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSection(tab.key as any)}
                className={`relative flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "border-[#d4a574] bg-[#d4a574] text-white shadow-md"
                    : "border-[#eadfcb] bg-white text-[#6b5d54] hover:border-[#d4a574] hover:text-[#1a1614]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/30 text-white"
                      : tab.alert ? "bg-red-100 text-red-700" : "bg-[#f0e4cf] text-[#a87945]"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Section header ───────────────────────────────────────────────── */}
        <div>
          {section === "inbox" && (
            <div className="mb-2">
              <h2 className="font-serif text-2xl font-bold text-[#1a1614]">New Assignments</h2>
              <p className="text-sm text-[#8c7764]">
                {inbox.length === 0
                  ? "No new assignments waiting."
                  : `${inbox.length} commission${inbox.length > 1 ? "s" : ""} awaiting your decision — review the details and accept or decline.`}
              </p>
            </div>
          )}
          {section === "active" && (
            <div className="mb-2">
              <h2 className="font-serif text-2xl font-bold text-[#1a1614]">Active Work</h2>
              <p className="text-sm text-[#8c7764]">
                {active.length === 0
                  ? "No active commissions right now."
                  : `${active.length} painting${active.length > 1 ? "s" : ""} in progress.`}
              </p>
            </div>
          )}
          {section === "history" && (
            <div className="mb-2">
              <h2 className="font-serif text-2xl font-bold text-[#1a1614]">Commission History</h2>
              <p className="text-sm text-[#8c7764]">{history.length} completed or cancelled commissions.</p>
            </div>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-[2rem] border-2 border-dashed border-[#eadfcb] bg-white py-20 text-center">
            {section === "inbox" && (
              <>
                <Bell className="mx-auto h-12 w-12 text-[#d4a574] opacity-40" />
                <p className="mt-4 font-serif text-xl text-[#1a1614]">Inbox is clear</p>
                <p className="mt-1 text-sm text-[#8c7764]">No new assignments waiting for your decision.</p>
              </>
            )}
            {section === "active" && (
              <>
                <Palette className="mx-auto h-12 w-12 text-[#d4a574] opacity-40" />
                <p className="mt-4 font-serif text-xl text-[#1a1614]">Nothing in progress</p>
                <p className="mt-1 text-sm text-[#8c7764]">Check your inbox for new assignments to pick up.</p>
                {inbox.length > 0 && (
                  <button onClick={() => setSection("inbox")}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#d4a574] px-5 py-2.5 text-sm font-semibold text-[#1a1614] hover:bg-[#c4956a]">
                    <Bell className="h-4 w-4" /> Go to Inbox ({inbox.length})
                  </button>
                )}
              </>
            )}
            {section === "history" && (
              <>
                <History className="mx-auto h-12 w-12 text-[#d4a574] opacity-40" />
                <p className="mt-4 font-serif text-xl text-[#1a1614]">No history yet</p>
                <p className="mt-1 text-sm text-[#8c7764]">Completed and cancelled commissions will appear here.</p>
              </>
            )}
          </div>
        ) : section === "inbox" ? (
          <div className="space-y-6">
            {inbox.map(c => (
              <InboxCard
                key={c.id}
                commission={c}
                onAccept={handleAccept}
                onDecline={handleDeclineOpen}
                accepting={accepting}
              />
            ))}
          </div>
        ) : section === "active" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map(c => <ActiveCard key={c.id} commission={c} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(c => <HistoryRow key={c.id} commission={c} />)}
          </div>
        )}
      </div>
    </>
  );
}
