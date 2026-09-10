"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, Loader2, Package, Truck, Video } from "lucide-react";

type Product = { id: string; name: string; imageUrl: string | null; commissionType: string; commissionRate: number; commissionFixed: number };
type Task = {
  id: string; ref: string; status: string; deadline: string | null;
  application: { product: Product; sample: { status: string; trackingNumber: string | null } | null };
  videos: { id: string; title: string; status: string }[];
  payment: { status: string; amountCents: number } | null;
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-200",
  REVISION_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-purple-50 text-purple-700 border-purple-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function InfluencerTasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/influencer/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20 text-sm text-[#6b5d54]"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading tasks...</div>;

  if (tasks.length === 0) return (
    <div className="rounded-[1.75rem] border border-dashed border-[#d9ccb9] p-16 text-center">
      <Package className="mx-auto mb-4 h-10 w-10 text-[#d9ccb9]" />
      <p className="text-sm font-semibold text-[#6b5d54]">No tasks yet</p>
      <p className="mt-2 text-sm text-[#a89a8e]">Apply to products in the gallery to receive a task brief.</p>
      <Link href="/gallery" className="mt-6 inline-flex items-center rounded-full bg-[#1a1614] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2a2624]">Browse gallery</Link>
    </div>
  );

  const active = tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const done = tasks.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");

  const TaskCard = ({ task }: { task: Task }) => {
    const sc = STATUS_COLORS[task.status] ?? "bg-gray-50 text-gray-600 border-gray-200";
    const sample = task.application.sample;
    const videoCount = task.videos.length;
    return (
      <Link href={`/influencer/tasks/${task.id}`} className="group flex items-center gap-4 rounded-[1.25rem] border border-[#eadfcb] bg-white p-4 shadow-[0_4px_16px_rgba(26,22,20,0.04)] transition hover:shadow-[0_8px_28px_rgba(26,22,20,0.08)]">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]">
          {task.application.product.imageUrl && <Image src={task.application.product.imageUrl} alt={task.application.product.name} fill sizes="64px" className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold text-[#1a1614]">{task.application.product.name}</p>
          <div className="flex flex-wrap gap-3 text-xs text-[#6b5d54]">
            {sample && <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" />{sample.status.replace("_", " ")}{sample.trackingNumber ? ` · ${sample.trackingNumber}` : ""}</span>}
            <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" />{videoCount} video{videoCount !== 1 ? "s" : ""}</span>
            {task.deadline && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Due {new Date(task.deadline).toLocaleDateString()}</span>}
          </div>
          {task.payment && task.status === "COMPLETED" && (
            <p className="text-xs font-semibold text-emerald-700">{money(task.payment.amountCents)} earned · {task.payment.status}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${sc}`}>{task.status.replace("_", " ")}</span>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#1a1614]">Active tasks</h2>
          <div className="space-y-3">{active.map((t) => <TaskCard key={t.id} task={t} />)}</div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#1a1614]">Completed &amp; cancelled</h2>
          <div className="space-y-3 opacity-75">{done.map((t) => <TaskCard key={t.id} task={t} />)}</div>
        </div>
      )}
    </div>
  );
}
