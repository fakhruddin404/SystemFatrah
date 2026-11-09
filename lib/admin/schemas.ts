/**
 * Input validation for the admin forms. Pure (no I/O) so it is unit tested and shared by
 * the Server Actions. Every admin write is validated here before it reaches the database.
 */
import { z } from 'zod';
import { isHttpsUrl } from '@/lib/media';

export type FieldErrors = Record<string, string>;

export type FormParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors: FieldErrors };

/** Trimmed string; a missing field behaves like an empty one. */
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .transform((v) => v ?? '');

const requiredText = (label: string, max: number) =>
  text(max).refine((v) => v.length > 0, `${label} is required`);

const nullableText = (max: number) => text(max).transform((v) => (v === '' ? null : v));

/** "180" or "180.50" (ringgit, up to 2 decimals). */
const amount = (label: string) =>
  text(12)
    .refine((v) => v.length > 0, `${label} is required`)
    .refine((v) => v === '' || /^\d{1,7}(\.\d{1,2})?$/.test(v), `${label} must look like 180 or 180.50`)
    .transform(Number);

const httpsImageUrl = text(2000)
  .refine((v) => v.length > 0, 'Image is required')
  .refine((v) => v === '' || isHttpsUrl(v), 'Image must be a valid https:// URL');

const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/';

// --- Ready stock -------------------------------------------------------------

export const ReadyStockInput = z
  .object({
    name: requiredText('Name', 120),
    descriptionEn: nullableText(1000),
    descriptionMs: nullableText(1000),
    priceMyr: amount('Price'),
    sizeLabel: nullableText(40),
    imageUrl: httpsImageUrl,
    cloudinaryPublicId: nullableText(300),
    status: z.enum(['available', 'sold']).optional().default('available'),
  })
  .superRefine((value, ctx) => {
    if (value.cloudinaryPublicId && !value.imageUrl.startsWith(CLOUDINARY_PREFIX)) {
      ctx.addIssue({
        code: 'custom',
        path: ['imageUrl'],
        message: 'An uploaded image must be a Cloudinary URL',
      });
    }
  });

export type ReadyStockInput = z.infer<typeof ReadyStockInput>;

export const StatusInput = z.object({
  id: z.uuid(),
  status: z.enum(['available', 'sold']),
});

export const IdInput = z.object({ id: z.uuid() });

// --- Pre-order products ------------------------------------------------------

export const GRID_CLASS_OPTIONS = [
  { value: 'col-span-1 lg:col-span-3', label: 'Wide (2 per row)' },
  { value: 'col-span-1 lg:col-span-2', label: 'Standard (3 per row)' },
] as const;

export const ASPECT_CLASS_OPTIONS = [
  { value: 'aspect-[4/5]', label: 'Portrait 4:5' },
  { value: 'aspect-[3/4]', label: 'Portrait 3:4' },
] as const;

const gridValues = GRID_CLASS_OPTIONS.map((o) => o.value) as [string, ...string[]];
const aspectValues = ASPECT_CLASS_OPTIONS.map((o) => o.value) as [string, ...string[]];

/** Lines like "Material: Terengganu batik". Lines without a colon are ignored. */
export function parseDetailsText(input: string): Record<string, string> | null {
  const entries: [string, string][] = [];
  for (const line of input.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const label = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (label && value) entries.push([label.slice(0, 60), value.slice(0, 200)]);
  }
  return entries.length > 0 ? Object.fromEntries(entries.slice(0, 20)) : null;
}

export function detailsToText(details: Record<string, string> | null): string {
  return details ? Object.entries(details).map(([k, v]) => `${k}: ${v}`).join('\n') : '';
}

export const SizeInput = z.object({
  id: z.uuid().nullable().optional(),
  label: z.string().trim().min(1, 'Size label is required').max(40, 'Size label is too long'),
  priceOverrideMyr: z
    .number()
    .min(0, 'Size price cannot be negative')
    .max(9_999_999)
    .nullable(),
  sortOrder: z.number().int().min(0).max(1000),
});

export type SizeInput = z.infer<typeof SizeInput>;

const sizesJson = z
  .string()
  .optional()
  .transform((raw, ctx) => {
    if (!raw || raw.trim() === '') return [];
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Sizes data is invalid' });
      return z.NEVER;
    }
  })
  .pipe(z.array(SizeInput).max(20, 'Use 20 sizes or fewer'))
  .refine(
    (sizes) => new Set(sizes.map((s) => s.label.toLowerCase())).size === sizes.length,
    'Size labels must be different from each other'
  );

const productId = text(60).refine(
  (v) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
  'ID may use lowercase letters, numbers and single dashes (e.g. senja-tote)'
);

export const ProductIdInput = z.object({ id: productId });

export const ProductInput = z.object({
  id: productId,
  name: requiredText('Name', 120),
  descriptionEn: requiredText('English description', 500),
  descriptionMs: requiredText('Malay description', 500),
  priceMyr: amount('Price'),
  imageUrl: httpsImageUrl,
  cloudinaryPublicId: nullableText(300),
  bg: text(7)
    .transform((v) => (v === '' ? '#8B3A3A' : v))
    .refine((v) => /^#[0-9a-fA-F]{6}$/.test(v), 'Accent colour must look like #8B3A3A'),
  gridClass: z.enum(gridValues).optional().default(gridValues[1]),
  aspectClass: z.enum(aspectValues).optional().default(aspectValues[0]),
  sortOrder: text(6)
    .refine((v) => v === '' || /^\d+$/.test(v), 'Sort order must be a whole number')
    .transform((v) => (v === '' ? 0 : Number(v))),
  isPublished: z
    .string()
    .optional()
    .transform((v) => v === 'on' || v === 'true'),
  details: text(2000).transform(parseDetailsText),
  sizes: sizesJson,
});

export type ProductInput = z.infer<typeof ProductInput>;

// --- Helpers -----------------------------------------------------------------

/** Plain object of string fields from a FormData (files are ignored). */
export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === 'string') out[key] = value;
  });
  return out;
}

/**
 * Validates a record with a schema and collapses issues into a single message plus
 * per-field messages (first issue per field wins).
 */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown
): FormParseResult<z.output<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : '_form';
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  const first = result.error.issues[0];
  return { ok: false, error: first?.message ?? 'Invalid input', fieldErrors };
}
