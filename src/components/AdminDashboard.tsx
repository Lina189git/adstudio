"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, ClipboardList, DollarSign, Film, Package, Users, Video } from "lucide-react";

type Stats = {
  products: number;
  users: number;
  pendingApplications: number;
  activeTasks: number;
  pendingVideos: number;
  totalApplications: number;
};

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    users: 0,
    pendingApplications: 0,
    activeTasks: 0,
    pendingVideos: 0,
    totalApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products/stats").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/users/stats").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/applications?status=PENDING").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/applications").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/tasks?status=ACTIVE").then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/videos?status=PENDING_REVIEW").then((r) => r.json()).catch(() => ({})),
    ]).then(([products, users, pendingApps, allApps, activeTasks, pendingVideos]) => {
      setStats({
        products: products.total ?? 0,
        users: users.total ?? 0,
        pendingApplications: pendingApps.pagination?.total ?? 0,
        totalApplications: allApps.pagination?.total ?? 0,
        activeTasks: activeTasks.pagination?.total ?? 0,
        pendingVideos: pendingVideos.pagination?.total ?? 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: "Products listed",
      value: stats.products,
      sub: "available in gallery",
      icon: Package,
      href: "/admin/products",
      accent: "text-[#d4a574]",
      bg: "bg-[#fdf8f1]",
    },
    {
      title: "Pending applications",
      value: stats.pendingApplications,
      sub: `${stats.totalApplications} total applications`,
      icon: ClipboardList,
      href: "/admin/applications",
      accent: "text-amber-600",
      bg: "bg-amber-50",
      badge: stats.pendingApplications > 0,
    },
    {
      title: "Active tasks",
      value: stats.activeTasks,
      sub: "in-progress ad tasks",
      icon: Film,
      href: "/admin/tasks",
      accent: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Videos awaiting review",
      value: stats.pendingVideos,
      sub: "need approval or feedback",
      icon: Video,
      href: "/admin/videos",
      accent: "text-purple-600",
      bg: "bg-purple-50",
      badge: stats.pendingVideos > 0,
    },
    {
      title: "Total users",
      value: stats.users,
      sub: "registered accounts",
      icon: Users,
      href: "/admin/users",
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Commission payments",
      value: "—",
      sub: "manage in Videos tab",
      icon: DollarSign,
      href: "/admin/videos",
      accent: "text-[#8c7764]",
      bg: "bg-[#faf6ef]",
    },
  ];

  const workflowSteps = [
    { step: "01", title: "List products", desc: "Add product info, commission rates & sample stock.", href: "/admin/products", cta: "Manage products" },
    { step: "02", title: "Review applications", desc: "Approve or reject influencer applications.", href: "/admin/applications?status=PENDING", cta: "See pending" },
    { step: "03", title: "Issue task briefs", desc: "Write readme, requirements & ship product sample.", href: "/admin/tasks", cta: "Open tasks" },
    { step: "04", title: "Approve videos", desc: "Review submissions, publish, and pay commission.", href: "/admin/videos?status=PENDING_REVIEW", cta: "Review videos" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative overflow-hidden rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_6px_24px_rgba(26,22,20,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(26,22,20,0.10)]"
          >
            {card.badge && (
              <span className="absolute right-4 top-4 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </span>
            )}
            <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.accent}`} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8c7764]">{card.title}</p>
            <p className="mt-1 text-3xl font-bold text-[#1a1614]">
              {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-[#eadfcb]" /> : card.value}
            </p>
            <p className="mt-1 text-xs text-[#a89a8e]">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Workflow steps */}
      <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_6px_24px_rgba(26,22,20,0.05)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1a1614]">Platform workflow</h2>
            <p className="mt-0.5 text-sm text-[#6b5d54]">Four steps from product listing to published ad video</p>
          </div>
          <CheckCircle className="h-5 w-5 text-[#d4a574]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((s) => (
            <Link key={s.step} href={s.href} className="group rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4 transition hover:bg-[#f0e8d8]">
              <span className="text-3xl font-bold text-[#eadfcb] group-hover:text-[#d9ccb9]">{s.step}</span>
              <p className="mt-2 text-sm font-bold text-[#1a1614]">{s.title}</p>
              <p className="mt-1 text-xs text-[#6b5d54]">{s.desc}</p>
              <p className="mt-3 text-xs font-semibold text-[#d4a574] group-hover:text-[#c49464]">{s.cta} →</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_6px_24px_rgba(26,22,20,0.05)]">
        <h2 className="mb-4 text-lg font-bold text-[#1a1614]">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Add new product", href: "/admin/products" },
            { label: "Pending applications", href: "/admin/applications?status=PENDING" },
            { label: "Videos to review", href: "/admin/videos?status=PENDING_REVIEW" },
            { label: "Active tasks", href: "/admin/tasks?status=ACTIVE" },
            { label: "Manage users", href: "/admin/users" },
            { label: "Public gallery", href: "/gallery" },
          ].map(({ label, href }) => (
            <Link key={href} href={href} className="rounded-full border border-[#eadfcb] bg-[#faf6ef] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f0e8d8]">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
