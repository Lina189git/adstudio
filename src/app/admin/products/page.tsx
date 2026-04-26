import AdminProductsManager from "@/components/admin/AdminProductsManager";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminProductsPage() {
  return (
    <AdminShell
      eyebrow="Catalog"
      title="Product Management"
      description="Manage the product lineup, launch new offers, and keep inventory signals aligned with the storefront."
    >
      <AdminProductsManager />
    </AdminShell>
  );
}
