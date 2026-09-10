"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Palette, Clock, CheckCircle, AlertCircle, User,
  ChevronRight, X, Loader2, Eye, Layers, MessageSquare,
} from "lucide-react";

type Artist = { id: string; name: string | null; email: string; image: string | null };

type Commission = {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  paintingType: string;
  size: string;
  style: string;
  status: string;
  estimatedRange: string | null;
  timeline: string | null;
  createdAt: string;
  adminNotes: string | null;
  referenceImageUrls: string[];
  assignedArtist: Artist | null;
  workUpdates: { id: string; createdAt: string }[];
};

const STATUS_OPTIONS = [
  "PENDING", "QUOTED", "APPROVED", "ASSIGNED",
  "IN_PROGRESS", "REVIEW", "REVISION", "COMPLETED", "CANCELLED",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:     { label: "Pending",     color: "text-amber-700 bg-amber-50 border-amber-200",     icon: Clock },
  QUOTED:      { label: "Quoted",      color: "text-blue-700 bg-blue-50 border-blue-200",        icon: Clock },
  APPROVED:    { label: "Approved",    color: "text-purple-700 bg-purple-50 border-purple-200",  icon: CheckCircle },
  ASSIGNED:    { label: "Assigned",    color: "text-orange-700 bg-orange-50 border-orange-200",  icon: Palette },
  IN_PROGRESS: { label: "In Progress", color: "text-[#a87945] bg-[#fdf8f1] border-[#eadfcb]",   icon: Palette },
  REVIEW:      { label: "Review",      color: "text-indigo-700 bg-indigo-50 border-indigo-200",  icon: AlertCircle },
  REVISION:    { label: "Revision",    color: "text-red-700 bg-red-50 border-red-200",           icon: AlertCircle },
  COMPLETED:   { label: "Completed",   color: "text-green-700 bg-green-50 border-green-200",     icon: CheckCircle },
  CANCELLED:   { label: "Cancelled",   color: "text-gray-500 bg-gray-50 border-gray-200",        icon: AlertCircle },
};

