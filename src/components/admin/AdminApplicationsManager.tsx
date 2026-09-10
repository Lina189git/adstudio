"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle, Clock, Loader2, MapPin, RefreshCw, Trash2, XCircle,
} from "lucide-react";
import AgreementCard from "@/components/AgreementCard";


type ShippingAddr = { name?: string; address1?: string; address2?: string; city?: string; state?: string; zip?: string; country?: string };
type InfluencerProfile = { shippingAddress: ShippingAddr | null; instagram?: string | null; tiktok?: string | null; youtube?: string | null; followerCount?: number | null };
type Product = { id: string; name: string; imageUrl: string | null; commissionType: string; commissionRate: number; commissionFixed: number; sampleStock: number; basePriceCents: number; taskRequirements: string | null };
type Influencer = { id: string; name: string | null; email: string; image: string | null; influencerProfile?: InfluencerProfile | null };
type Sample = { status: string; trackingNumber: string | null } | null;
type Task = { id: string; ref: string; status: string } | null;
type ContactInfo = { phone?: string | null; email?: string | null; platforms?: string[]; handles?: Record<string, string>; agreedToTerms?: boolean; agreedAt?: string | null };
type Application = {
  id: string; ref: string; status: string; pitch: string | null; plannedContent: string | null;
  contactInfo?: ContactInfo | null;
  agreedRate: number | null; agreedAmount: number | null; adminNotes: string | null;
  approvedAt: string | null; rejectedAt: string | null; createdAt: string;
  product: Product; influencer: Influencer; sample: Sample; task: Task;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED:  { label: "Approved",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED:  { label: "Rejected",  cls: "bg-red-50 text-red-700 border-red-200" },
  WITHDRAWN: { label: "Withdrawn", cls: "bg-gray-50 text-gray-500 border-gray-200" },
};
const money = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const pct = (r: number) => `${(r * 100).toFixed(0)}%`;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const numFmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);

function CommissionBadge({ app }: { app: Application }) {
  if (app.agreedAmount != null) return <span className="font-semibold text-[#1a1614]">{money(app.agreedAmount)} fixed</span>;
  if (app.agreedRate != null)   return <span className="font-semibold text-[#1a1614]">{pct(app.agreedRate)} of sale</span>;
  if (app.product.commissionType === "FIXED") return <span className="text-[#6b5d54]">{money(app.product.commissionFixed)} fixed</span>;
  return <span className="text-[#6b5d54]">{pct(app.product.commissionRate)} of sale</span>;
}

