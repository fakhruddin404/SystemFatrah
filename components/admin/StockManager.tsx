'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import {
  deleteReadyStock,
  setReadyStockStatus,
} from '@/app/admin/(protected)/ready-stock/actions';
import { formatMyr } from '@/lib/money';
import MediaImage from '@/components/MediaImage';
import SubmitButton from '@/components/admin/SubmitButton';

export interface StockRow {
  id: string;
  code: string;
  name: string;
  sizeLabel: string | null;
  priceMyr: number;
  imageUrl: string;
  status: 'available' | 'sold';
}

type Filter = 'all' | 'available' | 'sold';

function StatusToggle({ row }: { row: StockRow }) {
  const [state, action] = useFormState(setReadyStockStatus, null);
  const next = row.status === 'available' ? 'sold' : 'available';
  return (
    <form action={action}>
      <input type="hidden" name="id" value={row.id} />
      <input type="hidden" name="status" value={next} />
      <SubmitButton variant="outline" className="!px-3 !py-1.5 text-xs">
        {row.status === 'available' ? 'Mark sold' : 'Mark available'}
      </SubmitButton>
      {state?.error ? <p role="alert" className="mt-1 text-xs text-maroon">{state.error}</p> : null}
    </form>
  );
}

function DeleteForm({ row }: { row: StockRow }) {
  const [state, action] = useFormState(deleteReadyStock, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={row.id} />
      <SubmitButton
        variant="danger"
        className="!px-3 !py-1.5 text-xs"
        confirmMessage={`Delete ${row.code} (${row.name})? This cannot be undone.`}
      >
        Delete
      </SubmitButton>
      {state?.error ? <p role="alert" className="mt-1 text-xs text-maroon">{state.error}</p> : null}
    </form>
  );
}

export default function StockManager({ rows }: { rows: StockRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = rows.filter((r) => filter === 'all' || r.status === filter);
  const count = (f: Filter) => (f === 'all' ? rows.length : rows.filter((r) => r.status === f).length);

  const tab = (f: Filter, label: string) => (
    <button
      key={f}
      type="button"
      onClick={() => setFilter(f)}
      aria-pressed={filter === f}
      className={`px-4 py-2 text-sm font-medium border transition-colors ${
        filter === f ? 'bg-ink text-warm-white border-ink' : 'border-ink/40 hover:border-ink'
      }`}
    >
      {label} ({count(f)})
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {tab('all', 'All')}
          {tab('available', 'Available')}
          {tab('sold', 'Sold')}
        </div>
        <Link
          href="/admin/ready-stock/new"
          className="inline-flex items-center border border-maroon bg-maroon px-5 py-2.5 text-sm font-medium text-warm-white hover:bg-maroon-deep"
        >
          + Add bag
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="border border-ink bg-warm-white p-10 text-center text-ink-soft">
          {rows.length === 0 ? 'No bags yet. Add your first ready-stock bag.' : 'No bags match this filter.'}
        </div>
      ) : (
        <ul className="border border-ink bg-warm-white divide-y divide-line">
          {visible.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="relative h-20 w-16 flex-none overflow-hidden border border-ink">
                <MediaImage src={row.imageUrl} alt={row.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-[160px] flex-1">
                <p className="font-serif text-lg font-medium leading-tight">{row.name}</p>
                <p className="text-xs text-ink-soft">
                  {row.code} · {row.sizeLabel ?? 'One size'} · {formatMyr(row.priceMyr)}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] border ${
                  row.status === 'available' ? 'bg-ready text-warm-white border-ready' : 'border-ink/60 text-ink-soft'
                }`}
              >
                {row.status === 'available' ? 'Available' : 'Sold'}
              </span>
              <div className="flex flex-wrap items-start gap-2">
                <StatusToggle row={row} />
                <Link
                  href={`/admin/ready-stock/${row.id}`}
                  className="inline-flex items-center border border-ink px-3 py-1.5 text-xs font-medium hover:bg-ink hover:text-warm-white"
                >
                  Edit
                </Link>
                <DeleteForm row={row} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
