"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle, ChevronDown, ChevronUp, Clock, Loader2,
  MapPin, Package, RefreshCw, Truck, Video,
} from "lucide-react";

type ShippingAddr = {
  name?: string; address1?: string; address2?: string;
  city?: string; state?: string; zip?: string; country?: string;
};
type InfluencerProfile = {
  shippingAddress: ShippingAddr | null;
  instagram?: string | null; tiktok?: string | null; youtube?: string | null;
};
type Influencer = { id: string; name: string | null; email: string; image: string | null; influencerProfile?: InfluencerProfile | null };
type Product = { id: string; name: string; imageUrl: string | null };
type Sample = {
  status: string; trackingNumber: string | null; carrier: string | null;
  shippedAt: string | null; deliveredAt: string | null; notes: string | null;
} | null;
type Video = { id: string; title: string; status: string; createdAt: string };
type Task = {
  id: string; ref: string; status: string; readme: string | null; requirements: string[];
  deadline: string | null; createdAt: string;
  influencer: Influencer;
  application: { product: Product; sample: Sample };
  videos: Video[];
  payment: { status: string; amountCents: number } | null;
};

const TASK_BADGE: Record<string, { cls: string; label: string }> = {
  ACTIVE:             { cls: "bg-blue-50 text-blue-700 border-blue-200",   label: "Active" },
  SUBMITTED:          { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Submitted" },
  REVISION_REQUESTED: { cls: "bg-orange-50 text-orange-700 border-orange-200", label: "Revision" },
  APPROVED:           { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Approved" },
  COMPLETED:          { cls: "bg-purple-50 text-purple-700 border-purple-200", label: "Completed" },
  CANCELLED:          { cls: "bg-gray-100 text-gray-500 border-gray-200",  label: "Cancelled" },
};
const SHIP_STEPS = ["PREPARING", "SHIPPED", "IN_TRANSIT", "DELIVERED"];
const SHIP_COLORS: Record<string, string> = {
  PREPARING:  "bg-amber-50 text-amber-700 border-amber-200",
  SHIPPED:    "bg-blue-50 text-blue-700 border-blue-200",
  IN_TRANSIT: "bg-blue-50 text-blue-700 border-blue-200",
  DELIVERED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED:     "bg-red-50 text-red-700 border-red-200",
};
const money = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function ShipBar({ status }: { status: string }) {
  const idx = SHIP_STEPS.indexOf(status);
  if (idx === -1) return null;
  return (
    <div className="flex items-center gap-1">
      {SHIP_STEPS.map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-[#d4a574]" : "bg-[#eadfcb]"}`} />
      ))}
      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[#8c7764]">
        {status.replace(/_/g, " ")}
      </span>
    </div>
  );
}

function AddrBlock({ addr }: { addr: ShippingAddr | null | undefined }) {
  if (!addr) return <p className="text-xs text-[#a89a8e] italic">No shipping address on file</p>;
  return (
    <div className="space-y-0.5 text-sm text-[#1a1614]">
      {addr.name && <p className="font-semibold">{addr.name}</p>}
      {addr.address1 && <p>{addr.address1}</p>}
      {addr.address2 && <p>{addr.address2}</p>}
      <p>{[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}</p>
      {addr.country && <p>{addr.country}</p>}
    </div>
  );
}

export default function AdminTasksManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [taskEdits, setTaskEdits] = useState<Record<string, { readme?: string; requirements?: string; deadline?: string; status?: string }>>({});
  const [sampleEdits, setSampleEdits] = useState<Record<string, { trackingNumber?: string; carrier?: string; status?: string; notes?: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${statusFilter}` : "";
      const data = await (await fetch(`/api/admin/tasks${q}`)).json();
      setTasks(data.tasks || []);
      setError("");
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const save = async (taskId: string, overrideSample?: Record<string, string>) => {
    setSaving(taskId);
    const e = taskEdits[taskId] || {};
    const s = overrideSample ?? sampleEdits[taskId] ?? {};
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readme: e.readme,
          requirements: e.requirements
            ? e.requirements.split("\n").map((r) => r.trim()).filter(Boolean)
            : undefined,
          deadline: e.deadline || undefined,
          status: e.status || undefined,
          sample: Object.keys(s).length ? s : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save.");
      setSuccess("Task updated.");
      await load();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(null);
    }
  };

  const quickShip = async (task: Task, newStatus: string) => {
    const sample = task.application.sample;
    const merged: Record<string, string> = {
      ...(sampleEdits[task.id] || {}),
      status: newStatus,
      carrier: sampleEdits[task.id]?.carrier ?? sample?.carrier ?? "",
      trackingNumber: sampleEdits[task.id]?.trackingNumber ?? sample?.trackingNumber ?? "",
      notes: sampleEdits[task.id]?.notes ?? sample?.notes ?? "",
      ...(newStatus === "SHIPPED"    ? { shippedAt: new Date().toISOString() }   : {}),
      ...(newStatus === "DELIVERED"  ? { deliveredAt: new Date().toISOString() } : {}),
    };
    setSampleEdits((prev) => ({ ...prev, [task.id]: merged }));
    await save(task.id, merged);
  };

  const patchTask   = (id: string, k: string, v: string) => setTaskEdits((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));
  const patchSample = (id: string, k: string, v: string) => setSampleEdits((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a1614]">Ad Tasks</h2>
          <p className="mt-0.5 text-sm text-[#6b5d54]">Manage task briefs, track sample shipments, and review video submissions.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]"
          >
            <option value="">All statuses</option>
            {["ACTIVE", "SUBMITTED", "REVISION_REQUESTED", "APPROVED", "COMPLETED", "CANCELLED"].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <button onClick={() => void load()} className="inline-flex items-center rounded-xl border border-[#eadfcb] px-3 py-2.5 text-sm text-[#1a1614] transition hover:bg-[#f8f1e6]">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {/* Task list */}
      <div className="overflow-hidden rounded-[1.25rem] border border-[#eadfcb]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#6b5d54]">
            <Loader2 className="h-4 w-4 animate-spin" />Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6b5d54]">No tasks found.</div>
        ) : (
          <div className="divide-y divide-[#eadfcb]">
            {tasks.map((task) => {
              const badge = TASK_BADGE[task.status] ?? { cls: "bg-gray-50 text-gray-500 border-gray-200", label: task.status };
              const isOpen = expandedId === task.id;
              const e = taskEdits[task.id] || {};
              const s = sampleEdits[task.id] || {};
              const sample = task.application.sample;
              const shipStatus = s.status ?? sample?.status ?? null;
              const shipAddr = task.influencer?.influencerProfile?.shippingAddress;

              return (
                <div key={task.id} className="bg-white">
                  {/* ── Row ── */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Product thumb */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#eadfcb] bg-[#faf6ef]">
                      {task.application.product.imageUrl && (
                        <Image src={task.application.product.imageUrl} alt={task.application.product.name} fill sizes="48px" className="object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-semibold text-[#1a1614]">{task.application.product.name}</p>
                      <p className="truncate text-xs text-[#8c7764]">{task.influencer.name || task.influencer.email}</p>
                      {shipStatus && shipStatus !== "FAILED" && <ShipBar status={shipStatus} />}
                      {!sample && (
                        <p className="flex items-center gap-1 text-[10px] text-[#c0b4aa]">
                          <Package className="h-3 w-3" />No sample created yet
                        </p>
                      )}
                    </div>

                    {/* Right meta */}
                    <div className="hidden shrink-0 flex-col items-end gap-1 md:flex">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${badge.cls}`}>
                        {task.status === "APPROVED" && <CheckCircle className="h-3 w-3" />}
                        {badge.label}
                      </span>
                      <span className="text-xs text-[#a89a8e]">
                        <Video className="mr-0.5 inline h-3 w-3" />{task.videos.length} video{task.videos.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Expand */}
                    <button
                      onClick={() => setExpandedId(isOpen ? null : task.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
                    >
                      {isOpen ? <><ChevronUp className="h-3.5 w-3.5" />Collapse</> : <><ChevronDown className="h-3.5 w-3.5" />Manage</>}
                    </button>
                  </div>

                  {/* ── Expanded panel ── */}
                  {isOpen && (
                    <div className="border-t border-[#eadfcb] bg-[#faf6ef] px-5 py-5">
                      <div className="grid gap-6 lg:grid-cols-3">

                        {/* ── Task brief ─────────────────────────────────── */}
                        <div className="space-y-3 lg:col-span-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#8c7764]">Task brief</p>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Readme / brief</label>
                            <textarea
                              rows={6}
                              value={e.readme ?? task.readme ?? ""}
                              onChange={(ev) => patchTask(task.id, "readme", ev.target.value)}
                              placeholder="Describe tone, hashtags, CTA, key messages..."
                              className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Requirements (one per line)</label>
                            <textarea
                              rows={4}
                              value={e.requirements ?? task.requirements.join("\n")}
                              onChange={(ev) => patchTask(task.id, "requirements", ev.target.value)}
                              placeholder={"Mention product name\nShow unboxing\nTag @brand"}
                              className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Deadline</label>
                              <input
                                type="date"
                                value={e.deadline ?? (task.deadline ? task.deadline.slice(0, 10) : "")}
                                onChange={(ev) => patchTask(task.id, "deadline", ev.target.value)}
                                className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Task status</label>
                              <select
                                value={e.status ?? task.status}
                                onChange={(ev) => patchTask(task.id, "status", ev.target.value)}
                                className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                              >
                                {["ACTIVE", "SUBMITTED", "REVISION_REQUESTED", "APPROVED", "COMPLETED", "CANCELLED"].map((st) => (
                                  <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* ── Sample shipment ─────────────────────────────── */}
                        <div className="space-y-3 lg:col-span-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#8c7764]">Sample shipment</p>
                            {/* Quick action buttons */}
                            <div className="flex gap-1.5">
                              {(!shipStatus || shipStatus === "PREPARING") && (
                                <button
                                  disabled={saving === task.id}
                                  onClick={() => void quickShip(task, "SHIPPED")}
                                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                                >
                                  <Truck className="h-3 w-3" />Mark shipped
                                </button>
                              )}
                              {shipStatus && ["SHIPPED", "IN_TRANSIT"].includes(shipStatus) && (
                                <button
                                  disabled={saving === task.id}
                                  onClick={() => void quickShip(task, "DELIVERED")}
                                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                >
                                  <CheckCircle className="h-3 w-3" />Mark delivered
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Current ship status */}
                          {shipStatus && (
                            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${SHIP_COLORS[shipStatus] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                              <Truck className="h-3 w-3" />{shipStatus.replace(/_/g, " ")}
                              {(s.trackingNumber ?? sample?.trackingNumber) && (
                                <span className="ml-1 font-mono text-[10px]">{s.trackingNumber ?? sample?.trackingNumber}</span>
                              )}
                            </div>
                          )}

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Carrier</label>
                              <input
                                value={s.carrier ?? sample?.carrier ?? ""}
                                onChange={(ev) => patchSample(task.id, "carrier", ev.target.value)}
                                placeholder="UPS / FedEx / USPS / DHL"
                                className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Tracking number</label>
                              <input
                                value={s.trackingNumber ?? sample?.trackingNumber ?? ""}
                                onChange={(ev) => patchSample(task.id, "trackingNumber", ev.target.value)}
                                placeholder="1Z999AA1..."
                                className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Shipping status</label>
                            <select
                              value={s.status ?? sample?.status ?? "PREPARING"}
                              onChange={(ev) => patchSample(task.id, "status", ev.target.value)}
                              className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                            >
                              {["PREPARING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "FAILED"].map((st) => (
                                <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#6b5d54]">Notes</label>
                            <input
                              value={s.notes ?? sample?.notes ?? ""}
                              onChange={(ev) => patchSample(task.id, "notes", ev.target.value)}
                              placeholder="Fragile, gift-wrapped, etc."
                              className="w-full rounded-xl border border-[#eadfcb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a574]"
                            />
                          </div>

                          {/* Shipped / delivered dates */}
                          {sample?.shippedAt && (
                            <p className="flex items-center gap-1 text-xs text-[#6b5d54]">
                              <Truck className="h-3.5 w-3.5 text-blue-500" />
                              Shipped {fmt(sample.shippedAt)}
                            </p>
                          )}
                          {sample?.deliveredAt && (
                            <p className="flex items-center gap-1 text-xs text-emerald-700">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Delivered {fmt(sample.deliveredAt)}
                            </p>
                          )}

                          {task.payment && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
                              Commission: {money(task.payment.amountCents)} — {task.payment.status}
                            </div>
                          )}
                        </div>

                        {/* ── Influencer info + Ship-to address ────────────── */}
                        <div className="space-y-4 lg:col-span-1">
                          {/* Influencer card */}
                          <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8c7764]">Influencer</p>
                            <div className="flex items-center gap-3 rounded-xl border border-[#eadfcb] bg-white p-3">
                              {task.influencer.image ? (
                                <img src={task.influencer.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1614] text-sm font-bold text-white">
                                  {(task.influencer.name || task.influencer.email)[0].toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#1a1614]">{task.influencer.name || "—"}</p>
                                <p className="truncate text-xs text-[#8c7764]">{task.influencer.email}</p>
                                {task.influencer.influencerProfile && (
                                  <div className="mt-0.5 flex gap-2 text-[10px] text-[#a89a8e]">
                                    {task.influencer.influencerProfile.tiktok && <span>TT {task.influencer.influencerProfile.tiktok}</span>}
                                    {task.influencer.influencerProfile.instagram && <span>IG {task.influencer.influencerProfile.instagram}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Ship-to address */}
                          <div>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8c7764]">
                              <MapPin className="h-3.5 w-3.5" />Ship to
                            </p>
                            <div className="rounded-xl border border-[#eadfcb] bg-white p-3">
                              <AddrBlock addr={shipAddr} />
                            </div>
                          </div>

                          {/* Videos */}
                          {task.videos.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8c7764]">Video submissions</p>
                              <div className="space-y-2">
                                {task.videos.map((v) => (
                                  <div key={v.id} className="flex items-center justify-between rounded-xl border border-[#eadfcb] bg-white px-3 py-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold text-[#1a1614]">{v.title}</p>
                                      <p className="text-[10px] text-[#a89a8e]">{fmt(v.createdAt)}</p>
                                    </div>
                                    <span className={`ml-2 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                      v.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : v.status === "PUBLISHED" ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : v.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}>{v.status.replace(/_/g, " ")}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Deadline info */}
                          {task.deadline && (
                            <p className="flex items-center gap-1.5 text-xs text-[#6b5d54]">
                              <Clock className="h-3.5 w-3.5" />Due {fmt(task.deadline)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Save button */}
                      <div className="mt-5 flex justify-end border-t border-[#eadfcb] pt-4">
                        <button
                          disabled={saving === task.id}
                          onClick={() => void save(task.id)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#1a1614] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:opacity-60"
                        >
                          {saving === task.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          Save changes
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
