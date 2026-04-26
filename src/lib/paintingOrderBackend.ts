export function getPaintingServiceUrl() {
  const serviceUrl =
    process.env.PAINTING_STYLE_API_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:5000";

  // `localhost` can resolve to IPv6 on Windows while the local FastAPI app is
  // only listening on IPv4, so normalize to 127.0.0.1 for local development.
  return serviceUrl.replace("://localhost", "://127.0.0.1");
}

function isLocalPaintingServiceUrl(serviceUrl: string) {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(serviceUrl);
}

export function getPaintingHealthTimeoutMs() {
  return Number(process.env.PAINTING_STYLE_HEALTH_TIMEOUT_MS || 25000);
}

export function getPaintingStylesTimeoutMs() {
  return Number(process.env.PAINTING_STYLE_STATUS_TIMEOUT_MS || 20000);
}

export function getPaintingSourceFetchTimeoutMs() {
  return Number(process.env.PAINTING_SOURCE_FETCH_TIMEOUT_MS || 120000);
}

export function getPaintingTransferTimeoutMs() {
  return Number(process.env.PAINTING_STYLE_API_TIMEOUT_MS || 300000);
}

export function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.name === "TimeoutError" ||
      /aborted due to timeout/i.test(error.message))
  );
}

export function describePaintingServiceFailure(
  error: unknown,
  serviceUrl = getPaintingServiceUrl()
) {
  if (isAbortError(error)) {
    return `The style backend at ${serviceUrl} did not respond within ${Math.round(
      getPaintingHealthTimeoutMs() / 1000
    )} seconds. This usually means a cold start, model-loading delay, or a stalled backend process.`;
  }

  if (error instanceof Error) {
    if (
      /fetch failed|ECONNREFUSED|ENOTFOUND|Unable to connect|network|socket/i.test(
        error.message
      )
    ) {
      if (isLocalPaintingServiceUrl(serviceUrl)) {
        return `Could not reach the local style backend at ${serviceUrl}. Start the FastAPI image-conversion server on port 5000, or change PAINTING_STYLE_API_URL to your deployed backend.`;
      }

      return `Could not reach the remote style backend at ${serviceUrl}. Verify that the backend server is online and that ${serviceUrl}/health responds successfully.`;
    }

    return error.message;
  }

  return `The style backend at ${serviceUrl} could not be reached.`;
}

export async function fetchPaintingServiceHealth() {
  try {
    const response = await fetch(`${getPaintingServiceUrl()}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(getPaintingHealthTimeoutMs()),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        serviceUrl: getPaintingServiceUrl(),
        notice: `The style backend health check returned HTTP ${response.status} from ${getPaintingServiceUrl()}/health.`,
      };
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    return {
      ok: true,
      status: response.status,
      serviceUrl: getPaintingServiceUrl(),
      payload,
      notice: `The style backend responded successfully from ${getPaintingServiceUrl()}/health.`,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      serviceUrl: getPaintingServiceUrl(),
      notice: describePaintingServiceFailure(error, getPaintingServiceUrl()),
    };
  }
}

export async function warmPaintingService() {
  const firstAttempt = await fetchPaintingServiceHealth();
  if (firstAttempt.ok) {
    return firstAttempt;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return fetchPaintingServiceHealth();
}
