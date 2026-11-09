import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProducts, fetchProductById } from '@/lib/products';
import { priceLabel } from '@/lib/pricing';
import { PREORDER_LEAD_TIME } from '@/lib/site';
import ProductPurchasePanel from '@/components/ProductPurchasePanel';
import MediaImage from '@/components/MediaImage';
import StatusBadge from '@/components/StatusBadge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  const products = await fetchProducts();
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const product = await fetchProductById(params.id);
  if (!product) return {};
  return {
    title: product.name,
    description: product.descriptionEn,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const [product, allProducts] = await Promise.all([
    fetchProductById(params.id),
    fetchProducts(),
  ]);

  if (!product) notFound();

  const related = allProducts.filter((p) => p.id !== product.id).slice(0, 3);
  const detailEntries = product.details ? Object.entries(product.details) : [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-sand">
        {/* Breadcrumb */}
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-8 pb-0">
          <nav className="flex items-center gap-2 text-sm text-ink-soft">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <span>›</span>
            <Link href="/pre-order" className="hover:text-ink transition-colors">Pre-order</Link>
            <span>›</span>
            <span className="text-ink">{product.name}</span>
          </nav>
        </div>

        {/* Product Detail */}
        <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Image */}
            <div className="relative aspect-[4/5] overflow-hidden border border-ink bg-warm-white">
              <MediaImage
                src={product.imageUrl}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Info + Actions */}
            <div className="flex flex-col justify-center">
              <div className="mb-4">
                <StatusBadge variant="preorder" />
              </div>
              <h1 className="font-serif text-[clamp(32px,4vw,52px)] font-medium leading-[1.1] mb-4">
                {product.name}
              </h1>

              <p className="text-ink-soft leading-relaxed mb-2 text-[15px]">
                {product.descriptionEn}
              </p>
              <p className="text-ink-soft leading-relaxed mb-6 text-[15px] italic">
                {product.descriptionMs}
              </p>

              {detailEntries.length > 0 ? (
                <dl className="mb-6 grid grid-cols-[auto,1fr] gap-x-6 gap-y-1.5 text-sm">
                  {detailEntries.map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="font-medium text-ink">{label}</dt>
                      <dd className="text-ink-soft">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <div className="h-px bg-ink/80 mb-8" />

              {/* Client-side actions (price, size, qty, cart, WhatsApp) */}
              <ProductPurchasePanel product={product} />

              <div className="mt-8 p-4 bg-warm-white border border-ink/60">
                <p className="text-sm text-ink-soft leading-relaxed">
                  🕐 Made to order — allow <strong>{PREORDER_LEAD_TIME.en}</strong>. Each bag is 100% handmade with care.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-20">
            <div className="border-t border-ink/80 pt-12 mb-10">
              <h2 className="font-serif text-2xl font-medium">You may also like</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden border border-ink bg-warm-white mb-3">
                    <MediaImage
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="33vw"
                    />
                  </div>
                  <h3 className="font-serif text-lg font-medium mb-1">{p.name}</h3>
                  <p className="text-sm text-ink-soft">{priceLabel(p, 'en')}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
