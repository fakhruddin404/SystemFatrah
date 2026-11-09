/**
 * Image host policy.
 *
 * Only Cloudinary assets under our own cloud name go through the Next.js image
 * optimizer (see images.remotePatterns in next.config.mjs). Any other https URL
 * is still accepted but rendered with `unoptimized`, so the optimizer cannot be
 * used as a proxy for arbitrary hosts.
 */

export const CLOUDINARY_HOST = 'res.cloudinary.com';

/** Cloud name from env; empty string when unset. */
export function getCloudinaryCloudName(): string {
  return (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '').trim();
}

/** True only for https://res.cloudinary.com/<cloudName>/... URLs. */
export function isOptimizable(
  src: string,
  cloudName: string = getCloudinaryCloudName()
): boolean {
  if (!cloudName) return false;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    url.hostname === CLOUDINARY_HOST &&
    url.pathname.startsWith(`/${cloudName}/`)
  );
}

/** Admin-side check: any well-formed https URL is accepted. */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
