// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.join(__dirname, '..', '..');
const SCAN_DIRS = ['app', 'components', 'context', 'content', 'lib', 'hooks'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe('brand name', () => {
  const files = SCAN_DIRS.flatMap((d) => sourceFiles(path.join(ROOT, d)));

  it('scans a meaningful number of files', () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it('never uses the old FATRAH spelling in user-facing source', () => {
    const offenders = files
      .filter((f) => /fatrah/i.test(readFileSync(f, 'utf8')))
      .map((f) => path.relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it('defines the brand once in lib/site.ts', () => {
    const site = readFileSync(path.join(ROOT, 'lib', 'site.ts'), 'utf8');
    expect(site).toContain("SITE_NAME = 'Fat_Rahz Batik'");
  });
});
