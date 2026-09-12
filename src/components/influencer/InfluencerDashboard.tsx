"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle, Clock, DollarSign, Loader2,
  Package, Sparkles, Truck, Video,
} from "lucide-react";

type Product = { id: string; name: string; imageUrl: string | null; commissionType: string; commissionRate: number; commissionFixed: number };
type Application = {
  id: string; ref: string; status: string; createdAt: string;
  product: Product;
  task: { id: string; ref: string; status: string } | null;
};
type Task = {
  id: string; ref: string; status: string; deadline: string | null;
  application: { product: Product; sample: { status: string; trackingNumber: string | null; carrier: string | null } | null };
  videos: { id: string; title: string; status: string }[];
  payment: { status: string; amountCents: number } | null;
};

const APP_BADGE: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED:  "bg-red-50 text-red-700 border-red-200",
  WITHDRAWN: "bg-gray-100 text-gray-500 border-gray-200",
};
const TASK_BADGE: Record<string, string> = {
  ACTIVE:             "bg-blue-50 text-blue-700 border-blue-200",
  SUBMITTED:          "bg-amber-50 text-amber-700 border-amber-200",
  REVISION_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  APPROVED:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED:          "bg-purple-50 text-purple-700 border-purple-200",
  CANCELLED:          "bg-gray-100 text-gray-500 border-gray-200",
};
const SHIP_STEPS = ["PREPARING", "SHIPPED", "IN_TRANSIT", "DELIVERED"];

