'use server';

import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { getAdmin } from '@/lib/admin/auth';
import { type ActionState, NOT_ADMIN_MESSAGE } from '@/lib/admin/action-state';
import { revalidateProducts } from '@/lib/admin/revalidate';
import {
  ProductIdInput,
  ProductInput,
  type SizeInput,
  formDataToObject,
  parseInput,
} from '@/lib/admin/schemas';
import { destroyCloudinaryAsset } from '@/lib/cloudinary-server';

const SAVE_FAILED = 'Could not save the product. Please try again.';
const UNIQUE_VIOLATION = '23505';

type Supabase = SupabaseClient<Database>;

/** Makes the product's sizes match `sizes`: update existing, insert new, delete removed. */
async function syncSizes(
  supabase: Supabase,
  productId: string,
  sizes: SizeInput[]
): Promise<string | null> {
  const { data: current, error: readError } = await supabase
    .from('product_sizes')
    .select('id')
    .eq('product_id', productId);
  if (readError) return readError.message;

  const keepIds = new Set(sizes.flatMap((s) => (s.id ? [s.id] : [])));
  const removeIds = (current ?? []).map((r) => r.id).filter((id) => !keepIds.has(id));

  if (removeIds.length > 0) {
    const { error } = await supabase.from('product_sizes').delete().in('id', removeIds);
    if (error) return error.message;
  }

  for (const size of sizes.filter((s) => s.id)) {
    const { error } = await supabase
      .from('product_sizes')
      .update({
        label: size.label,
        price_override_myr: size.priceOverrideMyr,
        sort_order: size.sortOrder,
      })
      .eq('id', size.id as string)
      .eq('product_id', productId);
    if (error) return error.message;
  }

  const fresh = sizes.filter((s) => !s.id);
  if (fresh.length > 0) {
    const { error } = await supabase.from('product_sizes').insert(
      fresh.map((s) => ({
        product_id: productId,
        label: s.label,
        price_override_myr: s.priceOverrideMyr,
        sort_order: s.sortOrder,
      }))
    );
    if (error) return error.message;
  }
  return null;
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return { error: NOT_ADMIN_MESSAGE };

  const parsed = parseInput(ProductInput, formDataToObject(formData));
  if (!parsed.ok) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  const d = parsed.data;

  const { error } = await admin.supabase.from('products').insert({
    id: d.id,
    name: d.name,
    description_en: d.descriptionEn,
    description_ms: d.descriptionMs,
    price_myr: d.priceMyr,
    image_url: d.imageUrl,
    cloudinary_public_id: d.cloudinaryPublicId,
    bg: d.bg,
    grid_class: d.gridClass,
    aspect_class: d.aspectClass,
    sort_order: d.sortOrder,
    is_published: d.isPublished,
    details: d.details,
  });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: 'That ID is already used.', fieldErrors: { id: 'That ID is already used' } };
    }
    console.error(`[admin] createProduct failed: ${error.message}`);
    return { error: SAVE_FAILED };
  }

  const sizeError = await syncSizes(admin.supabase, d.id, d.sizes);
  if (sizeError) {
    console.error(`[admin] createProduct sizes failed: ${sizeError}`);
    // Avoid leaving a half-saved product behind.
    await admin.supabase.from('products').delete().eq('id', d.id);
    return { error: SAVE_FAILED };
  }

  revalidateProducts();
  redirect('/admin/products');
}

export async function updateProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return { error: NOT_ADMIN_MESSAGE };

  const parsed = parseInput(ProductInput, formDataToObject(formData));
  if (!parsed.ok) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  const d = parsed.data;

  const { data: existing, error: readError } = await admin.supabase
    .from('products')
    .select('cloudinary_public_id')
    .eq('id', d.id)
    .maybeSingle();
  if (readError || !existing) {
    if (readError) console.error(`[admin] updateProduct read failed: ${readError.message}`);
    return { error: 'That product no longer exists.' };
  }

  const { error } = await admin.supabase
    .from('products')
    .update({
      name: d.name,
      description_en: d.descriptionEn,
      description_ms: d.descriptionMs,
      price_myr: d.priceMyr,
      image_url: d.imageUrl,
      cloudinary_public_id: d.cloudinaryPublicId,
      bg: d.bg,
      grid_class: d.gridClass,
      aspect_class: d.aspectClass,
      sort_order: d.sortOrder,
      is_published: d.isPublished,
      details: d.details,
    })
    .eq('id', d.id);
  if (error) {
    console.error(`[admin] updateProduct failed: ${error.message}`);
    return { error: SAVE_FAILED };
  }

  const sizeError = await syncSizes(admin.supabase, d.id, d.sizes);
  if (sizeError) {
    console.error(`[admin] updateProduct sizes failed: ${sizeError}`);
    const duplicate = sizeError.includes('product_sizes_product_id_label_key');
    revalidateProducts();
    return {
      error: duplicate
        ? 'Product saved, but two sizes share a label. Please use different labels.'
        : 'Product saved, but its sizes could not be updated. Please try again.',
    };
  }

  if (existing.cloudinary_public_id && existing.cloudinary_public_id !== d.cloudinaryPublicId) {
    await destroyCloudinaryAsset(existing.cloudinary_public_id);
  }

  revalidateProducts();
  redirect('/admin/products');
}

export async function deleteProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return { error: NOT_ADMIN_MESSAGE };

  const parsed = parseInput(ProductIdInput, formDataToObject(formData));
  if (!parsed.ok) return { error: 'Invalid request.' };
  const { id } = parsed.data;

  const { data: existing } = await admin.supabase
    .from('products')
    .select('cloudinary_public_id')
    .eq('id', id)
    .maybeSingle();

  // Sizes are removed by the ON DELETE CASCADE foreign key.
  const { error } = await admin.supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error(`[admin] deleteProduct failed: ${error.message}`);
    return { error: 'Could not delete the product. Please try again.' };
  }

  await destroyCloudinaryAsset(existing?.cloudinary_public_id);

  revalidateProducts();
  redirect('/admin/products');
}
