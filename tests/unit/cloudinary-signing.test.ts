// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildStringToSign,
  defaultUploadFolder,
  destroyEndpoint,
  isManagedPublicId,
  parseCloudinaryUrl,
  signParams,
  uploadEndpoint,
} from '@/lib/cloudinary-signing';

describe('parseCloudinaryUrl', () => {
  it('parses key, secret and cloud name', () => {
    expect(parseCloudinaryUrl('cloudinary://123456:s3cr3t_-AbC@my-cloud')).toEqual({
      apiKey: '123456',
      apiSecret: 's3cr3t_-AbC',
      cloudName: 'my-cloud',
    });
  });

  it('trims surrounding whitespace', () => {
    expect(parseCloudinaryUrl('  cloudinary://1:2@c  ')?.cloudName).toBe('c');
  });

  it.each([
    [undefined],
    [''],
    ['https://res.cloudinary.com/demo'],
    ['cloudinary://onlykey@cloud'],
    ['cloudinary://key:secret@'],
    ['cloudinary://:secret@cloud'],
    ['cloudinary://key:secret@cloud/extra'],
    ['CLOUDINARY_URL=cloudinary://key:secret@cloud'],
  ])('returns null for %j', (raw) => {
    expect(parseCloudinaryUrl(raw as string | undefined)).toBeNull();
  });
});

describe('buildStringToSign', () => {
  it('sorts parameters alphabetically and joins with &', () => {
    expect(buildStringToSign({ timestamp: 1700000000, folder: 'fat-rahz/staging' })).toBe(
      'folder=fat-rahz/staging&timestamp=1700000000'
    );
  });

  it('excludes file, cloud_name, resource_type and api_key', () => {
    expect(
      buildStringToSign({
        file: 'x',
        cloud_name: 'c',
        resource_type: 'image',
        api_key: 'k',
        timestamp: 1,
      })
    ).toBe('timestamp=1');
  });

  it('skips empty, null and undefined values', () => {
    expect(buildStringToSign({ a: '', b: null, c: undefined, d: 'x' })).toBe('d=x');
  });
});

describe('signParams (vectors from Cloudinary documentation)', () => {
  it('signs a minimal upload', () => {
    expect(signParams({ timestamp: 1315060510 }, 'abcd')).toBe('a21ad0f63beb4de2e5575204b79ab90bffb02c10');
  });

  it('signs an upload with additional parameters', () => {
    expect(
      signParams(
        {
          timestamp: 1315060510,
          public_id: 'sample_image',
          eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
          api_key: '1234',
          file: 'https://www.example.com/sample.jpg',
        },
        'abcd'
      )
    ).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e');
  });

  it('depends on the secret and on the parameters', () => {
    const base = signParams({ folder: 'a', timestamp: 1 }, 'secret');
    expect(signParams({ folder: 'a', timestamp: 1 }, 'other')).not.toBe(base);
    expect(signParams({ folder: 'b', timestamp: 1 }, 'secret')).not.toBe(base);
    expect(signParams({ folder: 'a', timestamp: 2 }, 'secret')).not.toBe(base);
  });

  it('never contains the secret in the signature', () => {
    expect(signParams({ timestamp: 1 }, 'supersecretvalue')).not.toContain('supersecretvalue');
  });
});

describe('endpoints and folders', () => {
  it('builds Cloudinary API URLs', () => {
    expect(uploadEndpoint('my-cloud')).toBe('https://api.cloudinary.com/v1_1/my-cloud/image/upload');
    expect(destroyEndpoint('my-cloud')).toBe('https://api.cloudinary.com/v1_1/my-cloud/image/destroy');
  });

  it('separates environments by folder', () => {
    expect(defaultUploadFolder('production')).toBe('fat-rahz/production');
    expect(defaultUploadFolder('preview')).toBe('fat-rahz/preview');
    expect(defaultUploadFolder(undefined)).toBe('fat-rahz/development');
    expect(defaultUploadFolder('  ')).toBe('fat-rahz/development');
  });

  it('only manages assets under the upload folder root', () => {
    expect(isManagedPublicId('fat-rahz/production/abc123', 'fat-rahz/production')).toBe(true);
    expect(isManagedPublicId('fat-rahz/staging/abc123', 'fat-rahz/production')).toBe(true);
    expect(isManagedPublicId('other-project/abc', 'fat-rahz/production')).toBe(false);
    expect(isManagedPublicId('sample', 'fat-rahz/production')).toBe(false);
    expect(isManagedPublicId('fat-rahz/../secret', 'fat-rahz/production')).toBe(false);
  });
});
