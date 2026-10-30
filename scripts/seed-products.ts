/**
 * SEED-ONLY. One-time, idempotent CSV -> Supabase `products` upsert.
 *
 * Runs locally via `npm run seed [path-to-csv]`. Must never be imported by
 * app/, components/, or lib/ runtime code (it uses the service-role key).
 *
 * CSV source precedence: CLI path argument > GOOGLE_SHEETS_CSV_URL > the
 * bundled scripts/seed-data/products.csv.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Papa from 'papaparse';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TablesInsert } from '../lib/supabase/database.types';
import { SeedRowInput } from './seed-row-input';
import {
  createServiceRoleClient,
  exitOnStartupError,
  loadLocalEnv,
} from './service-role-client';

export type ProductInsert = TablesInsert<'products'>;
export type RawRow = Record<string, string>;

export interface SeedRowIssue {
  /** `id` of the offending row (falls back to `row N` when the id is missing). */
  id: string;
  field: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; rows: SeedRowInput[] }
  | { ok: false; error: SeedRowIssue };

/** Writes rows with `onConflict: 'id'`; resolves to the number of rows written. */
export type UpsertFn = (rows: ProductInsert[]) => Promise<number>;

export class SeedValidationError extends Error {
  readonly issue: SeedRowIssue;

  constructor(issue: SeedRowIssue) {
    super(`Invalid CSV row "${issue.id}", field "${issue.field}": ${issue.message}`);
    this.name = 'SeedValidationError';
    this.issue = issue;
  }
}

/** Pure: CSV text -> raw string records (column headers are camelCase already). */
export function parseCsv(csvText: string): RawRow[] {
  const result = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const fatal = result.errors.find((e) => e.type !== 'FieldMismatch');
  if (fatal) {
    throw new Error(`CSV parse error at row ${(fatal.row ?? 0) + 1}: ${fatal.message}`);
  }
  return result.data;
}

/**
 * Pure: validates EVERY row; returns the parsed (trimmed) output, or the first
 * failure with the offending row id and field.
 */
export function validateRows(rawRows: RawRow[]): ValidationResult {
  const rows: SeedRowInput[] = [];
  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const parsed = SeedRowInput.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        ok: false,
        error: {
          id: raw?.id?.trim() || `row ${i + 1}`,
          field: first.path.length ? first.path.join('.') : '(row)',
          message: first.message,
        },
      };
    }
    rows.push(parsed.data);
  }
  return { ok: true, rows };
}

/** Pure: validated camelCase rows -> snake_case insert rows; sort_order = row position. */
export function toInsertRows(rows: SeedRowInput[]): ProductInsert[] {
  return rows.map((r, index) => ({
    id: r.id,
    name: r.name,
    description_en: r.descriptionEn,
    description_ms: r.descriptionMs,
    price: r.price,
    bg: r.bg,
    grid_class: r.gridClass,
    aspect_class: r.aspectClass,
    image_url: r.imageUrl,
    sort_order: index,
  }));
}

/**
 * Orchestrates parse -> validate-all -> map -> upsert. `upsert` is never called
 * unless every row is valid, so an invalid CSV leaves the table unchanged.
 * Returns the number of rows upserted.
 */
export async function seedProducts(csvText: string, upsert: UpsertFn): Promise<number> {
  const validation = validateRows(parseCsv(csvText));
  if (!validation.ok) throw new SeedValidationError(validation.error);
  if (validation.rows.length === 0) throw new Error('CSV contains no product rows.');
  return upsert(toInsertRows(validation.rows));
}

/** Adapts a service-role client to UpsertFn (idempotent on `id`). */
export function createUpsert(client: SupabaseClient<Database>): UpsertFn {
  return async (rows) => {
    const { data, error } = await client
      .from('products')
      .upsert(rows, { onConflict: 'id' })
      .select('id');
    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    return data?.length ?? 0;
  };
}

async function loadCsvText(argPath: string | undefined, env: NodeJS.ProcessEnv): Promise<string> {
  if (argPath) return readFile(path.resolve(argPath), 'utf8');
  const url = env.GOOGLE_SHEETS_CSV_URL?.trim();
  if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch GOOGLE_SHEETS_CSV_URL (HTTP ${res.status}).`);
    return res.text();
  }
  return readFile(path.join(__dirname, 'seed-data', 'products.csv'), 'utf8');
}

async function main(): Promise<void> {
  loadLocalEnv();

  let client: SupabaseClient<Database>;
  try {
    client = createServiceRoleClient();
  } catch (err) {
    exitOnStartupError(err);
  }

  try {
    const csvText = await loadCsvText(process.argv[2], process.env);
    const count = await seedProducts(csvText, createUpsert(client));
    console.log(`[seed] Upserted ${count} product(s).`);
  } catch (err) {
    if (err instanceof SeedValidationError) {
      console.error(`[seed] ${err.message} No rows were written.`);
    } else {
      console.error(`[seed] ${err instanceof Error ? err.message : String(err)}`);
    }
    // Set exitCode and return (no process.exit) so open sockets can close cleanly.
    process.exitCode = 1;
    return;
  }
}

// Only run when executed directly (`tsx scripts/seed-products.ts`), not when imported.
if (/seed-products\.[cm]?[jt]s$/.test(process.argv[1] ?? '')) {
  void main();
}
