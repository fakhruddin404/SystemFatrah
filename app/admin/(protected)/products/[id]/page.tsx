import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { detailsToText } from '@/lib/admin/schemas';
import { mapRowToProduct, type ProductRowWithSizes } from '@/lib/products';
import ProductForm, { DeleteProductForm } from '@/components/admin/ProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from('products')
    .select('*, product_sizes(*)')
    .eq('id', params.id)
    .maybeSingle();
  if (!data) notFound();

  const row = data as ProductRowWithSizes;
  const product = mapRowToProduct(row);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-medium">Edit product</h1>
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          descriptionEn: product.descriptionEn,
          descriptionMs: product.descriptionMs,
          priceMyr: product.priceMyr,
          imageUrl: product.imageUrl,
          cloudinaryPublicId: row.cloudinary_public_id ?? '',
          bg: product.bg,
          gridClass: product.gridClass,
          aspectClass: product.aspectClass,
          sortOrder: row.sort_order,
          isPublished: row.is_published,
          detailsText: detailsToText(product.details),
          sizes: product.sizes.map((s) => ({
            id: s.id,
            label: s.label,
            price: s.priceMyr === null ? '' : String(s.priceMyr),
          })),
        }}
      />
      <DeleteProductForm id={product.id} name={product.name} />
    </div>
  );
}