function AddrBlock({ addr }: { addr: ShippingAddr | null | undefined }) {
  if (!addr) return <p className="text-xs text-[#a89a8e] italic">No shipping address on file</p>;
  return (
    <div className="space-y-0.5 text-sm text-[#1a1614]">
      {addr.name     && <p className="font-semibold">{addr.name}</p>}
      {addr.address1 && <p>{addr.address1}</p>}
      {addr.address2 && <p>{addr.address2}</p>}
      <p>{[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}</p>
      {addr.country  && <p className="text-xs text-[#8c7764]">{addr.country}</p>}
    </div>
  );
}

export default function AdminApplicationsManager() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/applications${q}`);
      const data = await res.json();
      setApplications(data.applications || []);
      setError("");
    } catch {
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void loadApplications(); }, [loadApplications]);

  const updateStatus = async (id: string, status: string, extra?: Record<string, unknown>) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: noteInputs[id] || undefined, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update.");
      setSuccess(`Application ${status.toLowerCase()}.`);
      setTimeout(() => setSuccess(""), 3000);
      await loadApplications();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update.");
    } finally {
      setSaving(null);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!window.confirm("Delete this application permanently?")) return;
    const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
    if (!res.ok) return setError("Failed to delete.");
    setSuccess("Application deleted.");
    await loadApplications();
  };

  const pending  = applications.filter((a) => a.status === "PENDING");
  const approved = applications.filter((a) => a.status === "APPROVED");
  const others   = applications.filter((a) => !["PENDING", "APPROVED"].includes(a.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a1614]">Influencer Applications</h2>
          <p className="mt-0.5 text-sm text-[#6b5d54]">Review pitches, approve applicants, and auto-create ad tasks.</p>
        </div>
        <div className="flex gap-2">
          {/* Summary pills */}
          {pending.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />{pending.length} pending
            </span>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]"
          >
            <option value="">All statuses</option>
            {["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"].map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <button onClick={() => void loadApplications()} className="inline-flex items-center rounded-xl border border-[#eadfcb] px-3 py-2.5 text-sm text-[#1a1614] transition hover:bg-[#f8f1e6]">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error   && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {/* List */}
      <div className="overflow-hidden rounded-[1.25rem] border border-[#eadfcb]">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#6b5d54]">
            <Loader2 className="h-4 w-4 animate-spin" />Loading...
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6b5d54]">No applications found.</div>
        ) : (
          <div className="divide-y divide-[#eadfcb]">
            {[...pending, ...approved, ...others].map((app) => {
              const st = STATUS[app.status] ?? { label: app.status, cls: "bg-gray-50 text-gray-500 border-gray-200" };
              const isExpanded = expandedId === app.id;
              const profile = app.influencer.influencerProfile;

              return (
                <div key={app.id} className="bg-white">
                  {/* ── Row ── */}
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 md:grid-cols-[1fr_150px_200px]">
                    {/* Product + influencer */}
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#eadfcb] bg-[#faf6ef]">
                        {app.product.imageUrl && (
                          <Image src={app.product.imageUrl} alt={app.product.name} fill sizes="48px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1a1614]">{app.product.name}</p>
                        <p className="text-xs text-[#8c7764]">
                          {app.influencer.name || app.influencer.email}
                          {profile?.followerCount ? ` · ${numFmt(profile.followerCount)} followers` : ""}
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-[#a89a8e]">
                          <CommissionBadge app={app} />
                          {app.task && (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              Task {app.task.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="hidden md:block">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${st.cls}`}>
                        {app.status === "PENDING"  && <Clock className="h-3 w-3" />}
                        {app.status === "APPROVED" && <CheckCircle className="h-3 w-3" />}
                        {app.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                        {st.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        className="rounded-full border border-[#eadfcb] px-3 py-1.5 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
                      >
                        {isExpanded ? "Collapse" : "Review"}
                      </button>
                      {app.status === "PENDING" && (
                        <>
                          <button
                            disabled={saving === app.id}
                            onClick={() => void updateStatus(app.id, "APPROVED")}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                          >
                            {saving === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                            Approve
                          </button>
                          <button
                            disabled={saving === app.id}
                            onClick={() => void updateStatus(app.id, "REJECTED")}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            <XCircle className="h-3 w-3" />Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => void deleteApplication(app.id)}
                        className="rounded-full border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded detail ── */}
                  {isExpanded && (
                    <div className="border-t border-[#eadfcb] bg-[#faf6ef] px-5 py-5 space-y-6">
                      <div className="grid gap-6 lg:grid-cols-3">

                        {/* Pitch + planned content */}
                        <div className="space-y-4 lg:col-span-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#8c7764]">Application details</p>
                          {app.pitch && (
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Pitch</p>
                              <p className="rounded-xl border border-[#eadfcb] bg-white p-3 text-sm text-[#1a1614]">{app.pitch}</p>
                            </div>
                          )}
                          {app.plannedContent && (
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Planned content</p>
                              <p className="rounded-xl border border-[#eadfcb] bg-white p-3 text-sm text-[#1a1614]">{app.plannedContent}</p>
                            </div>
                          )}
                          <div>
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Admin notes</p>
                            <textarea
                              rows={2}
                              value={noteInputs[app.id] ?? app.adminNotes ?? ""}
                              onChange={(e) => setNoteInputs((prev) => ({ ...prev, [app.id]: e.target.value }))}
                              placeholder="Internal notes..."
                              className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2 text-sm outline-none focus:border-[#d4a574]"
                            />
                            <button
                              onClick={() => void updateStatus(app.id, app.status, { adminNotes: noteInputs[app.id] })}
                              disabled={saving === app.id}
                              className="mt-1.5 rounded-xl border border-[#eadfcb] bg-white px-4 py-1.5 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6] disabled:opacity-60"
                            >
                              Save notes
                            </button>
                          </div>
                        </div>

                        {/* Influencer profile */}
                        <div className="space-y-4 lg:col-span-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#8c7764]">Influencer profile</p>
                          <div className="flex items-center gap-3 rounded-xl border border-[#eadfcb] bg-white p-3">
                            {app.influencer.image ? (
                              <img src={app.influencer.image} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1614] text-sm font-bold text-white">
                                {(app.influencer.name || app.influencer.email)[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-[#1a1614]">{app.influencer.name || "—"}</p>
                              <p className="text-xs text-[#8c7764]">{app.influencer.email}</p>
                              {profile?.followerCount && (
                                <p className="text-xs font-semibold text-[#d4a574]">{numFmt(profile.followerCount)} followers</p>
                              )}
                            </div>
                          </div>
                          {profile && (
                            <div className="space-y-1 rounded-xl border border-[#eadfcb] bg-white p-3">
                              {profile.tiktok    && <p className="flex items-center gap-2 text-xs text-[#6b5d54]"><span className="font-semibold w-14 shrink-0">TikTok</span>{profile.tiktok}</p>}
                              {profile.instagram && <p className="flex items-center gap-2 text-xs text-[#6b5d54]"><span className="font-semibold w-14 shrink-0">Instagram</span>{profile.instagram}</p>}
                              {profile.youtube   && <p className="flex items-center gap-2 text-xs text-[#6b5d54]"><span className="font-semibold w-14 shrink-0">YouTube</span>{profile.youtube}</p>}
                            </div>
                          )}

                          {/* Contact info submitted with application */}
                          {app.contactInfo && (app.contactInfo.email || app.contactInfo.phone || (app.contactInfo.platforms?.length ?? 0) > 0) && (
                            <div className="space-y-1.5 rounded-xl border border-[#d4a574]/40 bg-[#d4a574]/5 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c7764]">Submitted contact</p>
                              {app.contactInfo.email && (
                                <p className="flex items-center gap-2 text-xs text-[#6b5d54]">
                                  <span className="w-14 shrink-0 font-semibold">Email</span>
                                  <a href={`mailto:${app.contactInfo.email}`} className="text-[#d4a574] hover:underline truncate">{app.contactInfo.email}</a>
                                </p>
                              )}
                              {app.contactInfo.phone && (
                                <p className="flex items-center gap-2 text-xs text-[#6b5d54]">
                                  <span className="w-14 shrink-0 font-semibold">Phone</span>
                                  <a href={`tel:${app.contactInfo.phone}`} className="text-[#1a1614]">{app.contactInfo.phone}</a>
                                </p>
                              )}
                              {app.contactInfo.platforms && app.contactInfo.platforms.length > 0 && (
                                <div>
                                  <p className="mb-1 text-[10px] font-semibold text-[#8c7764]">Preferred platforms</p>
                                  <div className="flex flex-wrap gap-1">
                                    {app.contactInfo.platforms.map((p) => (
                                      <span key={p} className="rounded-full border border-[#eadfcb] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#1a1614] capitalize">{p}</span>
                                    ))}
                                  </div>
                                  {app.contactInfo.handles && Object.keys(app.contactInfo.handles).length > 0 && (
                                    <div className="mt-1.5 space-y-0.5">
                                      {Object.entries(app.contactInfo.handles).map(([p, handle]) => (
                                        <p key={p} className="flex items-center gap-2 text-xs text-[#6b5d54]">
                                          <span className="w-20 shrink-0 font-semibold capitalize">{p}</span>
                                          <span>{handle}</span>
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Agreement status badge */}
                              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                                app.contactInfo.agreedToTerms
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-amber-200 bg-amber-50 text-amber-800"
                              }`}>
                                {app.contactInfo.agreedToTerms ? (
                                  <>
                                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                                    Agreement signed
                                    {app.contactInfo.agreedAt && (
                                      <span className="ml-auto font-normal text-emerald-700">
                                        {new Date(app.contactInfo.agreedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    Agreement not yet signed
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-[#a89a8e]">Applied {fmt(app.createdAt)}</p>
                        </div>

                        {/* Ship-to address */}
                        <div className="space-y-4 lg:col-span-1">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8c7764]">
                            <MapPin className="h-3.5 w-3.5" />Sample ship-to address
                          </p>
                          <div className="rounded-xl border border-[#eadfcb] bg-white p-3">
                            <AddrBlock addr={profile?.shippingAddress} />
                          </div>
                          {/* Quick approve with note */}
                          {app.status === "PENDING" && (
                            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                              <p className="text-xs font-semibold text-emerald-800">
                                Approving will auto-create an Ad Task and notify the influencer.
                              </p>
                              <button
                                disabled={saving === app.id}
                                onClick={() => void updateStatus(app.id, "APPROVED")}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                              >
                                {saving === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                Approve &amp; create task
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Full partnership agreement ── */}
                      <AgreementCard
                        product={app.product}
                        creatorName={app.influencer.name}
                        agreedAt={app.contactInfo?.agreedAt}
                        adminView
                      />
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
