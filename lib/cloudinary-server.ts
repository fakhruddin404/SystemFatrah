import 'server-only';

import {
  defaultUploadFolder,
  destroyEndpoint,
  isManagedPublicId,
  parseCloudinaryUrl,
  signParams,
  type CloudinaryCredentials,
} from '@/lib/cloudinary-signing';

/**
 * Server-only Cloudinary access. CLOUDINARY_URL contains the API secret, so this module
 * must never be imported from a client component (the `server-only` import enforces that).
 */

export function getCloudinaryCredentials(): CloudinaryCredentials | null {
  return parseCloudinaryUrl(process.env.CLOUDINARY_URL);
}

export function getUploadFolder(): string {
  return (
    process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || defaultUploadFolder(process.env.VERCEL_ENV)
  );
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** Signs a browser upload. The secret never leaves the server; only the signature does. */
export function createUploadSignature(): UploadSignature | null {
  const creds = getCloudinaryCredentials();
  if (!creds) return null;
  const folder = getUploadFolder();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ folder, timestamp }, creds.apiSecret);
  return { cloudName: creds.cloudName, apiKey: creds.apiKey, timestamp, folder, signature };
}

/**
 * Best-effort delete of an uploaded asset. Never throws: the database change that
 * triggered it must still succeed if Cloudinary is unavailable. Returns whether the
 * asset is gone ("ok" or "not found").
 */
export async function destroyCloudinaryAsset(publicId: string | null | undefined): Promise<boolean> {
  if (!publicId) return true;
  try {
    const creds = getCloudinaryCredentials();
    if (!creds) {
      console.error('[cloudinary] destroy skipped: CLOUDINARY_URL is not configured');
      return false;
    }
    if (!isManagedPublicId(publicId, getUploadFolder())) {
      console.error('[cloudinary] destroy skipped: asset is outside the managed upload folder');
      return false;
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signParams({ public_id: publicId, timestamp }, creds.apiSecret);
    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: creds.apiKey,
      signature,
    });
    const res = await fetch(destroyEndpoint(creds.cloudName), { method: 'POST', body });
    if (!res.ok) {
      console.error(`[cloudinary] destroy failed: HTTP ${res.status}`);
      return false;
    }
    const json = (await res.json()) as { result?: string };
    return json.result === 'ok' || json.result === 'not found';
  } catch (err) {
    console.error(`[cloudinary] destroy failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
