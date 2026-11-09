import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Authenticated-user RLS tests, run against fatrah-staging only (see tests/integration/setup-env.ts).
 *
 * Creates two throwaway auth users with the service-role key (available only on a developer
 * machine or in CI secrets, never in the deployed app):
 *   - one that is NOT on the admin allowlist: every write must be denied
 *   - one that IS an admin: writes work, and sold bags are visible to them but not to the public
 * Everything created here is removed in afterAll.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(url && anonKey && serviceKey);

const SENTINEL = 'RLS-TEST-SENTINEL-DO-NOT-KEEP';
const IMAGE = 'https://res.cloudinary.com/rls-test/sentinel.jpg';
const MISSING = '00000000-0000-4000-8000-000000000000';

type Client = SupabaseClient<Database>;

describe.skipIf(!hasEnv)('authenticated users and the admin allowlist', () => {
  let service: Client;
  let nonAdmin: Client;
  let admin: Client;
  let anon: Client;
  const createdUserIds: string[] = [];
  const createdBagIds: string[] = [];

  async function signedInClient(label: string): Promise<{ client: Client; userId: string }> {
    const email = `rls-${label}-${Math.random().toString(36).slice(2, 10)}@example.test`;
    const password = `Pw-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
    createdUserIds.push(data.user.id);

    const client = createClient<Database>(url as string, anonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(`signIn failed: ${signInError.message}`);
    return { client, userId: data.user.id };
  }

  beforeAll(async () => {
    service = createClient<Database>(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    anon = createClient<Database>(url as string, anonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    nonAdmin = (await signedInClient('user')).client;

    const adminUser = await signedInClient('admin');
    admin = adminUser.client;
    const { error } = await service.from('admin_users').insert({ user_id: adminUser.userId });
    if (error) throw new Error(`allowlisting admin failed: ${error.message}`);
  });

  afterAll(async () => {
    if (createdBagIds.length > 0) {
      await service.from('ready_stock_items').delete().in('id', createdBagIds);
    }
    await service.from('ready_stock_items').delete().eq('name', SENTINEL);
    for (const id of createdUserIds) {
      await service.auth.admin.deleteUser(id); // cascades to admin_users
    }
  });

  it('is_admin() is false for a signed-in user who is not allowlisted, true for an admin', async () => {
    expect((await nonAdmin.rpc('is_admin')).data).toBe(false);
    expect((await admin.rpc('is_admin')).data).toBe(true);
    expect((await anon.rpc('is_admin')).data).toBe(false);
  });

  it('denies every write to a non-admin', async () => {
    const insert = await nonAdmin
      .from('ready_stock_items')
      .insert({ name: SENTINEL, price_myr: 1, image_url: IMAGE })
      .select();
    expect(insert.error).not.toBeNull();

    const product = await nonAdmin
      .from('products')
      .insert({
        id: 'rls-nonadmin-sentinel',
        name: SENTINEL,
        description_en: SENTINEL,
        description_ms: SENTINEL,
        price_myr: 1,
        bg: '#000000',
        grid_class: 'x',
        aspect_class: 'x',
        image_url: IMAGE,
      })
      .select();
    expect(product.error).not.toBeNull();

    const size = await nonAdmin.from('product_sizes').insert({ product_id: 'p1', label: SENTINEL }).select();
    expect(size.error).not.toBeNull();

    const update = await nonAdmin.from('ready_stock_items').update({ name: SENTINEL }).neq('id', MISSING).select();
    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);

    const del = await nonAdmin.from('ready_stock_items').delete().neq('id', MISSING).select();
    expect(del.error !== null || (del.data ?? []).length === 0).toBe(true);
  });

  it('does not let a non-admin read the allowlist of others', async () => {
    const { data } = await nonAdmin.from('admin_users').select('user_id');
    expect(data ?? []).toEqual([]); // not on the list, so not even their own row
  });

  it('lets an admin add, mark sold and delete a bag; the public never sees it once sold', async () => {
    const { data: created, error } = await admin
      .from('ready_stock_items')
      .insert({ name: SENTINEL, price_myr: 123.45, image_url: IMAGE, size_label: 'Medium' })
      .select()
      .single();
    expect(error).toBeNull();
    if (!created) throw new Error('insert returned no row');
    createdBagIds.push(created.id);

    // New bags get a generated code and start as available.
    expect(created.code).toMatch(/^RS-\d{4,}$/);
    expect(created.status).toBe('available');
    expect(created.sold_at).toBeNull();

    const visible = await anon.from('ready_stock_items').select('id').eq('id', created.id);
    expect(visible.data).toHaveLength(1);

    // Mark sold: sold_at is set by the database, and the public no longer sees the bag.
    const sold = await admin.from('ready_stock_items').update({ status: 'sold' }).eq('id', created.id).select().single();
    expect(sold.error).toBeNull();
    expect(sold.data?.sold_at).not.toBeNull();

    const hidden = await anon.from('ready_stock_items').select('id').eq('id', created.id);
    expect(hidden.data).toEqual([]);
    const adminView = await admin.from('ready_stock_items').select('id, status').eq('id', created.id);
    expect(adminView.data).toEqual([{ id: created.id, status: 'sold' }]);

    // Back to available clears sold_at.
    const back = await admin.from('ready_stock_items').update({ status: 'available' }).eq('id', created.id).select().single();
    expect(back.data?.sold_at).toBeNull();

    const del = await admin.from('ready_stock_items').delete().eq('id', created.id).select();
    expect(del.error).toBeNull();
    expect(del.data).toHaveLength(1);
  });

  it('enforces the table constraints for admins too', async () => {
    const badImage = await admin
      .from('ready_stock_items')
      .insert({ name: SENTINEL, price_myr: 1, image_url: 'http://insecure.example/a.jpg' });
    expect(badImage.error).not.toBeNull();

    const negative = await admin
      .from('ready_stock_items')
      .insert({ name: SENTINEL, price_myr: -1, image_url: IMAGE });
    expect(negative.error).not.toBeNull();

    const badStatus = await admin
      .from('ready_stock_items')
      .insert({ name: SENTINEL, price_myr: 1, image_url: IMAGE, status: 'reserved' });
    expect(badStatus.error).not.toBeNull();
  });
});
