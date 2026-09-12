import { NextResponse } from "next/server";
import {
  PAINTING_STYLE_OPTIONS,
  type PaintingStyleOption,
} from "@/lib/paintingOrder";
import {

export const dynamic = "force-dynamic";
  fetchPaintingServiceHealth,
  getPaintingServiceUrl,
  getPaintingStylesTimeoutMs,
  isAbortError,
} from "@/lib/paintingOrderBackend";

function getStylesFallbackResponse(notice?: string) {
  return {
    styles: PAINTING_STYLE_OPTIONS,
    providerUsed: "local-fallback",
    serviceUrl: getPaintingServiceUrl(),
    backendNotice:
      notice ||
      "The style server status could not be confirmed. Local style labels are shown until the backend responds.",
  };
}

export async function GET() {
  const health = await fetchPaintingServiceHealth();
  const fallbackResponse = getStylesFallbackResponse();

  try {
    if (!health.ok) {
      return NextResponse.json(
        getStylesFallbackResponse(
          `${health.notice} Local style labels are being used until the backend becomes healthy.`
        )
      );
    }

    const response = await fetch(`${getPaintingServiceUrl()}/styles`, {
      cache: "no-store",
      signal: AbortSignal.timeout(getPaintingStylesTimeoutMs()),
    });

    if (!response.ok) {
      return NextResponse.json(
        getStylesFallbackResponse(
          `The style server returned HTTP ${response.status} for /styles. Local style labels are being used.`
        )
      );
    }

    const payload = await response.json();
    const styles = Array.isArray(payload?.styles) ? payload.styles : [];
    const filteredStyles = PAINTING_STYLE_OPTIONS.filter((option) =>
      styles.includes(option.value)
    );

    return NextResponse.json({
      styles:
        filteredStyles.length > 0
          ? filteredStyles
          : (PAINTING_STYLE_OPTIONS as PaintingStyleOption[]),
      providerUsed: "render-cyclegan",
      serviceUrl: getPaintingServiceUrl(),
      backendNotice: health.notice,
    });
  } catch (error) {
    const notice =
      isAbortError(error)
        ? `The style server did not answer /styles within ${Math.round(
            getPaintingStylesTimeoutMs() / 1000
          )} seconds. This often means Render is cold-starting.`
        : undefined;

    return NextResponse.json(getStylesFallbackResponse(notice));
  }
}
