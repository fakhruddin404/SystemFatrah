'use server';

import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/admin/auth';
import { type ActionState, NOT_ADMIN_MESSAGE } from '@/lib/admin/action-state';
import { revalidateReadyStock } from '@/lib/admin/revalidate';
import {
  IdInput,
  ReadyStockInput,
  StatusInput,
  formDataToObject,
  parseInput,
} from '@/lib/admin/schemas';
import { destroyCloudinaryAsset } from '@/lib/cloudinary-server';

const SAVE_FAILED = 'Could not save the bag. Please try again.';

export async function createReadyStock(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return { error: NOT_ADMIN_MESSAGE };

  const parsed = parseInput(ReadyStockInput, formDataToObject(formData));
  if (!parsed.ok) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  const d = parsed.data;

  const { error } = await admin.supabase.from('ready_stock_items').insert({
    name: d.name,
    description_en: d.descriptionEn,
    description_ms: d.descriptionMs,
    price_myr: d.priceMyr,
    size_label: d.sizeLabel,
    image_url: d.imageUrl,
    cloudinary_public_id: d.cloudinaryPublicId,
    status: d.status,
  });
  if (error) {
    console.error(`[admin] createReadyStock failed: ${error.message}`);
    return { error: SAVE_FAILED };
  }

  revalidateReadyStock();
  redirect('/admin/ready-stock');
}

export async function updateReadyStock(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return { error: NOT_ADMIN_MESSAGE };

  const raw = formDataToObject(formData);
  const idResult = parseInput(IdInput, raw);
  if (!idResult.ok) return { error: 'Missing or invalid bag id.' };
  const parsed = parseInput(ReadyStockInput, raw);
  if (!parsed.ok) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  const d = parsed.data;
  const { id } = idResult.data;

  const { data: existing, error: readError } = await admin.supabase
    .from('ready_stock_items')
    .select('cloudinary_public_id')
    .eq('id', id)
    .maybeSingle();
  if (readError || !existing) {
    if (readError) console.error(`[admin] updateReadyStock read failed: ${readError.message}`);
    return { error: 'That bag no longer exists.' };
  }

  const { error } = await admin.supabase
    .from('ready_stock_items')
    .update({
      name: d.name,
      description_en: d.descriptionEn,
      description_ms: d.descriptionMs,
      price_myr: d.priceMyr,
      size_label: d.sizeLabel,
      image_url: d.imageUrl,
      cloudinary_public_id: d.cloudinaryPublicId,
      status: d.status,
    })
    .eq('id', id);
  if (error) {
    console.error(`[admin] updateReadyStock failed: ${error.message}`);
    return { error: SAVE_FAILED };
  }

  // The image was replaced: remove the previous uploaded asset.
  if (existing.cloudinary_public_id && existing.cloudinary_public_id !== d.cloudinaryPublicId) {
    await destroyCloudinaryAsset(existing.cloudinary_public_id);
  }

  revalidateReadyStock();
  redirect('/admin/ready-stock');
}

/** Quick Available <-> Sold toggle from the stock list. */
export async function setReadyStockStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return { error: NOT_ADMIN_MESSAGE };

  const parsed = parseInput(StatusInput, formDataToObject(formData));
  if (!parsed.ok) return { error: 'Invalid request.' };

  const { error } = await admin.supabase
    .from('ready_stock_items')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id);
  if (error) {
    console.error(`[admin] setReadyStockStatus failed: ${error.message}`);
    return { error: 'Could not update the status. Please try again.' };
  }

  revalidateReadyStock();
  return { ok: true };
}

export async function deleteReadyStock(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return { error: NOT_ADMIN_MESSAGE };

  const parsed = parseInput(IdInput, formDataToObject(formData));
  if (!parsed.ok) return { error: 'Invalid request.' };
  const { id } = parsed.data;

  const { data: existing } = await admin.supabase
    .from('ready_stock_items')
    .select('cloudinary_public_id')
    .eq('id', id)
    .maybeSingle();

  const { error } = await admin.supabase.from('ready_stock_items').delete().eq('id', id);
  if (error) {
    console.error(`[admin] deleteReadyStock failed: ${error.message}`);
    return { error: 'Could not delete the bag. Please try again.' };
  }

  // Best effort: a Cloudinary failure never undoes the delete.
  await destroyCloudinaryAsset(existing?.cloudinary_public_id);

  revalidateReadyStock();
  return { ok: true };
}
