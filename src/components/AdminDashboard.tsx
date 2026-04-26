"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Package, ShoppingCart, BarChart3, Settings } from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const [ordersRes, usersRes, productsRes] = await Promise.all([
          fetch("/api/admin/orders/stats"),
          fetch("/api/admin/users/stats"),
          fetch("/api/admin/products/stats"),
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setStats(prev => ({
            ...prev,
            totalOrders: ordersData.total,
            pendingOrders: ordersData.pending,
          }));
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setStats(prev => ({ ...prev, totalUsers: usersData.total }));
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setStats(prev => ({ ...prev, totalProducts: productsData.total }));
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: Package,
      href: "/admin/orders",
      color: "text-blue-600",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: ShoppingCart,
      href: "/admin/orders?status=PENDING_PAYMENT",
      color: "text-yellow-600",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      href: "/admin/users",
      color: "text-green-600",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: BarChart3,
      href: "/admin/products",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="block p-6 bg-white rounded-[1.75rem] border-2 border-[#eadfcb] shadow-[0_10px_30px_rgba(26,22,20,0.06)] hover:shadow-[0_20px_50px_rgba(26,22,20,0.12)] hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#6b5d54] uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-[#1a1614] mt-2">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-[1.75rem] border-2 border-[#eadfcb] p-6">
        <h2 className="text-xl font-bold text-[#1a1614] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 p-4 border border-[#eadfcb] rounded-lg hover:bg-[#f8f1e6] transition-colors"
          >
            <Package className="h-5 w-5 text-[#6b5d54]" />
            <span className="font-medium text-[#1a1614]">Manage Orders</span>
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center gap-3 p-4 border border-[#eadfcb] rounded-lg hover:bg-[#f8f1e6] transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-[#6b5d54]" />
            <span className="font-medium text-[#1a1614]">Manage Products</span>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 border border-[#eadfcb] rounded-lg hover:bg-[#f8f1e6] transition-colors"
          >
            <Users className="h-5 w-5 text-[#6b5d54]" />
            <span className="font-medium text-[#1a1614]">Manage Users</span>
          </Link>
        </div>
      </div>
    </div>
  );
}