import { ReactNode } from "react";
import AppHeader from "@/components/painting-order/AppHeader";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { requireAdminPageSession } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminPageSession();

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          <AdminNavigation />
          {children}
        </div>
      </main>
    </div>
  );
}
