"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, CheckCircle, Clock, Upload, X, Play,
  Image as ImageIcon, AlertCircle, Loader2, Plus,
  Eye, EyeOff, Trash2, ChevronDown, ThumbsUp, ThumbsDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type WorkUpdate = {
  id: string;
  title: string;
  description: string | null;
  imageUrls: string[];
  videoUrls: string[];
  step: string;
  isVisibleToCustomer: boolean;
  createdAt: string;
  artist: { id: string; name: string | null; image: string | null };
};

type Commission = {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  phone: string | null;
  paintingType: string;
  size: string;
  surface: string;
  style: string;
  quantity: string;
  deadline: string | null;
  budget: string | null;
  deliveryCity: string | null;
  notes: string | null;
  referenceImageUrls: string[];
  estimatedRange: string | null;
  timeline: string | null;
  status: string;
  adminNotes: string | null;
  assignedArtist: { id: string; name: string | null; email: string; image: string | null } | null;
  workUpdates: WorkUpdate[];
};

type MediaFile = {
  id: string;
  file: File;
  localUrl: string;
  cloudUrl: string | null;
  type: "image" | "video";
  uploading: boolean;
  error: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { value: "sketch",       label: "Initial Sketch" },
  { value: "base_coat",    label: "Base Coat" },
  { value: "main_elements",label: "Main Elements" },
  { value: "details",      label: "Fine Details" },
  { value: "finishing",    label: "Finishing Touches" },
  { value: "final",        label: "Final Result" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "Pending Review",  color: "text-amber-700 bg-amber-50 border-amber-200" },
  QUOTED:      { label: "Quote Sent",      color: "text-blue-700 bg-blue-50 border-blue-200" },
  APPROVED:    { label: "Approved",        color: "text-purple-700 bg-purple-50 border-purple-200" },
  ASSIGNED:    { label: "Assigned to You", color: "text-orange-700 bg-orange-50 border-orange-200" },
  IN_PROGRESS: { label: "In Progress",     color: "text-[#a87945] bg-[#fdf8f1] border-[#eadfcb]" },
  REVIEW:      { label: "Under Review",    color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  REVISION:    { label: "Needs Revision",  color: "text-red-700 bg-red-50 border-red-200" },
  COMPLETED:   { label: "Completed",       color: "text-green-700 bg-green-50 border-green-200" },
  CANCELLED:   { label: "Cancelled",       color: "text-gray-500 bg-gray-50 border-gray-200" },
};

const TYPE_LABELS: Record<string, string> = {
  portrait: "Portrait", landscape: "Landscape", interior: "Interior",
  event: "Event", pet: "Pet Portrait", custom: "Custom",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ArtistCommissionDetail({
  commissionId,
  artistId,
  artistName,
  isAdmin,
}: {
  commissionId: string;
  artistId: string;
  artistName: string;
  isAdmin: boolean;
}) {
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // New update form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle]           = useState("");
  const [formDesc, setFormDesc]             = useState("");
  const [formStep, setFormStep]             = useState("sketch");
  const [formVisible, setFormVisible]       = useState(true);
  const [mediaFiles, setMediaFiles]         = useState<MediaFile[]>([]);
  const [submitting, setSubmitting]         = useState(false);
  const [formError, setFormError]           = useState<string | null>(null);

  // Status change
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Decline
  const [showDecline, setShowDecline]   = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining]       = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/artist/commissions/${commissionId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setCommission(d.commission);
      })
      .catch(() => setError("Failed to load commission."))
      .finally(() => setLoading(false));
  }, [commissionId]);

  useEffect(() => { load(); }, [load]);

  // ── Media upload ──────────────────────────────────────────────────────────

  async function handleFilesAdded(files: FileList | null) {
    if (!files) return;
    const MAX = 10;
    const remaining = MAX - mediaFiles.length;
    const toAdd = Array.from(files).slice(0, remaining);

    const entries: MediaFile[] = toAdd.map(file => ({
      id:         Math.random().toString(36).slice(2),
      file,
      localUrl:   URL.createObjectURL(file),
      cloudUrl:   null,
      type:       file.type.startsWith("video/") ? "video" : "image",
      uploading:  true,
      error:      null,
    }));

    setMediaFiles(prev => [...prev, ...entries]);

    for (const entry of entries) {
      const fd = new FormData();
      fd.append("file", entry.file);
      fetch("/api/artist/upload", { method: "POST", body: fd })
        .then(r => r.json())
        .then(data =>
          setMediaFiles(prev => prev.map(m =>
            m.id === entry.id
              ? { ...m, uploading: false, cloudUrl: data.url ?? null, error: data.error ?? null }
              : m
          ))
        )
        .catch(() =>
          setMediaFiles(prev => prev.map(m =>
            m.id === entry.id ? { ...m, uploading: false, error: "Upload failed." } : m
          ))
        );
    }
  }

  function removeMedia(id: string) {
    setMediaFiles(prev => {
      const m = prev.find(f => f.id === id);
      if (m) URL.revokeObjectURL(m.localUrl);
      return prev.filter(f => f.id !== id);
    });
  }

  // ── Submit update ─────────────────────────────────────────────────────────

  async function submitUpdate() {
    if (!formTitle.trim()) { setFormError("Title is required."); return; }
    if (!formStep)          { setFormError("Please select a painting step."); return; }
    if (mediaFiles.some(m => m.uploading)) {
      setFormError("Please wait for uploads to finish.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const imageUrls = mediaFiles.filter(m => m.type === "image" && m.cloudUrl).map(m => m.cloudUrl!);
    const videoUrls = mediaFiles.filter(m => m.type === "video" && m.cloudUrl).map(m => m.cloudUrl!);

    const res = await fetch(`/api/artist/commissions/${commissionId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formTitle.trim(),
        description: formDesc.trim() || null,
        imageUrls,
        videoUrls,
        step: formStep,
        isVisibleToCustomer: formVisible,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFormError(data.error ?? "Failed to post update.");
      return;
    }

    // Reset form
    mediaFiles.forEach(m => URL.revokeObjectURL(m.localUrl));
    setMediaFiles([]);
    setFormTitle("");
    setFormDesc("");
    setFormStep("sketch");
    setFormVisible(true);
    setShowForm(false);
    load();
  }

  // ── Status change ─────────────────────────────────────────────────────────

  async function updateStatus(status: string) {
    setStatusUpdating(true);
    await fetch(`/api/artist/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStatusUpdating(false);
    load();
  }

  async function acceptCommission() {
    setStatusUpdating(true);
    await fetch(`/api/artist/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    setStatusUpdating(false);
    load();
  }

  async function declineCommission() {
    setDeclining(true);
    const res = await fetch(`/api/artist/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline", reason: declineReason.trim() || "Declined from detail page." }),
    });
    setDeclining(false);
    if (res.ok) {
      window.location.href = "/artist";
    }
  }

  async function deleteUpdate(updateId: string) {
    if (!confirm("Delete this update?")) return;
    await fetch(`/api/artist/commissions/${commissionId}/updates`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateId }),
    });
    load();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
      </div>
    );
  }

  if (error || !commission) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-10 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 font-semibold text-red-700">{error ?? "Commission not found."}</p>
        <Link href="/artist" className="mt-4 inline-block text-sm text-[#d4a574] hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[commission.status] ?? STATUS_CONFIG["PENDING"];
  const canPostUpdate = ["ASSIGNED", "IN_PROGRESS", "REVISION"].includes(commission.status);

  return (
    <div className="space-y-8">
      {/* Decline modal */}
      {showDecline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1a1614]">Decline Commission</h2>
                <p className="mt-1 text-sm text-[#8c7764]">
                  <span className="font-mono">{commission.reference}</span> will return to the admin queue.
                </p>
              </div>
              <button onClick={() => setShowDecline(false)} className="rounded-full p-2 text-[#8c7764] hover:bg-[#f8f1e6]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
                Reason (optional)
              </span>
              <textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                rows={4}
                autoFocus
                placeholder="e.g. Schedule conflict, outside my specialty…"
                className="w-full rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none focus:border-[#d4a574]"
              />
            </label>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDecline(false)}
                className="flex-1 rounded-full border border-[#eadfcb] py-3 text-sm font-semibold text-[#6b5d54] hover:bg-[#f8f1e6]"
              >
                Keep It
              </button>
              <button
                onClick={declineCommission}
                disabled={declining}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {declining ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                Decline Commission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back + header */}
      <div>
        <Link href="/artist" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#8c7764] hover:text-[#1a1614]">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.color}`}>
              {cfg.label}
            </span>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#1a1614]">
              {TYPE_LABELS[commission.paintingType] ?? commission.paintingType} Commission
            </h1>
            <p className="mt-1 font-mono text-sm text-[#8c7764]">{commission.reference}</p>
          </div>

          {/* Status actions */}
          <div className="flex flex-wrap gap-2">
            {commission.status === "ASSIGNED" && (
              <>
                <button
                  onClick={acceptCommission}
                  disabled={statusUpdating}
                  className="flex items-center gap-2 rounded-full bg-[#1a1614] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:opacity-60"
                >
                  {statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                  Accept & Start
                </button>
                <button
                  onClick={() => setShowDecline(true)}
                  disabled={statusUpdating}
                  className="flex items-center gap-2 rounded-full border-2 border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  <ThumbsDown className="h-4 w-4" /> Decline
                </button>
              </>
            )}
            {commission.status === "IN_PROGRESS" && (
              <button
                onClick={() => updateStatus("REVIEW")}
                disabled={statusUpdating}
                className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Submit for Review
              </button>
            )}
            {commission.status === "REVISION" && (
              <button
                onClick={() => updateStatus("IN_PROGRESS")}
                disabled={statusUpdating}
                className="flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Resume Work
              </button>
            )}
            <Link
              href={`/commission/${commission.reference}`}
              target="_blank"
              className="flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white px-5 py-2.5 text-sm font-semibold text-[#6b5d54] transition hover:border-[#d4a574] hover:text-[#1a1614]"
            >
              <Eye className="h-4 w-4" />
              Customer View
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: commission details */}
        <div className="space-y-6 lg:col-span-1">
          {/* Customer info */}
          <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_4px_20px_rgba(26,22,20,0.06)]">
            <h2 className="font-serif text-lg font-bold text-[#1a1614]">Customer</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-[#8c7764]">Name</dt><dd className="font-semibold text-[#1a1614]">{commission.customerName}</dd></div>
              <div><dt className="text-[#8c7764]">Email</dt><dd className="text-[#6b5d54]">{commission.email}</dd></div>
              {commission.phone && <div><dt className="text-[#8c7764]">Phone</dt><dd className="text-[#6b5d54]">{commission.phone}</dd></div>}
              {commission.deliveryCity && <div><dt className="text-[#8c7764]">City</dt><dd className="text-[#6b5d54]">{commission.deliveryCity}</dd></div>}
            </dl>
          </div>

          {/* Painting specs */}
          <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_4px_20px_rgba(26,22,20,0.06)]">
            <h2 className="font-serif text-lg font-bold text-[#1a1614]">Painting Specs</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-[#8c7764]">Type</dt><dd className="font-semibold text-[#1a1614]">{TYPE_LABELS[commission.paintingType] ?? commission.paintingType}</dd></div>
              <div><dt className="text-[#8c7764]">Size</dt><dd className="text-[#6b5d54]">{commission.size}</dd></div>
              <div><dt className="text-[#8c7764]">Surface</dt><dd className="text-[#6b5d54]">{commission.surface}</dd></div>
              <div><dt className="text-[#8c7764]">Style</dt><dd className="text-[#6b5d54]">{commission.style}</dd></div>
              <div><dt className="text-[#8c7764]">Quantity</dt><dd className="text-[#6b5d54]">{commission.quantity}</dd></div>
              {commission.deadline && <div><dt className="text-[#8c7764]">Deadline</dt><dd className="text-orange-600 font-semibold">{commission.deadline}</dd></div>}
              {commission.budget && <div><dt className="text-[#8c7764]">Budget</dt><dd className="text-[#6b5d54]">{commission.budget}</dd></div>}
            </dl>
            {commission.estimatedRange && (
              <div className="mt-4 rounded-xl bg-[#fdf8f1] p-3">
                <p className="text-xs text-[#8c7764]">Estimated</p>
                <p className="font-serif text-lg font-bold text-[#a87945]">{commission.estimatedRange}</p>
                {commission.timeline && <p className="text-xs text-[#8c7764]">{commission.timeline}</p>}
              </div>
            )}
          </div>

          {/* Notes */}
          {commission.notes && (
            <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_4px_20px_rgba(26,22,20,0.06)]">
              <h2 className="font-serif text-lg font-bold text-[#1a1614]">Customer Notes</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#6b5d54]">{commission.notes}</p>
            </div>
          )}

          {/* Admin notes */}
          {commission.adminNotes && (
            <div className="rounded-[1.75rem] border-2 border-orange-200 bg-orange-50 p-6">
              <h2 className="font-serif text-lg font-bold text-orange-800">Admin Notes</h2>
              <p className="mt-3 text-sm leading-relaxed text-orange-700">{commission.adminNotes}</p>
            </div>
          )}

          {/* Reference images */}
          {commission.referenceImageUrls.length > 0 && (
            <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_4px_20px_rgba(26,22,20,0.06)]">
              <h2 className="font-serif text-lg font-bold text-[#1a1614]">Reference Images</h2>
              <p className="mt-1 text-xs text-[#8c7764]">Uploaded by customer for reference</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {commission.referenceImageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-xl">
                    <Image
                      src={url}
                      alt={`Reference ${i + 1}`}
                      width={200}
                      height={150}
                      className="h-28 w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                      <Eye className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: work updates */}
        <div className="space-y-6 lg:col-span-2">
          {/* Post new update */}
          {canPostUpdate && (
            <div className="rounded-[1.75rem] border-2 border-[#d4a574] bg-white p-6 shadow-[0_4px_20px_rgba(212,165,116,0.12)]">
              <button
                onClick={() => setShowForm(v => !v)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4a574] text-white">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-[#1a1614]">Post Progress Update</p>
                    <p className="text-xs text-[#8c7764]">Share painting progress with the customer</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-[#8c7764] transition ${showForm ? "rotate-180" : ""}`} />
              </button>

              {showForm && (
                <div className="mt-6 space-y-4 border-t border-[#f0e4cf] pt-6">
                  {formError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      {formError}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
                        Update Title *
                      </label>
                      <input
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        placeholder="e.g. Background completed"
                        className="w-full rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none focus:border-[#d4a574]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
                        Painting Step *
                      </label>
                      <select
                        value={formStep}
                        onChange={e => setFormStep(e.target.value)}
                        className="w-full rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none focus:border-[#d4a574]"
                      >
                        {STEPS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
                      Description
                    </label>
                    <textarea
                      value={formDesc}
                      onChange={e => setFormDesc(e.target.value)}
                      rows={3}
                      placeholder="Describe what you've done in this update..."
                      className="w-full rounded-2xl border-2 border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none focus:border-[#d4a574]"
                    />
                  </div>

                  {/* Media upload */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7764]">
                      Photos & Videos
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={e => handleFilesAdded(e.target.files)}
                    />

                    {mediaFiles.length > 0 && (
                      <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {mediaFiles.map(m => (
                          <div key={m.id} className="group relative overflow-hidden rounded-xl border border-[#eadfcb] bg-[#faf6ef]">
                            {m.type === "image" ? (
                              <img
                                src={m.localUrl}
                                alt=""
                                className="h-20 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-20 w-full items-center justify-center bg-[#1a1614]">
                                <Play className="h-6 w-6 text-[#d4a574]" />
                              </div>
                            )}

                            {m.uploading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                                <Loader2 className="h-5 w-5 animate-spin text-[#d4a574]" />
                              </div>
                            )}
                            {m.cloudUrl && !m.uploading && (
                              <div className="absolute right-1 top-1 rounded-full bg-green-500 p-0.5">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                            {m.error && (
                              <div className="absolute inset-0 flex items-center justify-center bg-red-50/80">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              </div>
                            )}
                            <button
                              onClick={() => removeMedia(m.id)}
                              className="absolute left-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}

                        {mediaFiles.length < 10 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-[#eadfcb] bg-[#faf6ef] text-[#8c7764] transition hover:border-[#d4a574] hover:text-[#d4a574]"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    )}

                    {mediaFiles.length === 0 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#eadfcb] bg-[#faf6ef] py-8 text-[#8c7764] transition hover:border-[#d4a574] hover:bg-[#fdf8f1] hover:text-[#d4a574]"
                      >
                        <Upload className="h-7 w-7" />
                        <span className="text-sm font-medium">Upload photos or videos</span>
                        <span className="text-xs">Images up to 15MB · Videos up to 100MB · Max 10 files</span>
                      </button>
                    )}
                  </div>

                  {/* Visibility toggle */}
                  <div className="flex items-center justify-between rounded-2xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-[#6b5d54]">
                      {formVisible ? <Eye className="h-4 w-4 text-[#d4a574]" /> : <EyeOff className="h-4 w-4 text-[#8c7764]" />}
                      <span>{formVisible ? "Visible to customer" : "Hidden from customer"}</span>
                    </div>
                    <button
                      onClick={() => setFormVisible(v => !v)}
                      className={`relative h-6 w-11 rounded-full transition ${formVisible ? "bg-[#d4a574]" : "bg-[#eadfcb]"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${formVisible ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowForm(false); setFormError(null); }}
                      className="flex-1 rounded-full border border-[#eadfcb] py-3 text-sm font-semibold text-[#6b5d54] transition hover:bg-[#f8f1e6]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitUpdate}
                      disabled={submitting || mediaFiles.some(m => m.uploading)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1a1614] py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:opacity-60"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Post Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Work updates timeline */}
          <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_4px_20px_rgba(26,22,20,0.06)]">
            <h2 className="font-serif text-xl font-bold text-[#1a1614]">
              Progress Updates
              <span className="ml-2 text-base font-normal text-[#8c7764]">({commission.workUpdates.length})</span>
            </h2>

            {commission.workUpdates.length === 0 ? (
              <div className="py-12 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-[#d4a574] opacity-40" />
                <p className="mt-3 text-sm text-[#8c7764]">No updates posted yet.</p>
                {canPostUpdate && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-3 text-sm font-semibold text-[#d4a574] hover:underline"
                  >
                    Post your first update →
                  </button>
                )}
              </div>
            ) : (
              <div className="relative mt-6 space-y-8 before:absolute before:left-4 before:top-0 before:h-full before:w-0.5 before:bg-[#f0e4cf]">
                {commission.workUpdates.map((update, idx) => {
                  const stepLabel = STEPS.find(s => s.value === update.step)?.label ?? update.step;
                  return (
                    <div key={update.id} className="relative pl-12">
                      <div className={`absolute left-0 flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                        idx === commission.workUpdates.length - 1
                          ? "border-[#d4a574] bg-[#d4a574] text-white"
                          : "border-[#eadfcb] bg-white text-[#8c7764]"
                      } text-xs font-bold shadow-sm`}>
                        {idx + 1}
                      </div>

                      <div className="rounded-2xl border border-[#eadfcb] bg-[#faf6ef] p-5">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[#1a1614]">{update.title}</p>
                            <p className="text-xs text-[#8c7764]">
                              {stepLabel} ·{" "}
                              {new Date(update.createdAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                              update.isVisibleToCustomer
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {update.isVisibleToCustomer ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              {update.isVisibleToCustomer ? "Visible" : "Hidden"}
                            </span>
                            {(update.artist.id === artistId || isAdmin) && (
                              <button
                                onClick={() => deleteUpdate(update.id)}
                                className="rounded-full p-1.5 text-[#8c7764] transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {update.description && (
                          <p className="mb-3 text-sm leading-relaxed text-[#6b5d54]">{update.description}</p>
                        )}

                        {update.imageUrls.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {update.imageUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-xl">
                                <Image
                                  src={url}
                                  alt={`Update ${idx + 1} image ${i + 1}`}
                                  width={200}
                                  height={150}
                                  className="h-24 w-full object-cover transition group-hover:scale-105"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        {update.videoUrls.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {update.videoUrls.map((url, i) => (
                              <video key={i} src={url} controls className="w-full rounded-xl" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
