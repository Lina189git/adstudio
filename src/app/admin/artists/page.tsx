import type { Metadata } from "next";
import AdminArtistManager from "@/components/admin/AdminArtistManager";

export const metadata: Metadata = { title: "Artists — Admin" };

export default function AdminArtistsPage() {
  return <AdminArtistManager />;
}
