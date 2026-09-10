import type { Metadata } from "next";
import AdminCommissionsManager from "@/components/admin/AdminCommissionsManager";

export const metadata: Metadata = { title: "Commissions — Admin" };

export default function AdminCommissionsPage() {
  return <AdminCommissionsManager />;
}
