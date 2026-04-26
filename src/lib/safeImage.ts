const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800";

export const ALLOWED_REMOTE_HOSTS = new Set([
  "images.unsplash.com",
  "res.cloudinary.com",
]);

export function isAllowedRemoteImageUrl(value?: string | null) {
  if (!value) {
    return false;
  }

  if (value.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && ALLOWED_REMOTE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function getSafeImageSrc(
  value?: string | null,
  fallback: string = FALLBACK_IMAGE
) {
  if (isAllowedRemoteImageUrl(value)) {
    return value as string;
  }

  return fallback;
}

export { FALLBACK_IMAGE };
