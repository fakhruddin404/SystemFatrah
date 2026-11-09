'use client';

import { useState, type ChangeEvent } from 'react';
import { getUploadSignature } from '@/app/admin/(protected)/media/actions';
import { isHttpsUrl } from '@/lib/media';
import Field, { inputClass } from '@/components/admin/Field';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/';

type Mode = 'url' | 'upload';

/**
 * Image picker for the admin forms. Either paste any direct https image link, or upload a
 * file straight to Cloudinary (signed by the server). Submits two hidden fields:
 * `imageUrl` and `cloudinaryPublicId` (set only for uploads, so the asset can be cleaned up).
 */
export default function MediaInput({
  initialUrl = '',
  initialPublicId = '',
  error,
}: {
  initialUrl?: string;
  initialPublicId?: string;
  error?: string;
}) {
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState(initialUrl);
  const [publicId, setPublicId] = useState(initialPublicId);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Use a JPG, PNG or WebP image.');
      input.value = '';
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('The image is larger than 8 MB. Please use a smaller file.');
      input.value = '';
      return;
    }

    setUploading(true);
    try {
      const signed = await getUploadSignature();
      if (!signed.ok) {
        setUploadError(signed.error);
        return;
      }
      const { cloudName, apiKey, timestamp, folder, signature } = signed.signature;

      const body = new FormData();
      body.append('file', file);
      body.append('api_key', apiKey);
      body.append('timestamp', String(timestamp));
      body.append('folder', folder);
      body.append('signature', signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
        method: 'POST',
        body,
      });
      const json = (await res.json()) as {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
      };
      if (!res.ok || !json.secure_url || !json.public_id || !json.secure_url.startsWith(CLOUDINARY_PREFIX)) {
        setUploadError(json.error?.message ?? 'Upload failed. Please try again.');
        return;
      }
      setUrl(json.secure_url);
      setPublicId(json.public_id);
    } catch {
      setUploadError('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      input.value = '';
    }
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium border transition-colors ${
      active ? 'bg-ink text-warm-white border-ink' : 'bg-transparent text-ink border-ink/40 hover:border-ink'
    }`;

  return (
    <div className="space-y-3">
      <input type="hidden" name="imageUrl" value={url} />
      <input type="hidden" name="cloudinaryPublicId" value={publicId} />

      <div role="tablist" aria-label="Image source" className="flex gap-2">
        <button type="button" role="tab" aria-selected={mode === 'url'} onClick={() => setMode('url')} className={tabClass(mode === 'url')}>
          Paste link
        </button>
        <button type="button" role="tab" aria-selected={mode === 'upload'} onClick={() => setMode('upload')} className={tabClass(mode === 'upload')}>
          Upload file
        </button>
      </div>

      {mode === 'url' ? (
        <Field
          label="Image URL"
          htmlFor="image-url"
          hint="A direct https:// link, e.g. from Cloudinary."
          error={error}
        >
          <input
            id="image-url"
            type="url"
            inputMode="url"
            placeholder="https://res.cloudinary.com/…"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              // A pasted link replaces any uploaded file.
              setPublicId('');
            }}
            className={inputClass}
          />
        </Field>
      ) : (
        <Field
          label="Image file"
          htmlFor="image-file"
          hint="JPG, PNG or WebP, up to 8 MB. Uploaded to Cloudinary."
          error={error}
        >
          <input
            id="image-file"
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFile}
            disabled={uploading}
            className="block w-full text-sm file:mr-4 file:border file:border-ink file:bg-transparent file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-ink hover:file:text-warm-white"
          />
        </Field>
      )}

      {uploading ? <p role="status" className="text-sm text-ink-soft">Uploading…</p> : null}
      {uploadError ? (
        <p role="alert" className="text-sm text-maroon">
          {uploadError}
        </p>
      ) : null}

      {url && isHttpsUrl(url) ? (
        <div className="relative w-40 aspect-[4/5] border border-ink bg-warm-white overflow-hidden">
          {/* A plain <img> so previews work for any host the admin pastes. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Preview" className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" />
        </div>
      ) : null}
    </div>
  );
}
