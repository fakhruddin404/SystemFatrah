'use client';

import { useState } from 'react';
import { inputClass } from '@/components/admin/Field';

export interface SizeDraft {
  id: string | null;
  label: string;
  /** Empty string means "use the product price". */
  price: string;
}

let nextKey = 0;
const newKey = () => `size-${nextKey++}`;

/**
 * Edits a product's sizes. An empty list means the product is sold in one size only.
 * Serialises the rows into a hidden `sizes` field (JSON) read by the Server Action.
 */
export default function SizesEditor({
  initial,
  error,
}: {
  initial: SizeDraft[];
  error?: string;
}) {
  const [rows, setRows] = useState(() => initial.map((s) => ({ ...s, key: newKey() })));

  const update = (key: string, patch: Partial<SizeDraft>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const json = JSON.stringify(
    rows.map((r, index) => ({
      id: r.id,
      label: r.label,
      priceOverrideMyr: r.price.trim() === '' ? null : Number(r.price),
      sortOrder: index,
    }))
  );

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">Sizes</legend>
      <p className="text-xs text-ink-soft">
        Leave empty if this design comes in one size. Add a price only when a size costs different from the product price.
      </p>
      <input type="hidden" name="sizes" value={json} />

      {rows.map((row) => (
        <div key={row.key} className="flex flex-wrap items-center gap-3">
          <input
            aria-label="Size label"
            placeholder="Small"
            value={row.label}
            maxLength={40}
            onChange={(e) => update(row.key, { label: e.target.value })}
            className={`${inputClass} !w-40`}
          />
          <input
            aria-label="Size price override (RM)"
            placeholder="Same as product"
            inputMode="decimal"
            value={row.price}
            onChange={(e) => update(row.key, { price: e.target.value })}
            className={`${inputClass} !w-44`}
          />
          <button
            type="button"
            onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
            className="text-sm text-maroon underline underline-offset-2"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, { key: newKey(), id: null, label: '', price: '' }])}
        className="border border-ink px-4 py-2 text-sm font-medium hover:bg-ink hover:text-warm-white transition-colors"
      >
        + Add size
      </button>

      {error ? (
        <p role="alert" className="text-xs text-maroon">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
