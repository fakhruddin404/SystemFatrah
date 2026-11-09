'use server';

import { getAdmin } from '@/lib/admin/auth';
import { createUploadSignature, type UploadSignature } from '@/lib/cloudinary-server';

export type SignatureResult =
  | { ok: true; signature: UploadSignature }
  | { ok: false; error: string };

/**
 * Signs a direct browser-to-Cloudinary upload. Admin only. The API secret stays on the
 * server; the browser receives just the signature, timestamp and folder.
 */
export async function getUploadSignature(): Promise<SignatureResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: 'You do not have permission to upload images.' };

  const signature = createUploadSignature();
  if (!signature) {
    return { ok: false, error: 'Image upload is not configured. Paste an image URL instead.' };
  }
  return { ok: true, signature };
}
