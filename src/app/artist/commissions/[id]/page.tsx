import type { Metadata } from "next";
import { requireArtistPageSession } from "@/lib/artist";
import ArtistCommissionDetail from "@/components/artist/ArtistCommissionDetail";

export const metadata: Metadata = { title: "Commission Detail" };

export default async function ArtistCommissionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireArtistPageSession();
  const userId  = (session.user as { id: string }).id;
  const isAdmin = session.user?.role === "ADMIN";

  return (
    <ArtistCommissionDetail
      commissionId={params.id}
      artistId={userId}
      artistName={session.user?.name ?? "Artist"}
      isAdmin={isAdmin}
    />
  );
}
