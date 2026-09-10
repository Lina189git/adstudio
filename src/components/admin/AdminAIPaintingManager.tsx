"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Edit3,
  Frame as FrameIcon,
  ImagePlus,
  Loader2,
  Palette,
  Plus,
  Save,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

interface AIPaintingStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  successRate: number;
  byStyle: { style: string; count: number }[];
  recentSessions: RecentSession[];
  totalFrames: number;
}

interface RecentSession {
  id: string;
  stylePreset: string;
  status: string;
  createdAt: string;
  user?: { name?: string | null; email?: string | null } | null;
}

interface Frame {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  availableSizes: string[];
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
}

const CANVAS_SIZE_CHOICES = ["8x10", "12x16", "18x24", "24x36"];

const STYLE_LABELS: Record<string, string> = {
  monet: "Monet Glow",
  cezanne: "Cézanne Structure",
  vangogh: "Van Gogh Motion",
  ukiyoe: "Ukiyo-e Detail",
};

const STATUS_COLOUR: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function emptyFrame(): Omit<Frame, "id"> {
  return {
    name: "",
    slug: "",
    description: "",
    imageUrl: null,
    availableSizes: [...CANVAS_SIZE_CHOICES],
    priceCents: 0,
    isActive: true,
    sortOrder: 0,
  };
}

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border-2 border-[#eadfcb] bg-white p-5 shadow-[0_8px_24px_rgba(26,22,20,0.05)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8a7a6f]">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${accent ?? "text-[#1a1614]"}`}>{value}</p>
          {sub && <p className="mt-1 text-sm text-[#6b5d54]">{sub}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4ede0] text-[#c89860]">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────

export default function AdminAIPaintingManager() {
  const [tab, setTab] = useState<"overview" | "frames">("overview");

  // ── Stats state ──
  const [stats, setStats] = useState<AIPaintingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Frame management state ──
  const [frames, setFrames] = useState<Frame[]>([]);
  const [framesLoading, setFramesLoading] = useState(false);
  const [editingFrame, setEditingFrame] = useState<Frame | null>(null);
  const [isNewFrame, setIsNewFrame] = useState(false);
  const [formData, setFormData] = useState<Omit<Frame, "id">>(emptyFrame());
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load stats ──
  useEffect(() => {
    setStatsLoading(true);
    fetch("/api/admin/ai-painting/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .finally(() => setStatsLoading(false));
  }, []);

  // ── Load frames when tab switches ──
  useEffect(() => {
    if (tab !== "frames") return;
    loadFrames();
  }, [tab]);

  async function loadFrames() {
    setFramesLoading(true);
    try {
      const r = await fetch("/api/admin/frames?includeInactive=true");
      if (!r.ok) { setFrames([]); return; }
      const data = await r.json();
      setFrames(Array.isArray(data.frames) ? data.frames : []);
    } finally {
      setFramesLoading(false);
    }
  }

  function openNewFrame() {
    setFormData(emptyFrame());
    setEditingFrame(null);
    setIsNewFrame(true);
    setFormError(null);
  }

  function openEditFrame(frame: Frame) {
    setFormData({
      name: frame.name,
      slug: frame.slug,
      description: frame.description ?? "",
      imageUrl: frame.imageUrl ?? null,
      availableSizes: [...frame.availableSizes],
      priceCents: frame.priceCents,
      isActive: frame.isActive,
      sortOrder: frame.sortOrder,
    });
    setEditingFrame(frame);
    setIsNewFrame(false);
    setFormError(null);
  }

  function closeForm() {
    setEditingFrame(null);
    setIsNewFrame(false);
    setFormError(null);
  }

  function patchForm<K extends keyof Omit<Frame, "id">>(key: K, value: Omit<Frame, "id">[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSize(size: string) {
    setFormData((prev) => ({
      ...prev,
      availableSizes: prev.availableSizes.includes(size)
        ? prev.availableSizes.filter((s) => s !== size)
        : [...prev.availableSizes, size],
    }));
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFormError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/frames/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      patchForm("imageUrl", data.imageUrl);
    } catch (err: any) {
      setFormError(err.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    if (!formData.name.trim()) { setFormError("Name is required."); return; }
    const slug = formData.slug.trim() || slugify(formData.name);
    setSaving(true);
    setFormError(null);

    try {
      const payload = { ...formData, slug };
      let res: Response;

      if (isNewFrame) {
        res = await fetch("/api/admin/frames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (editingFrame) {
        res = await fetch(`/api/admin/frames/${editingFrame.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else return;

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");

      await loadFrames();
      closeForm();
    } catch (err: any) {
      setFormError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(frameId: string, frameName: string) {
    if (!confirm(`Delete frame "${frameName}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/frames/${frameId}`, { method: "DELETE" });
    if (res.ok) {
      setFrames((prev) => prev.filter((f) => f.id !== frameId));
    }
  }

  const showForm = isNewFrame || !!editingFrame;

  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white/90 p-2 shadow-[0_10px_35px_rgba(26,22,20,0.06)]">
        <nav className="grid gap-2 md:grid-cols-2">
          {[
            { id: "overview" as const, label: "Workflow Overview", icon: BarChart3 },
            { id: "frames" as const, label: "Frame Management", icon: FrameIcon },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-[#1a1614] text-white shadow-[0_10px_30px_rgba(26,22,20,0.18)]"
                  : "text-[#6b5d54] hover:bg-[#f8f1e6] hover:text-[#1a1614]"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
            </div>
          ) : stats ? (
            <>
              {/* Stat cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<Sparkles className="h-5 w-5" />} label="Total conversions" value={stats.total} />
                <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={stats.completed} accent="text-emerald-600" />
                <StatCard icon={<XCircle className="h-5 w-5" />} label="Failed" value={stats.failed} accent="text-red-600" />
                <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Success rate" value={`${stats.successRate}%`} sub={`${stats.totalFrames} frames configured`} />
              </div>

              {/* Style breakdown */}
              <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6">
                <h3 className="text-base font-bold text-[#1a1614]">Conversions by style</h3>
                {stats.byStyle.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {stats.byStyle.map((row) => {
                      const pct = stats.total > 0 ? Math.round((row.count / stats.total) * 100) : 0;
                      return (
                        <div key={row.style}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-semibold text-[#1a1614]">
                              {STYLE_LABELS[row.style] ?? row.style}
                            </span>
                            <span className="text-[#6b5d54]">{row.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#f0e8da]">
                            <div
                              className="h-2 rounded-full bg-[#d4a574] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#6b5d54]">No conversion data yet.</p>
                )}
              </div>

              {/* Recent sessions */}
              <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6">
                <h3 className="text-base font-bold text-[#1a1614]">Recent sessions</h3>
                {stats.recentSessions.length > 0 ? (
                  <div className="mt-4 overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#f0e8da] text-left text-xs font-bold uppercase tracking-widest text-[#8a7a6f]">
                          <th className="pb-3 pr-4">Style</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 pr-4">User</th>
                          <th className="pb-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f7f1e8]">
                        {stats.recentSessions.map((s) => (
                          <tr key={s.id}>
                            <td className="py-3 pr-4 font-semibold text-[#1a1614]">
                              {STYLE_LABELS[s.stylePreset] ?? s.stylePreset}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOUR[s.status] ?? "bg-gray-100 text-gray-700"}`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-[#6b5d54]">
                              {s.user?.name ?? s.user?.email ?? "Guest"}
                            </td>
                            <td className="py-3 text-[#8a7a6f]">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#6b5d54]">No sessions yet. Generate a painting from the studio to see activity here.</p>
                )}
              </div>

              {/* Workflow diagram */}
              <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-[#1a1614] p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/60">AI painting workflow</p>
                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  {[
                    { step: "1", icon: <ImagePlus className="h-5 w-5" />, title: "Upload photo", body: "Customer uploads source image in the AI studio." },
                    { step: "2", icon: <Palette className="h-5 w-5" />, title: "Choose style", body: "Select Monet, Cézanne, Van Gogh, or Ukiyo-e." },
                    { step: "3", icon: <Sparkles className="h-5 w-5" />, title: "OpenAI generates", body: "gpt-image-1 renders a professional oil painting." },
                    { step: "4", icon: <FrameIcon className="h-5 w-5" />, title: "Order + frame", body: "Customer picks canvas size and frame, then checks out via Stripe." },
                  ].map((w) => (
                    <div key={w.step} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-[#d4a574]">
                          {w.icon}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white/50">Step {w.step}</span>
                      </div>
                      <p className="font-semibold">{w.title}</p>
                      <p className="text-sm text-white/60">{w.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#6b5d54]">Could not load stats.</p>
          )}
        </div>
      )}

      {/* ── FRAMES TAB ── */}
      {tab === "frames" && (
        <div className="space-y-6">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#1a1614]">Frame catalogue</h3>
              <p className="text-sm text-[#6b5d54]">
                Frames appear in the AI painting studio for customers to select during checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewFrame}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1a1614] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2a2624]"
            >
              <Plus className="h-4 w-4" />
              Add frame
            </button>
          </div>

          {/* Frame list */}
          {framesLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-[#d4a574]" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  className={`rounded-[1.75rem] border-2 bg-white p-5 shadow-[0_8px_24px_rgba(26,22,20,0.05)] ${
                    frame.isActive ? "border-[#eadfcb]" : "border-[#e0d8d0] opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {frame.imageUrl ? (
                      <img
                        src={frame.imageUrl}
                        alt={frame.name}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f4ede0]">
                        <FrameIcon className="h-8 w-8 text-[#c89860]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#1a1614] truncate">{frame.name}</p>
                        {!frame.isActive && (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-[#6b5d54]">
                        {frame.priceCents === 0 ? "No surcharge" : `+$${(frame.priceCents / 100).toFixed(0)}`}
                      </p>
                      {frame.description && (
                        <p className="mt-1 text-xs text-[#8a7a6f] line-clamp-2">{frame.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {frame.availableSizes.map((sz) => (
                          <span key={sz} className="rounded-full bg-[#f4ede0] px-2 py-0.5 text-xs text-[#8a7a6f]">
                            {sz}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditFrame(frame)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#1a1614] hover:bg-[#f8f1e6]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(frame.id, frame.name)}
                      className="flex items-center justify-center rounded-2xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {frames.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-[#eadfcb] py-14 text-center">
                  <FrameIcon className="h-10 w-10 text-[#c89860]" />
                  <p className="font-semibold text-[#1a1614]">No frames yet</p>
                  <p className="text-sm text-[#6b5d54]">
                    Add your first frame to make it available in the AI painting studio.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Frame form (inline) ── */}
          {showForm && (
            <div className="rounded-[1.75rem] border-2 border-[#d4a574] bg-white p-6 shadow-[0_16px_50px_rgba(212,165,116,0.18)]">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1a1614]">
                  {isNewFrame ? "New frame" : `Edit — ${editingFrame?.name}`}
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl p-1.5 hover:bg-[#f8f1e6]"
                >
                  <XCircle className="h-5 w-5 text-[#8a7a6f]" />
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Name */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-[#1a1614]">Name *</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      patchForm("name", e.target.value);
                      if (!editingFrame) patchForm("slug", slugify(e.target.value));
                    }}
                    placeholder="e.g. Black Wood"
                    className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#c89860]"
                  />
                </label>

                {/* Slug */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-[#1a1614]">Slug *</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => patchForm("slug", e.target.value)}
                    placeholder="e.g. black-wood"
                    className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#c89860]"
                  />
                </label>

                {/* Description */}
                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-[#1a1614]">Description</span>
                  <input
                    type="text"
                    value={formData.description ?? ""}
                    onChange={(e) => patchForm("description", e.target.value)}
                    placeholder="Short description shown to customers"
                    className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#c89860]"
                  />
                </label>

                {/* Price */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-[#1a1614]">Surcharge (cents)</span>
                  <input
                    type="number"
                    value={formData.priceCents}
                    onChange={(e) => patchForm("priceCents", Number(e.target.value) || 0)}
                    min={0}
                    className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#c89860]"
                  />
                  <p className="mt-1 text-xs text-[#8a7a6f]">
                    ${(formData.priceCents / 100).toFixed(2)} — 0 = no surcharge
                  </p>
                </label>

                {/* Sort order */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-[#1a1614]">Sort order</span>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => patchForm("sortOrder", Number(e.target.value) || 0)}
                    min={0}
                    className="w-full rounded-2xl border border-[#ddcfbb] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#c89860]"
                  />
                </label>

                {/* Available sizes */}
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-[#1a1614]">Available canvas sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {CANVAS_SIZE_CHOICES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                          formData.availableSizes.includes(sz)
                            ? "border-[#d4a574] bg-[#fff7eb] text-[#1a1614]"
                            : "border-[#eadfcb] text-[#8a7a6f] hover:border-[#d4c7ad]"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame image */}
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-[#1a1614]">Frame image</p>
                  <div className="flex flex-wrap items-center gap-4">
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Frame preview"
                        className="h-24 w-24 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#f4ede0]">
                        <FrameIcon className="h-8 w-8 text-[#c89860]" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#eadfcb] px-4 py-2.5 text-sm font-semibold text-[#1a1614] hover:bg-[#f8f1e6] disabled:opacity-60"
                      >
                        {uploadingImage ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
                        ) : (
                          <><ImagePlus className="h-4 w-4" />Upload image</>
                        )}
                      </button>
                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => patchForm("imageUrl", null)}
                          className="block text-xs text-red-500 hover:underline"
                        >
                          Remove image
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadImage}
                      />
                    </div>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => patchForm("isActive", !formData.isActive)}
                      className={`relative h-6 w-11 rounded-full transition ${formData.isActive ? "bg-[#1a1614]" : "bg-[#d0c8bc]"}`}
                    >
                      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${formData.isActive ? "left-5" : "left-0.5"}`} />
                    </div>
                    <span className="text-sm font-semibold text-[#1a1614]">
                      {formData.isActive ? "Active — visible in studio" : "Inactive — hidden from customers"}
                    </span>
                  </label>
                </div>
              </div>

              {formError && (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1a1614] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2a2624] disabled:opacity-60"
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save frame</>}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-2xl border border-[#eadfcb] px-5 py-2.5 text-sm font-semibold text-[#6b5d54] hover:bg-[#f8f1e6]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