const money = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const pct = (r: number) => `${(r * 100).toFixed(0)}%`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ── Mini shipment progress bar ──────────────────────────────────────────────
function ShipBar({ status }: { status: string }) {
  const idx = SHIP_STEPS.indexOf(status);
  if (idx === -1) return null;
  return (
    <div className="flex items-center gap-1">
      {SHIP_STEPS.map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= idx ? "bg-[#d4a574]" : "bg-[#eadfcb]"}`} />
      ))}
      <span className="ml-2 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#8c7764]">
        {status.replace("_", " ")}
      </span>
    </div>
  );
}

// ── Next-action hero card based on the most urgent task ────────────────────
function NextActionCard({ tasks }: { tasks: Task[] }) {
  const active = tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  if (active.length === 0) return null;

  // Priority: REVISION_REQUESTED > sample DELIVERED (ready to film) > sample in transit > no sample
  const withRevision = active.find((t) => t.status === "REVISION_REQUESTED");
  const readyToFilm  = active.find(
    (t) => t.status === "ACTIVE" && t.application.sample?.status === "DELIVERED",
  );
  const inTransit = active.find(
    (t) => ["SHIPPED", "IN_TRANSIT"].includes(t.application.sample?.status ?? ""),
  );
  const hero = withRevision ?? readyToFilm ?? inTransit ?? active[0];

  if (!hero) return null;
  const sample = hero.application.sample;
  const isRevision = hero.status === "REVISION_REQUESTED";
  const isReadyToFilm = hero.status === "ACTIVE" && sample?.status === "DELIVERED";
  const isInTransit = ["SHIPPED", "IN_TRANSIT"].includes(sample?.status ?? "");

  let bg = "bg-[#1a1614]";
  let icon = <Sparkles className="h-5 w-5 text-[#d4a574]" />;
  let headline = "Your task is active";
  let sub = "Open the task to see your brief and submit your video.";
  let cta = "Go to task";

  if (isRevision) {
    bg = "bg-orange-700";
    icon = <Video className="h-5 w-5 text-orange-200" />;
    headline = "Revision requested";
    sub = "The brand has left feedback — review it and re-submit your video.";
    cta = "Review feedback";
  } else if (isReadyToFilm) {
    bg = "bg-emerald-800";
    icon = <Sparkles className="h-5 w-5 text-emerald-300" />;
    headline = "Sample delivered — time to film!";
    sub = `Your ${hero.application.product.name} sample has arrived. Open the task brief and start filming.`;
    cta = "View brief & submit";
  } else if (isInTransit) {
    bg = "bg-blue-900";
    icon = <Truck className="h-5 w-5 text-blue-300" />;
    headline = "Your sample is on its way";
    sub = sample?.carrier && sample?.trackingNumber
      ? `${sample.carrier} · ${sample.trackingNumber}`
      : "Tracking info will appear here once the brand ships your sample.";
    cta = "View task";
  }

  return (
    <Link
      href={`/influencer/tasks/${hero.id}`}
      className={`group flex items-center gap-5 rounded-[1.75rem] ${bg} p-6 text-white shadow-[0_8px_32px_rgba(26,22,20,0.18)] transition hover:opacity-95`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Next action</p>
        <p className="mt-0.5 text-base font-bold leading-snug">{headline}</p>
        <p className="mt-0.5 truncate text-sm text-white/65">{sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold transition group-hover:bg-white/25">
        {cta} <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

// ─── Main dashboard ─────────────────────────────────────────────────────────

export default function InfluencerDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/influencer/applications").then((r) => r.json()),
      fetch("/api/influencer/tasks").then((r) => r.json()),
    ]).then(([appData, taskData]) => {
      setApplications(appData.applications || []);
      setTasks(taskData.tasks || []);
    }).catch(() => {
      setError("Failed to load dashboard. Please refresh the page.");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#6b5d54]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
    );
  }

  const activeTasks    = tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const pendingApps    = applications.filter((a) => a.status === "PENDING");
  const totalEarned    = completedTasks.reduce((s, t) => s + (t.payment?.amountCents || 0), 0);

  return (
    <div className="space-y-6">

      {/* Next action hero */}
      <NextActionCard tasks={tasks} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active tasks",          value: activeTasks.length,    icon: <Video className="h-5 w-5 text-blue-500" />,    bg: "bg-blue-50" },
          { label: "Pending applications",  value: pendingApps.length,    icon: <Clock className="h-5 w-5 text-amber-500" />,   bg: "bg-amber-50" },
          { label: "Completed tasks",       value: completedTasks.length, icon: <CheckCircle className="h-5 w-5 text-purple-500" />, bg: "bg-purple-50" },
          { label: "Total earned",          value: money(totalEarned),    icon: <DollarSign className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-5 shadow-[0_4px_20px_rgba(26,22,20,0.04)]">
            <div className={`mb-3 inline-flex rounded-xl p-2 ${stat.bg}`}>{stat.icon}</div>
            <p className="text-2xl font-bold text-[#1a1614]">{stat.value}</p>
            <p className="mt-0.5 text-xs font-semibold text-[#8c7764]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Active tasks */}
      <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_4px_20px_rgba(26,22,20,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1a1614]">Active tasks</h2>
          <Link href="/gallery" className="text-sm font-semibold text-[#8c7764] hover:text-[#1a1614]">
            Browse products →
          </Link>
        </div>
        {activeTasks.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-[#d9ccb9] p-8 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-[#d9ccb9]" />
            <p className="text-sm text-[#6b5d54]">No active tasks yet.</p>
            <Link href="/gallery" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a1614] hover:underline">
              Browse the gallery <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTasks.map((task) => {
              const sample = task.application.sample;
              const badge = TASK_BADGE[task.status] ?? "bg-gray-50 text-gray-500 border-gray-200";
              const sampleDelivered = sample?.status === "DELIVERED";
              return (
                <Link
                  key={task.id}
                  href={`/influencer/tasks/${task.id}`}
                  className="group flex items-center gap-4 rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4 transition hover:border-[#d4a574] hover:bg-[#fdf8f1]"
                >
                  {/* Product image */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#eadfcb] bg-white">
                    {task.application.product.imageUrl && (
                      <Image src={task.application.product.imageUrl} alt={task.application.product.name} fill sizes="56px" className="object-cover" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="font-semibold text-[#1a1614]">{task.application.product.name}</p>
                    {/* Shipment bar */}
                    {sample ? (
                      <ShipBar status={sample.status} />
                    ) : (
                      <p className="flex items-center gap-1 text-xs text-[#a89a8e]"><Package className="h-3 w-3" />Awaiting sample</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-[#6b5d54]">
                      <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" />{task.videos.length} video{task.videos.length !== 1 ? "s" : ""}</span>
                      {task.deadline && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Due {fmtDate(task.deadline)}</span>}
                    </div>
                  </div>
                  {/* Status + cta */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge}`}>
                      {task.status.replace(/_/g, " ")}
                    </span>
                    {sampleDelivered && task.status === "ACTIVE" && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        Ready to film
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Applications */}
      <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_4px_20px_rgba(26,22,20,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1a1614]">My applications</h2>
          <span className="text-xs text-[#a89a8e]">{applications.length} total</span>
        </div>
        {applications.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-[#d9ccb9] p-8 text-center text-sm text-[#6b5d54]">
            No applications yet. <Link href="/gallery" className="font-semibold text-[#1a1614] underline">Browse products</Link> to apply.
          </div>
        ) : (
          <div className="divide-y divide-[#f0e8d8]">
            {applications.map((app) => {
              const badge = APP_BADGE[app.status] ?? "bg-gray-50 text-gray-500 border-gray-200";
              const commission = app.product.commissionType === "FIXED"
                ? money(app.product.commissionFixed)
                : `${pct(app.product.commissionRate)} of sale`;
              return (
                <div key={app.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#eadfcb] bg-[#faf6ef]">
                    {app.product.imageUrl && (
                      <Image src={app.product.imageUrl} alt={app.product.name} fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1a1614]">{app.product.name}</p>
                    <p className="text-xs text-[#8c7764]">{commission} commission · {fmtDate(app.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${badge}`}>
                    {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_4px_20px_rgba(26,22,20,0.04)]">
          <h2 className="mb-4 text-base font-bold text-[#1a1614]">Completed tasks</h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#eadfcb] bg-white">
                  {task.application.product.imageUrl && (
                    <Image src={task.application.product.imageUrl} alt={task.application.product.name} fill sizes="48px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1614]">{task.application.product.name}</p>
                  {task.payment && (
                    <p className="text-xs font-medium text-emerald-700">{money(task.payment.amountCents)} earned · {task.payment.status}</p>
                  )}
                </div>
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