const TYPE_LABELS: Record<string, string> = {
  portrait: "Portrait", landscape: "Landscape", interior: "Interior",
  event: "Event", pet: "Pet Portrait", custom: "Custom",
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["PENDING"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function DetailModal({
  commission, artists, onClose, onSave,
}: {
  commission: Commission;
  artists: Artist[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [status, setStatus]           = useState(commission.status);
  const [assignedId, setAssignedId]   = useState(commission.assignedArtist?.id ?? "");
  const [adminNotes, setAdminNotes]   = useState(commission.adminNotes ?? "");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/commissions/${commission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        assignedArtistId: assignedId || null,
        adminNotes: adminNotes.trim() || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save.");
      return;
    }
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl">
        <button onClick={onClose} className="absolute right-6 top-6 rounded-full p-2 text-[#8c7764] hover:bg-[#f8f1e6]">
          <X className="h-5 w-5" />
        </button>

        <p className="font-mono text-xs text-[#8c7764]">{commission.reference}</p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[#1a1614]">
          {TYPE_LABELS[commission.paintingType] ?? commission.paintingType} — {commission.customerName}
        </h2>

        <div className="mt-6 space-y-5">
          {/* Status */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none focus:border-[#d4a574]"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
              ))}
            </select>
          </div>

          {/* Assign artist */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
              Assign Artist
            </label>
            {artists.length === 0 ? (
              <p className="rounded-2xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#8c7764]">
                No artists found. Assign the ARTIST role to users in User Management.
              </p>
            ) : (
              <select
                value={assignedId}
                onChange={e => setAssignedId(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none focus:border-[#d4a574]"
              >
                <option value="">— Unassigned —</option>
                {artists.map(a => (
                  <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                ))}
              </select>
            )}
          </div>

          {/* Admin notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
              Admin Notes (visible to artist)
            </label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Special instructions, color preferences, customer feedback..."
              className="w-full rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none focus:border-[#d4a574]"
            />
          </div>

          {/* Customer details */}
          <div className="rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-4 text-sm">
            <p className="font-semibold text-[#1a1614]">Customer Info</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[#6b5d54]">
              <div><span className="text-[#8c7764]">Email: </span>{commission.email}</div>
              <div><span className="text-[#8c7764]">Size: </span>{commission.size}</div>
              <div><span className="text-[#8c7764]">Style: </span>{commission.style}</div>
              {commission.timeline && <div><span className="text-[#8c7764]">Timeline: </span>{commission.timeline}</div>}
              {commission.estimatedRange && <div><span className="text-[#8c7764]">Estimate: </span>{commission.estimatedRange}</div>}
            </div>
          </div>

          {/* Reference images preview */}
          {commission.referenceImageUrls.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
                Reference Images ({commission.referenceImageUrls.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {commission.referenceImageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={url}
                      alt={`Ref ${i + 1}`}
                      width={80}
                      height={80}
                      className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-[#eadfcb] py-3 text-sm font-semibold text-[#6b5d54] hover:bg-[#f8f1e6]"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1a1614] py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#2a2624]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCommissionsManager() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [artists, setArtists]         = useState<Artist[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [selected, setSelected]       = useState<Commission | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/commissions")
      .then(r => r.json())
      .then(d => {
        setCommissions(d.commissions ?? []);
        setArtists(d.artists ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = {
    all:         commissions.length,
    pending:     commissions.filter(c => ["PENDING","QUOTED","APPROVED"].includes(c.status)).length,
    active:      commissions.filter(c => ["ASSIGNED","IN_PROGRESS","REVIEW","REVISION"].includes(c.status)).length,
    completed:   commissions.filter(c => c.status === "COMPLETED").length,
  };

  const shown = commissions.filter(c =>
    filter === "pending"   ? ["PENDING","QUOTED","APPROVED"].includes(c.status) :
    filter === "active"    ? ["ASSIGNED","IN_PROGRESS","REVIEW","REVISION"].includes(c.status) :
    filter === "completed" ? c.status === "COMPLETED" :
    true
  );

  return (
    <>
      {selected && (
        <DetailModal
          commission={selected}
          artists={artists}
          onClose={() => setSelected(null)}
          onSave={load}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#1a1614]">Commissions</h1>
            <p className="mt-1 text-sm text-[#8c7764]">
              Review, assign artists, and track painting progress
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#eadfcb] bg-white px-4 py-2 text-sm">
            <User className="h-4 w-4 text-[#d4a574]" />
            <span className="text-[#6b5d54]">{artists.length} artist{artists.length !== 1 ? "s" : ""} available</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total",     value: counts.all,       color: "text-[#1a1614]" },
            { label: "Pending",   value: counts.pending,   color: "text-amber-600" },
            { label: "Active",    value: counts.active,    color: "text-[#a87945]" },
            { label: "Completed", value: counts.completed, color: "text-green-600" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-[#eadfcb] bg-white p-4 shadow-sm">
              <p className="text-xs text-[#8c7764]">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all",       label: `All (${counts.all})` },
            { key: "pending",   label: `Pending (${counts.pending})` },
            { key: "active",    label: `Active (${counts.active})` },
            { key: "completed", label: `Done (${counts.completed})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter === tab.key
                  ? "border-[#d4a574] bg-[#d4a574] text-white"
                  : "border-[#eadfcb] bg-white text-[#6b5d54] hover:border-[#d4a574]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-[2rem] border-2 border-dashed border-[#eadfcb] py-16 text-center">
            <Palette className="mx-auto h-10 w-10 text-[#d4a574] opacity-40" />
            <p className="mt-3 text-[#8c7764]">No commissions in this category.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-[#eadfcb] bg-white shadow-[0_4px_20px_rgba(26,22,20,0.06)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0e4cf] bg-[#faf6ef]">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Reference</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Customer</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8c7764] md:table-cell">Type / Size</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Status</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8c7764] lg:table-cell">Artist</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8c7764] xl:table-cell">Updates</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e4cf]">
                {shown.map(c => (
                  <tr key={c.id} className="hover:bg-[#faf6ef] transition">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-[#8c7764]">{c.reference}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#1a1614]">{c.customerName}</p>
                      <p className="text-xs text-[#8c7764]">{c.email}</p>
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      <div className="flex items-center gap-1.5 text-[#6b5d54]">
                        <Layers className="h-3.5 w-3.5 text-[#d4a574]" />
                        {TYPE_LABELS[c.paintingType] ?? c.paintingType} · {c.size}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      {c.assignedArtist ? (
                        <div className="flex items-center gap-2">
                          {c.assignedArtist.image ? (
                            <Image
                              src={c.assignedArtist.image}
                              alt=""
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eadfcb] text-xs font-bold text-[#a87945]">
                              {(c.assignedArtist.name ?? c.assignedArtist.email)[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-[#6b5d54]">{c.assignedArtist.name ?? c.assignedArtist.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8c7764]">Unassigned</span>
                      )}
                    </td>
                    <td className="hidden px-5 py-4 xl:table-cell">
                      <div className="flex items-center gap-1.5 text-[#6b5d54]">
                        <MessageSquare className="h-3.5 w-3.5 text-[#d4a574]" />
                        {c.workUpdates.length}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelected(c)}
                          className="rounded-xl border border-[#eadfcb] px-3 py-1.5 text-xs font-semibold text-[#6b5d54] transition hover:border-[#d4a574] hover:text-[#1a1614]"
                        >
                          Manage
                        </button>
                        <Link
                          href={`/commission/${c.reference}`}
                          target="_blank"
                          className="rounded-xl border border-[#eadfcb] p-1.5 text-[#8c7764] transition hover:border-[#d4a574] hover:text-[#1a1614]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
