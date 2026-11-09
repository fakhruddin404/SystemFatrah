// Only Cloudinary assets under our own cloud name are optimized by Next.js.
// Any other https image URL is still accepted by the admin and rendered
// `unoptimized` by components/MediaImage.tsx (see lib/media.ts).
const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '').trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: cloudName
      ? [
          {
            protocol: 'https',
            hostname: 'res.cloudinary.com',
            pathname: `/${cloudName}/**`,
          },
        ]
      : [],
  },
  async redirects() {
    return [{ source: '/craft', destination: '/about', permanent: true }];
  },
};

export default nextConfig;
