import { describe, it, expect } from 'vitest';
import { isHttpsUrl, isOptimizable } from '@/lib/media';

const CLOUD = 'mvnsfvvi';

describe('isOptimizable', () => {
  it('accepts https Cloudinary URLs under our own cloud name', () => {
    expect(isOptimizable(`https://res.cloudinary.com/${CLOUD}/image/upload/v1/a.jpg`, CLOUD)).toBe(true);
    expect(isOptimizable(`https://res.cloudinary.com/${CLOUD}/image/upload/f_auto/b.png?x=1`, CLOUD)).toBe(true);
  });

  it('rejects Cloudinary URLs from another cloud', () => {
    expect(isOptimizable('https://res.cloudinary.com/someone-else/image/upload/a.jpg', CLOUD)).toBe(false);
  });

  it('rejects a cloud name that only shares a prefix', () => {
    expect(isOptimizable(`https://res.cloudinary.com/${CLOUD}-evil/image/upload/a.jpg`, CLOUD)).toBe(false);
  });

  it.each([
    ['other host', 'https://images.unsplash.com/photo-1.jpg'],
    ['look-alike host', `https://res.cloudinary.com.evil.com/${CLOUD}/a.jpg`],
    ['subdomain trick', `https://evil.com/res.cloudinary.com/${CLOUD}/a.jpg`],
    ['http', `http://res.cloudinary.com/${CLOUD}/a.jpg`],
    ['relative path', '/images/a.jpg'],
    ['empty', ''],
    ['malformed', 'not a url'],
  ])('rejects %s', (_label, src) => {
    expect(isOptimizable(src, CLOUD)).toBe(false);
  });

  it('rejects everything when no cloud name is configured', () => {
    expect(isOptimizable(`https://res.cloudinary.com/${CLOUD}/a.jpg`, '')).toBe(false);
  });
});

describe('isHttpsUrl', () => {
  it('accepts only well-formed https URLs', () => {
    expect(isHttpsUrl('https://example.com/a.jpg')).toBe(true);
    expect(isHttpsUrl('http://example.com/a.jpg')).toBe(false);
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpsUrl('ftp://example.com')).toBe(false);
    expect(isHttpsUrl('nope')).toBe(false);
  });
});
