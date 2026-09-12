import { NextResponse } from "next/server";
import { fetchPaintingServiceHealth } from "@/lib/paintingOrderBackend";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await fetchPaintingServiceHealth();

  return NextResponse.json(
    {
      ok: health.ok,
      status: health.status,
      serviceUrl: health.serviceUrl,
      notice: health.notice,
      payload: "payload" in health ? health.payload : null,
    },
    { status: health.ok ? 200 : 503 }
  );
}
