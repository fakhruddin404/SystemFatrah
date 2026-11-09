// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  TargetError,
  assertStagingTarget,
  describeProject,
  readTarget,
  resolveSeedTarget,
} from '../../scripts/target-guard';

const env = (overrides: Record<string, string | undefined>) => ({ NODE_ENV: 'test', ...overrides }) as NodeJS.ProcessEnv;

describe('readTarget', () => {
  it('accepts staging and production, ignoring case and whitespace', () => {
    expect(readTarget(env({ SUPABASE_TARGET: 'staging' }))).toBe('staging');
    expect(readTarget(env({ SUPABASE_TARGET: ' Production ' }))).toBe('production');
  });

  it.each([[undefined], [''], ['prod'], ['dev'], ['both']])('refuses %j', (value) => {
    expect(() => readTarget(env({ SUPABASE_TARGET: value }))).toThrow(TargetError);
  });
});

describe('resolveSeedTarget', () => {
  it('always allows staging', () => {
    expect(resolveSeedTarget(env({ SUPABASE_TARGET: 'staging' }), false)).toBe('staging');
  });

  it('refuses production without --confirm-production', () => {
    expect(() => resolveSeedTarget(env({ SUPABASE_TARGET: 'production' }), false)).toThrow(/--confirm-production/);
  });

  it('allows production with the explicit flag', () => {
    expect(resolveSeedTarget(env({ SUPABASE_TARGET: 'production' }), true)).toBe('production');
  });

  it('refuses when no target is set, even with the flag', () => {
    expect(() => resolveSeedTarget(env({}), true)).toThrow(TargetError);
  });
});

describe('assertStagingTarget', () => {
  it('passes only for staging', () => {
    expect(() => assertStagingTarget(env({ SUPABASE_TARGET: 'staging' }))).not.toThrow();
    expect(() => assertStagingTarget(env({ SUPABASE_TARGET: 'production' }))).toThrow(/staging/);
    expect(() => assertStagingTarget(env({}))).toThrow(TargetError);
  });
});

describe('describeProject', () => {
  it('shows only the host, never keys', () => {
    const text = describeProject(
      env({
        NEXT_PUBLIC_SUPABASE_URL: 'https://abcd.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'secret-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'secret-service-key',
      })
    );
    expect(text).toBe('abcd.supabase.co');
    expect(text).not.toContain('secret');
  });

  it('handles a missing URL', () => {
    expect(describeProject(env({}))).toBe('(unknown host)');
  });
});
