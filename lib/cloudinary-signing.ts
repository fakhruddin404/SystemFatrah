/**
 * Pure Cloudinary helpers (no env access, no secrets baked in) so they can be unit tested.
 * The server-only wrapper that reads CLOUDINARY_URL lives in lib/cloudinary-server.ts.
 */
import { createHash } from 'node:crypto';

export interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/** Parses `cloudinary://<api_key>:<api_secret>@<cloud_name>`. Returns null when malformed. */
export function parseCloudinaryUrl(raw: string | undefined): CloudinaryCredentials | null {
  const value = (raw ?? '').trim();
  const match = /^cloudinary:\/\/([^:@/\s]+):([^@/\s]+)@([^/\s?#]+)$/.exec(value);
  if (!match) return null;
  return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
}

export type SignableParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Cloudinary's string-to-sign: parameters sorted alphabetically, joined as
 * `key=value` with `&`. Empty/undefined values and the non-signed fields
 * (file, cloud_name, resource_type, api_key) are excluded. The secret is NOT included.
 */
export function buildStringToSign(params: SignableParams): string {
  const excluded = new Set(['file', 'cloud_name', 'resource_type', 'api_key']);
  return Object.entries(params)
    .filter(([key, value]) => !excluded.has(key) && value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

/** SHA-1 hex digest of `<string to sign><api secret>` (Cloudinary's default signature algorithm). */
export function signParams(params: SignableParams, apiSecret: string): string {
  return createHash('sha1')
    .update(buildStringToSign(params) + apiSecret)
    .digest('hex');
}

export const uploadEndpoint = (cloudName: string) =>
  `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;

export const destroyEndpoint = (cloudName: string) =>
  `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`;

/** `fat-rahz/<environment>`; keeps staging and production assets apart in one account. */
export function defaultUploadFolder(vercelEnv: string | undefined): string {
  const env = (vercelEnv ?? '').trim() || 'development';
  return `fat-rahz/${env}`;
}

/** Only assets under the upload folder's top-level directory may be deleted by the app. */
export function isManagedPublicId(publicId: string, uploadFolder: string): boolean {
  const root = uploadFolder.split('/')[0];
  return Boolean(root) && publicId.startsWith(`${root}/`) && !publicId.includes('..');
}
