import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import ReadyStockForm from '@/components/admin/ReadyStockForm';

export default async function EditReadyStockPage({ params }: { params: { id: string } }) {
  if (!z.uuid().safeParse(params.id).success) notFound();

  const { supabase } = await requireAdmin();
  const { data: row } = await supabase
    .from('ready_stock_items')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-medium">Edit bag</h1>
      <ReadyStockForm
        item={{
          id: row.id,
          code: row.code,
          name: row.name,
          descriptionEn: row.description_en ?? '',
          descriptionMs: row.description_ms ?? '',
          priceMyr: Number(row.price_myr),
          sizeLabel: row.size_label ?? '',
          imageUrl: row.image_url,
          cloudinaryPublicId: row.cloudinary_public_id ?? '',
          status: row.status === 'sold' ? 'sold' : 'available',
        }}
      />
    </div>
  );
}
