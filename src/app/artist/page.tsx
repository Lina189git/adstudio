import type { Metadata } from "next";
import { requireArtistPageSession } from "@/lib/artist";
import ArtistDashboard from "@/components/artist/ArtistDashboard";

export const metadata: Metadata = { title: "Artist Studio" };

export default async function ArtistPage({
  searchParams,
}: {
  searchParams: { section?: string };
}) {
  const session = await requireArtistPageSession();
  const userId  = (session.user as { id: string }).id;
  const isAdmin = session.user?.role === "ADMIN";

  return (
    <ArtistDashboard
      artistId={userId}
      artistName={session.user?.name ?? "Artist"}
      isAdmin={isAdmin}
      initialSection={(searchParams.section as any) ?? undefined}
    />
  );
}
