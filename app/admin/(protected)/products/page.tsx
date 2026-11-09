import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { formatMyr } from '@/lib/money';
import MediaImage from '@/components/MediaImage';

export default async function AdminProductsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price_myr, image_url, is_published, sort_order, product_sizes(id)')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) console.error(`[admin] load products failed: ${error.message}`);
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium mb-1">Pre-order products</h1>
          <p className="text-sm text-ink-soft">Designs customers can order in the size they choose.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center border border-maroon bg-maroon px-5 py-2.5 text-sm font-medium text-warm-white hover:bg-maroon-deep"
        >
          + Add product
        </Link>
      </div>

      {error ? <p role="alert" className="text-sm text-maroon">Could not load products. Please refresh.</p> : null}

      {rows.length === 0 ? (
        <div className="border border-ink bg-warm-white p-10 text-center text-ink-soft">No products yet.</div>
      ) : (
        <ul className="border border-ink bg-warm-white divide-y divide-line">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="relative h-20 w-16 flex-none overflow-hidden border border-ink">
                <MediaImage src={p.image_url} alt={p.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-[160px] flex-1">
                <p className="font-serif text-lg font-medium leading-tight">{p.name}</p>
                <p className="text-xs text-ink-soft">
                  {p.id} · {formatMyr(Number(p.price_myr))} ·{' '}
                  {(p.product_sizes?.length ?? 0) > 0 ? `${p.product_sizes?.length} sizes` : 'One size'}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] border ${
                  p.is_published ? 'border-ink text-ink' : 'border-ink/40 text-ink-soft'
                }`}
              >
                {p.is_published ? 'Published' : 'Hidden'}
              </span>
              <Link
                href={`/admin/products/${p.id}`}
                className="inline-flex items-center border border-ink px-3 py-1.5 text-xs font-medium hover:bg-ink hover:text-warm-white"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
