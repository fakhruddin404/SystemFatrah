import { describe, it, expect } from 'vitest';
import { errorMessage } from '@/lib/log';

describe('errorMessage', () => {
  it('reads Error instances', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('reads plain Supabase-style error objects instead of printing [object Object]', () => {
    expect(errorMessage({ message: 'relation "x" does not exist', code: '42P01' })).toBe(
      'relation "x" does not exist'
    );
  });

  it('falls back to String() for everything else', () => {
    expect(errorMessage('plain text')).toBe('plain text');
    expect(errorMessage(42)).toBe('42');
    expect(errorMessage({ message: '' })).toBe('[object Object]');
    expect(errorMessage(null)).toBe('null');
  });
});
