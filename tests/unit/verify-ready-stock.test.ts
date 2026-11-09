// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchAvailableIds = vi.fn();
vi.mock('@/lib/ready-stock', () => ({
  fetchAvailableIds: (...args: unknown[]) => fetchAvailableIds(...args),
}));

import { verifyReadyStock } from '@/app/actions/verify-ready-stock';

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
  fetchAvailableIds.mockReset();
});

describe('verifyReadyStock', () => {
  it('returns the ids the database still shows as available', async () => {
    fetchAvailableIds.mockResolvedValue([ID_A]);
    await expect(verifyReadyStock([ID_A, ID_B])).resolves.toEqual([ID_A]);
    expect(fetchAvailableIds).toHaveBeenCalledWith([ID_A, ID_B]);
  });

  it('returns null when the check itself failed, so checkout is not blocked', async () => {
    fetchAvailableIds.mockResolvedValue(null);
    await expect(verifyReadyStock([ID_A])).resolves.toBeNull();
  });

  it.each([
    ['non-uuid ids', ['not-a-uuid']],
    ['too many ids', Array.from({ length: 51 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`)],
  ])('treats %s as nothing available without querying', async (_label, ids) => {
    await expect(verifyReadyStock(ids)).resolves.toEqual([]);
    expect(fetchAvailableIds).not.toHaveBeenCalled();
  });

  it('handles an empty list', async () => {
    fetchAvailableIds.mockResolvedValue([]);
    await expect(verifyReadyStock([])).resolves.toEqual([]);
  });
});
