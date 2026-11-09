import Image, { type ImageProps } from 'next/image';
import { isOptimizable } from '@/lib/media';

type MediaImageProps = Omit<ImageProps, 'src' | 'unoptimized'> & { src: string };

/**
 * next/image wrapper enforcing the image host policy: only our own Cloudinary
 * assets are optimized; any other https URL is rendered as-is (`unoptimized`).
 */
export default function MediaImage({ src, alt, ...props }: MediaImageProps) {
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is forwarded from the caller
  return <Image src={src} alt={alt} unoptimized={!isOptimizable(src)} {...props} />;
}
