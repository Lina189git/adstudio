"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Palette, CheckCircle, Clock, AlertCircle, Loader2,
  User, Plus, Save, UserMinus, ChevronRight, RefreshCw,
  Search, Layers, Calendar, MessageSquare, X, ClipboardList,
  ChevronDown, Unlink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ArtistSummary = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  counts: { active: number; completed: number; total: number };
};

type CommissionRow = {
  id: string;
  reference: string;
  customerName: string;
  paintingType: string;
  size: string;
  style: string;
  status: string;
  estimatedRange: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  workUpdates: { id: string; step: string; createdAt: string }[];
};

type AvailableCommission = {
  id: string;
  reference: string;
  customerName: string;
  paintingType: string;
  size: string;
  style: string;
  status: string;
  estimatedRange: string | null;
  deadline: string | null;
  createdAt: string;
  assignedArtist: { id: string; name: string | null } | null;
};

type ArtistDetail = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  "PENDING", "QUOTED", "APPROVED", "ASSIGNED",
  "IN_PROGRESS", "REVIEW", "REVISION", "COMPLETED", "CANCELLED",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; dot: string }> = {
  PENDING:     { label: "Pending",     color: "text-amber-700 bg-amber-50 border-amber-200",    icon: Clock,       dot: "bg-amber-400"  },
  QUOTED:      { label: "Quoted",      color: "text-blue-700 bg-blue-50 border-blue-200",       icon: Clock,       dot: "bg-blue-400"   },
  APPROVED:    { label: "Approved",    color: "text-purple-700 bg-purple-50 border-purple-200", icon: CheckCircle, dot: "bg-purple-400" },
  ASSIGNED:    { label: "Assigned",    color: "text-orange-700 bg-orange-50 border-orange-200", icon: Palette,     dot: "bg-orange-400" },
  IN_PROGRESS: { label: "In Progress", color: "text-[#a87945] bg-[#fdf8f1] border-[#eadfcb]",  icon: Palette,     dot: "bg-[#d4a574]"  },
  REVIEW:      { label: "Review",      color: "text-indigo-700 bg-indigo-50 border-indigo-200", icon: AlertCircle, dot: "bg-indigo-400" },
  REVISION:    { label: "Revision",    color: "text-red-700 bg-red-50 border-red-200",          icon: AlertCircle, dot: "bg-red-400"    },
  COMPLETED:   { label: "Completed",   color: "text-green-700 bg-green-50 border-green-200",    icon: CheckCircle, dot: "bg-green-400"  },
  CANCELLED:   { label: "Cancelled",   color: "text-gray-500 bg-gray-50 border-gray-200",       icon: X,           dot: "bg-gray-300"   },
};

const TYPE_LABELS: Record<string, string> = {
  portrait: "Portrait", landscape: "Landscape", interior: "Interior",
  event: "Event", pet: "Pet Portrait", custom: "Custom",
};

const STEP_LABELS: Record<string, string> = {
  sketch: "Sketch", base_coat: "Base Coat", main_elements: "Main Elements",
  details: "Details", finishing: "Finishing", final: "Final",
};

const ACTIVE_STATUSES = new Set(["ASSIGNED", "IN_PROGRESS", "REVIEW", "REVISION"]);

