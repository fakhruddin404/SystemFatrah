import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';

type Admin = Awaited<ReturnType<typeof requireAdmin>>;

function unwrapCount(label: string, result: { count: number | null; error: { message: string } | null }) {
  if (result.error) {
    console.error(`[admin] dashboard count failed for ${label}: ${result.error.message}`);
    return null;
  }
  return result.count ?? 0;
}

const readyCount = async (admin: Admin, status: 'available' | 'sold') =>
  unwrapCount(
    `ready stock (${status})`,
    await admin.supabase
      .from('ready_stock_items')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)
  );

const productCount = async (admin: Admin) =>
  unwrapCount('products', await admin.supabase.from('products').select('id', { count: 'exact', head: true }));

function Stat({ label, value, href }: { label: string; value: number | null; href: string }) {
  return (
    <Link href={href} className="block border border-ink bg-warm-white p-6 transition-colors hover:bg-white">
      <div className="font-serif text-4xl font-light text-maroon mb-1">{value ?? '–'}</div>
      <div className="text-sm text-ink-soft">{label}</div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [available, sold, products] = await Promise.all([
    readyCount(admin, 'available'),
    readyCount(admin, 'sold'),
    productCount(admin),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium mb-1">Dashboard</h1>
        <p className="text-sm text-ink-soft">Mark bags as sold after a WhatsApp order is confirmed.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Stat label="Ready stock available" value={available} href="/admin/ready-stock" />
        <Stat label="Ready stock sold" value={sold} href="/admin/ready-stock" />
        <Stat label="Pre-order products" value={products} href="/admin/products" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/ready-stock/new"
          className="inline-flex items-center border border-maroon bg-maroon px-5 py-2.5 text-sm font-medium text-warm-white hover:bg-maroon-deep"
        >
          + Add ready-stock bag
        </Link>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center border border-ink px-5 py-2.5 text-sm font-medium hover:bg-ink hover:text-warm-white"
        >
          + Add pre-order product
        </Link>
      </div>
    </div>
  );
}
