import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchReadyStockByCode } from '@/lib/ready-stock';
import ReadyStockActions from '@/components/ReadyStockActions';
import MediaImage from '@/components/MediaImage';
import StatusBadge from '@/components/StatusBadge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PageProps {
  params: { code: string };
}

// Bags come and go; render on demand and refresh quickly.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps) {
  const item = await fetchReadyStockByCode(params.code);
  if (!item) return {};
  return {
    title: `${item.name} (${item.code})`,
    description: item.descriptionEn ?? `${item.name}, a one-of-a-kind Terengganu batik bag.`,
  };
}

export default async function ReadyStockDetailPage({ params }: PageProps) {
  const item = await fetchReadyStockByCode(params.code);
  if (!item) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-sand">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-8 pb-0">
          <nav className="flex items-center gap-2 text-sm text-ink-soft">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <span>›</span>
            <Link href="/ready-stock" className="hover:text-ink transition-colors">Ready Stock</Link>
            <span>›</span>
            <span className="text-ink">{item.code}</span>
          </nav>
        </div>

        <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="relative aspect-[4/5] overflow-hidden border border-ink bg-warm-white">
              <MediaImage
                src={item.imageUrl}
                alt={item.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <div className="flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-3">
                <StatusBadge variant="ready" />
                <span data-testid="ready-code" className="text-xs font-semibold tracking-[0.12em] text-ink-soft">{item.code}</span>
              </div>
              <h1 className="font-serif text-[clamp(32px,4vw,52px)] font-medium leading-[1.1] mb-4">
                {item.name}
              </h1>
              <div className="text-2xl font-serif text-ink mb-6">{item.price}</div>

              {item.descriptionEn ? (
                <p className="text-ink-soft leading-relaxed mb-2 text-[15px]">{item.descriptionEn}</p>
              ) : null}
              {item.descriptionMs ? (
                <p className="text-ink-soft leading-relaxed mb-6 text-[15px] italic">{item.descriptionMs}</p>
              ) : null}

              <dl className="mb-6 grid grid-cols-[auto,1fr] gap-x-6 gap-y-1.5 text-sm">
                <dt className="font-medium text-ink">Size / Saiz</dt>
                <dd className="text-ink-soft">{item.sizeLabel ?? 'One size / Satu saiz'}</dd>
                <dt className="font-medium text-ink">Pattern / Corak</dt>
                <dd className="text-ink-soft">One of a kind / Satu-satunya</dd>
              </dl>

              <div className="h-px bg-ink/80 mb-8" />

              <ReadyStockActions item={item} />

              <div className="mt-8 p-4 bg-warm-white border border-ink/60">
                <p className="text-sm text-ink-soft leading-relaxed">
                  This exact bag is yours once we confirm it on WhatsApp. Delivery fee is confirmed in the chat.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