function fmt(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }).format(new Date(date));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 40 }: { src: string | null; name: string | null; size?: number }) {
  if (src) {
    return (
      <Image
        src={src} alt={name ?? "Artist"} width={size} height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a574] to-[#a87945] font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {(name ?? "A")[0].toUpperCase()}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["PENDING"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── Inline status dropdown ───────────────────────────────────────────────────

function StatusDropdown({
  current, commissionId, onChanged,
}: {
  current: string;
  commissionId: string;
  onChanged: () => void;
}) {
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const ref                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function pick(status: string) {
    if (status === current) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    await fetch(`/api/admin/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    onChanged();
  }

  const cfg = STATUS_CONFIG[current] ?? STATUS_CONFIG["PENDING"];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition hover:opacity-80 ${cfg.color}`}
        title="Change status"
      >
        {saving
          ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
          : <cfg.icon className="h-2.5 w-2.5" />}
        {cfg.label}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-6 z-30 min-w-[160px] rounded-2xl border border-[#eadfcb] bg-white py-1 shadow-xl">
          {STATUS_OPTIONS.map(s => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => pick(s)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold transition hover:bg-[#faf6ef] ${
                  s === current ? "text-[#d4a574]" : "text-[#1a1614]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${c?.dot ?? "bg-gray-300"}`} />
                {c?.label ?? s}
                {s === current && <CheckCircle className="ml-auto h-3 w-3 text-[#d4a574]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Assign-task modal ────────────────────────────────────────────────────────

function AssignTaskModal({
  artistId,
  artistName,
  onClose,
  onAssigned,
}: {
  artistId: string;
  artistName: string;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [commissions, setCommissions] = useState<AvailableCommission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [assigning, setAssigning]     = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/commissions")
      .then(r => r.json())
      .then(d => setCommissions(d.commissions ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Show commissions that are NOT already completed/cancelled AND not already assigned to THIS artist
  const available = commissions.filter(c => {
    if (["COMPLETED", "CANCELLED"].includes(c.status)) return false;
    if (c.assignedArtist?.id === artistId) return false; // already theirs
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.reference.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.paintingType.toLowerCase().includes(q)
    );
  });

  async function assign(commissionId: string) {
    setAssigning(commissionId);
    setError(null);
    const res = await fetch(`/api/admin/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedArtistId: artistId, status: "ASSIGNED" }),
    });
    setAssigning(null);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Assignment failed.");
      return;
    }
    onAssigned();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-[2rem] bg-white shadow-2xl"
           style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#f0e4cf] p-7 pb-5">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1a1614]">Assign Commission</h2>
            <p className="mt-0.5 text-sm text-[#8c7764]">
              Pick a commission to assign to <span className="font-semibold text-[#1a1614]">{artistName}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#8c7764] hover:bg-[#f8f1e6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-7 pt-5 pb-3">
          <div className="flex items-center gap-2 rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5">
            <Search className="h-4 w-4 text-[#8c7764]" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by reference, customer, or type…"
              className="flex-1 bg-transparent text-sm text-[#1a1614] outline-none placeholder:text-[#c0b4aa]"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="h-3.5 w-3.5 text-[#8c7764]" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="mx-7 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        {/* Commission list */}
        <div className="flex-1 overflow-y-auto px-7 pb-7 pt-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#8c7764]">
              <Loader2 className="h-5 w-5 animate-spin text-[#d4a574]" /> Loading commissions…
            </div>
          ) : available.length === 0 ? (
            <div className="rounded-[1.5rem] border-2 border-dashed border-[#eadfcb] py-12 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-[#d4a574] opacity-40" />
              <p className="mt-3 font-semibold text-[#1a1614]">
                {search ? "No commissions match your search" : "No commissions available to assign"}
              </p>
              <p className="mt-1 text-xs text-[#8c7764]">
                Completed, cancelled, and already-assigned commissions are excluded.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {available.map(c => (
                <div
                  key={c.id}
                  className="flex items-start gap-4 rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-4"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-[#8c7764]">{c.reference}</span>
                      <StatusBadge status={c.status} />
                      {c.assignedArtist && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                          Currently: {c.assignedArtist.name ?? "Unknown"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-semibold text-sm text-[#1a1614]">
                      {TYPE_LABELS[c.paintingType] ?? c.paintingType}
                      <span className="ml-1.5 font-normal text-[#8c7764]">· {c.size} · {c.style}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[#6b5d54]">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-[#d4a574]" />
                        {c.customerName}
                      </span>
                      {c.estimatedRange && (
                        <span className="font-semibold text-[#a87945]">{c.estimatedRange}</span>
                      )}
                      {c.deadline && (
                        <span className="flex items-center gap-1 text-orange-600 font-semibold">
                          <Clock className="h-3 w-3" /> Due: {c.deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assign button */}
                  <button
                    onClick={() => assign(c.id)}
                    disabled={assigning === c.id}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[#1a1614] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2a2624] disabled:opacity-60"
                  >
                    {assigning === c.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Plus className="h-3.5 w-3.5" />}
                    Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Promote modal ────────────────────────────────────────────────────────────

function PromoteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<{ id: string; name: string | null; email: string; role: string; image: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  async function search() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    setResults([]);
    const res  = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=5`);
    const data = await res.json();
    setSearching(false);
    if (!data.users?.length) { setError("No users found."); return; }
    setResults(data.users);
  }

  async function promote(userId: string) {
    setPromoting(userId);
    setError(null);
    const res  = await fetch("/api/admin/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setPromoting(null);
    if (!res.ok) { setError(data.error ?? "Failed to promote."); return; }
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1a1614]">Add Artist</h2>
            <p className="mt-1 text-sm text-[#8c7764]">Search for an existing user by email or name</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#8c7764] hover:bg-[#f8f1e6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Name or email…"
            className="flex-1 rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm outline-none focus:border-[#d4a574]"
          />
          <button
            onClick={search}
            disabled={searching}
            className="flex items-center gap-1.5 rounded-2xl bg-[#1a1614] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#2a2624]"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </div>

        {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map(u => (
              <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-[#eadfcb] p-3">
                <Avatar src={u.image} name={u.name} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-sm text-[#1a1614]">{u.name ?? "Unnamed"}</p>
                  <p className="truncate text-xs text-[#8c7764]">{u.email}</p>
                </div>
                <span className="rounded-full bg-[#f0e4cf] px-2.5 py-0.5 text-[10px] font-semibold text-[#a87945]">
                  {u.role}
                </span>
                {u.role === "ARTIST" ? (
                  <span className="text-xs text-[#8c7764]">Already artist</span>
                ) : (
                  <button
                    onClick={() => promote(u.id)}
                    disabled={promoting === u.id}
                    className="flex items-center gap-1 rounded-full bg-[#d4a574] px-3 py-1.5 text-xs font-semibold text-[#1a1614] hover:bg-[#c4956a] disabled:opacity-60"
                  >
                    {promoting === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Palette className="h-3 w-3" />}
                    Promote
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminArtistManager() {
  const [artists, setArtists]           = useState<ArtistSummary[]>([]);
  const [totalActive, setTotalActive]   = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loading, setLoading]           = useState(true);

  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [detail, setDetail]             = useState<ArtistDetail | null>(null);
  const [commissions, setCommissions]   = useState<CommissionRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [draftName, setDraftName]       = useState("");
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState<{ ok: boolean; text: string } | null>(null);

  const [showPromote, setShowPromote]   = useState(false);
  const [showAssign, setShowAssign]     = useState(false);
  const [taskFilter, setTaskFilter]     = useState<"all" | "active" | "completed">("all");

  // ── Load roster ────────────────────────────────────────────────────────────

  const loadRoster = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/artists")
      .then(r => r.json())
      .then(d => {
        setArtists(d.artists ?? []);
        setTotalActive(d.totalActive ?? 0);
        setTotalCompleted(d.totalCompleted ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  // ── Load detail ────────────────────────────────────────────────────────────

  const loadDetail = useCallback((id: string) => {
    setDetailLoading(true);
    fetch(`/api/admin/artists/${id}`)
      .then(r => r.json())
      .then(d => {
        setDetail(d.user ?? null);
        setDraftName(d.user?.name ?? "");
        setCommissions(d.commissions ?? []);
      })
      .finally(() => setDetailLoading(false));
  }, []);

  function selectArtist(id: string) {
    setSelectedId(id);
    setSaveMsg(null);
    setTaskFilter("all");
    loadDetail(id);
  }

  function refreshDetail() {
    if (selectedId) {
      loadDetail(selectedId);
      loadRoster();
    }
  }

  // ── Save name ──────────────────────────────────────────────────────────────

  async function saveArtist() {
    if (!selectedId) return;
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch(`/api/admin/artists/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draftName.trim() || null }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg({ ok: true, text: "Name updated." });
      loadRoster();
    } else {
      const d = await res.json();
      setSaveMsg({ ok: false, text: d.error ?? "Failed." });
    }
  }

  // ── Demote ─────────────────────────────────────────────────────────────────

  async function demoteArtist() {
    if (!selectedId || !detail) return;
    if (!confirm(`Remove artist role from ${detail.name ?? detail.email}?\nThey'll become a regular USER. Their commission history is preserved.`)) return;
    const res = await fetch(`/api/admin/artists/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "USER" }),
    });
    if (res.ok) {
      setSelectedId(null);
      setDetail(null);
      setCommissions([]);
      loadRoster();
    }
  }

  // ── Unassign ───────────────────────────────────────────────────────────────

  async function unassign(commissionId: string) {
    if (!confirm("Unassign this commission? The artist will be removed but the commission stays open.")) return;
    await fetch(`/api/admin/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedArtistId: null, status: "APPROVED" }),
    });
    refreshDetail();
  }

  // ── Filtered tasks ─────────────────────────────────────────────────────────

  const shownCommissions = commissions.filter(c =>
    taskFilter === "active"    ? ACTIVE_STATUSES.has(c.status) :
    taskFilter === "completed" ? c.status === "COMPLETED" :
    true
  );

  const selectedArtist = artists.find(a => a.id === selectedId);

  const activeCount    = commissions.filter(c => ACTIVE_STATUSES.has(c.status)).length;
  const completedCount = commissions.filter(c => c.status === "COMPLETED").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {showPromote && (
        <PromoteModal onClose={() => setShowPromote(false)} onSuccess={loadRoster} />
      )}
      {showAssign && selectedId && detail && (
        <AssignTaskModal
          artistId={selectedId}
          artistName={detail.name ?? detail.email}
          onClose={() => setShowAssign(false)}
          onAssigned={refreshDetail}
        />
      )}

      <div className="space-y-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#1a1614]">Artist Management</h1>
            <p className="mt-1 text-sm text-[#8c7764]">
              Promote users, assign commissions, change task status, and track progress
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadRoster}
              className="flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white px-4 py-2.5 text-sm font-semibold text-[#6b5d54] transition hover:bg-[#f8f1e6]"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={() => setShowPromote(true)}
              className="flex items-center gap-2 rounded-full bg-[#1a1614] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2624]"
            >
              <Plus className="h-4 w-4" /> Add Artist
            </button>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Artists",      value: artists.length,  color: "text-[#1a1614]" },
            { label: "Active Commissions", value: totalActive,     color: "text-[#a87945]" },
            { label: "Completed",          value: totalCompleted,  color: "text-green-600" },
            { label: "Avg. Active / Artist", value: artists.length
                ? (totalActive / artists.length).toFixed(1)
                : "—", color: "text-indigo-600" },
          ].map(s => (
            <div key={s.label} className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-5 shadow-[0_4px_20px_rgba(26,22,20,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7764]">{s.label}</p>
              <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_1.15fr]">
          {/* ── Roster ──────────────────────────────────────────────────────── */}
          <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
            <h2 className="font-serif text-xl font-bold text-[#1a1614]">Artist Roster</h2>
            <p className="mt-1 text-sm text-[#8c7764]">Click an artist to open their task board</p>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#8c7764]">
                <Loader2 className="h-5 w-5 animate-spin text-[#d4a574]" /> Loading…
              </div>
            ) : artists.length === 0 ? (
              <div className="mt-8 rounded-[1.5rem] border-2 border-dashed border-[#eadfcb] py-16 text-center">
                <Palette className="mx-auto h-10 w-10 text-[#d4a574] opacity-40" />
                <p className="mt-3 font-semibold text-[#1a1614]">No artists yet</p>
                <p className="mt-1 text-sm text-[#8c7764]">Promote a user to get started</p>
                <button
                  onClick={() => setShowPromote(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1a1614] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2a2624]"
                >
                  <Plus className="h-4 w-4" /> Add First Artist
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {artists.map(artist => {
                  const isSelected = artist.id === selectedId;
                  return (
                    <button
                      key={artist.id}
                      onClick={() => selectArtist(artist.id)}
                      className={`w-full rounded-[1.35rem] border px-5 py-4 text-left transition ${
                        isSelected
                          ? "border-[#d4a574] bg-[#fff8ee] shadow-[0_8px_25px_rgba(212,165,116,0.18)]"
                          : "border-[#eadfcb] bg-white hover:bg-[#faf6ef]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar src={artist.image} name={artist.name} size={48} />
                          {artist.counts.active > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a574] text-[10px] font-bold text-white ring-2 ring-white">
                              {artist.counts.active}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-semibold text-[#1a1614]">
                              {artist.name ?? "Unnamed Artist"}
                            </p>
                            <ChevronRight className={`h-4 w-4 flex-shrink-0 transition ${isSelected ? "text-[#d4a574] rotate-90" : "text-[#c0b4aa]"}`} />
                          </div>
                          <p className="truncate text-xs text-[#8c7764]">{artist.email}</p>
                          <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-[#6b5d54]">
                            <span className="flex items-center gap-1">
                              <span className={`h-2 w-2 rounded-full ${artist.counts.active > 0 ? "bg-[#d4a574]" : "bg-[#eadfcb]"}`} />
                              {artist.counts.active} active
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-green-400" />
                              {artist.counts.completed} done
                            </span>
                            <span className="text-[#c0b4aa]">{artist.counts.total} total</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Detail / Task board ──────────────────────────────────────────── */}
          <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
            {!selectedId ? (
              <div className="flex h-full flex-col items-center justify-center py-24 text-center">
                <User className="h-12 w-12 text-[#d4a574] opacity-30" />
                <p className="mt-4 font-semibold text-[#1a1614]">Select an artist</p>
                <p className="mt-1 text-sm text-[#8c7764]">
                  Choose an artist from the roster to manage their profile and task board
                </p>
              </div>
            ) : detailLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
              </div>
            ) : detail ? (
              <div className="space-y-5">
                {/* Profile header */}
                <div className="flex items-start gap-4 rounded-[1.5rem] border border-[#eadfcb] bg-[#faf6ef] p-5">
                  <Avatar src={detail.image} name={detail.name} size={52} />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-xl font-bold text-[#1a1614]">
                      {detail.name ?? "Unnamed Artist"}
                    </p>
                    <p className="text-sm text-[#8c7764]">{detail.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
                      <span className="text-[#6b5d54]">Joined {fmt(detail.createdAt)}</span>
                      <span className="font-semibold text-[#d4a574]">
                        {activeCount} active
                      </span>
                      <span className="font-semibold text-green-600">
                        {completedCount} completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit name */}
                <div className="flex gap-2">
                  <input
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    placeholder="Display name"
                    className="flex-1 rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                  />
                  <button
                    onClick={saveArtist}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-2xl bg-[#1a1614] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#2a2624]"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </button>
                </div>
                {saveMsg && (
                  <p className={`-mt-2 text-xs ${saveMsg.ok ? "text-green-700" : "text-red-600"}`}>{saveMsg.text}</p>
                )}

                {/* Task board header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e4cf] pt-5">
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-lg font-bold text-[#1a1614]">
                      Tasks
                      <span className="ml-2 text-sm font-normal text-[#8c7764]">({commissions.length})</span>
                    </h3>
                    <div className="flex gap-1">
                      {(["all", "active", "completed"] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setTaskFilter(f)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            taskFilter === f
                              ? "bg-[#1a1614] text-white"
                              : "bg-[#f8f1e6] text-[#6b5d54] hover:bg-[#f0e4cf]"
                          }`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Assign task CTA */}
                  <button
                    onClick={() => setShowAssign(true)}
                    className="flex items-center gap-2 rounded-full bg-[#d4a574] px-4 py-2 text-xs font-semibold text-[#1a1614] transition hover:bg-[#c4956a]"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Assign New Task
                  </button>
                </div>

                {/* Task cards */}
                {shownCommissions.length === 0 ? (
                  <div className="rounded-[1.25rem] border-2 border-dashed border-[#eadfcb] py-10 text-center">
                    <ClipboardList className="mx-auto h-8 w-8 text-[#d4a574] opacity-40" />
                    <p className="mt-3 text-sm font-semibold text-[#1a1614]">
                      No {taskFilter === "all" ? "" : taskFilter + " "}tasks
                    </p>
                    {taskFilter !== "completed" && (
                      <button
                        onClick={() => setShowAssign(true)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1a1614] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2a2624]"
                      >
                        <Plus className="h-3.5 w-3.5" /> Assign a commission
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                    {shownCommissions.map(c => {
                      const lastUpdate = c.workUpdates[0];
                      const isActive   = ACTIVE_STATUSES.has(c.status);

                      // progress percentage
                      const pct = c.status === "REVIEW"       ? 90
                                : c.status === "IN_PROGRESS"  ? Math.min(20 + c.workUpdates.length * 15, 80)
                                : c.status === "REVISION"     ? Math.min(20 + c.workUpdates.length * 15, 75)
                                : c.status === "COMPLETED"    ? 100
                                : 10;

                      return (
                        <div key={c.id} className="rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-4">
                          {/* Row 1 — ref + inline status dropdown + unassign */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] text-[#8c7764]">{c.reference}</span>
                            <div className="flex items-center gap-2">
                              <StatusDropdown
                                current={c.status}
                                commissionId={c.id}
                                onChanged={refreshDetail}
                              />
                              <button
                                onClick={() => unassign(c.id)}
                                title="Unassign from this artist"
                                className="rounded-full p-1 text-[#c0b4aa] transition hover:bg-red-50 hover:text-red-500"
                              >
                                <Unlink className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2 — title */}
                          <p className="mt-1 font-semibold text-sm text-[#1a1614]">
                            {TYPE_LABELS[c.paintingType] ?? c.paintingType}
                            <span className="ml-1.5 font-normal text-[#8c7764]">· {c.size} · {c.style}</span>
                          </p>

                          {/* Row 3 — meta */}
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6b5d54]">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-[#d4a574]" />
                              {c.customerName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-[#d4a574]" />
                              {fmt(c.createdAt)}
                            </span>
                            {c.deadline && (
                              <span className="flex items-center gap-1 font-semibold text-orange-600">
                                <Clock className="h-3 w-3" /> Due: {c.deadline}
                              </span>
                            )}
                          </div>

                          {/* Row 4 — last update */}
                          {lastUpdate && (
                            <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs text-[#6b5d54]">
                              <MessageSquare className="h-3 w-3 text-[#d4a574]" />
                              Last: <span className="font-medium">{STEP_LABELS[lastUpdate.step] ?? lastUpdate.step}</span>
                              <span className="text-[#c0b4aa]">— {fmt(lastUpdate.createdAt)}</span>
                            </div>
                          )}

                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-[10px] text-[#8c7764]">
                              <span>Progress</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-[#eadfcb]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  c.status === "COMPLETED" ? "bg-green-500" : "bg-[#d4a574]"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Action links */}
                          <div className="mt-3 flex gap-2">
                            <Link
                              href={`/artist/commissions/${c.id}`}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#eadfcb] py-1.5 text-xs font-semibold text-[#6b5d54] transition hover:border-[#d4a574] hover:text-[#1a1614]"
                            >
                              <Layers className="h-3 w-3" /> Artist View
                            </Link>
                            <Link
                              href={`/commission/${c.reference}`}
                              target="_blank"
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#eadfcb] py-1.5 text-xs font-semibold text-[#6b5d54] transition hover:border-[#d4a574] hover:text-[#1a1614]"
                            >
                              <ChevronRight className="h-3 w-3" /> Customer View
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Danger zone */}
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Danger Zone</p>
                  <p className="mt-1 text-xs text-red-600">
                    Removing the artist role revokes portal access. Commission history is preserved.
                  </p>
                  <button
                    onClick={demoteArtist}
                    className="mt-3 flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Remove Artist Role
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
