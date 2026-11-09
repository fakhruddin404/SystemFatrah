import { requireAdmin } from '@/lib/admin/auth';
import StockManager, { type StockRow } from '@/components/admin/StockManager';

export default async function AdminReadyStockPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('ready_stock_items')
    .select('id, code, name, size_label, price_myr, image_url, status')
    .order('created_at', { ascending: false });

  if (error) console.error(`[admin] load ready stock failed: ${error.message}`);

  const rows: StockRow[] = (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    sizeLabel: r.size_label,
    priceMyr: Number(r.price_myr),
    imageUrl: r.image_url,
    status: r.status === 'sold' ? 'sold' : 'available',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium mb-1">Ready stock</h1>
        <p className="text-sm text-ink-soft">
          One-of-a-kind bags. Sold bags disappear from the public site straight away.
        </p>
      </div>
      {error ? <p role="alert" className="text-sm text-maroon">Could not load the list. Please refresh.</p> : null}
      <StockManager rows={rows} />
    </div>
  );
}
