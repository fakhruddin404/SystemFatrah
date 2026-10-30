import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProducts, fetchProductById } from '@/lib/products';
import ProductActions from '@/components/ProductActions';
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
    title: `${product.name} — FATRAH`,
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-sand">
        {/* Breadcrumb */}
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-8 pb-0">
          <nav className="flex items-center gap-2 text-sm text-ink-soft">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <span>›</span>
            <Link href="/#collection" className="hover:text-ink transition-colors">Collection</Link>
            <span>›</span>
            <span className="text-ink">{product.name}</span>
          </nav>
        </div>

        {/* Product Detail */}
        <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Image */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-line bg-warm-white">
              <Image
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
              <p className="text-xs font-semibold tracking-[0.1em] text-maroon uppercase mb-4">
                Handcrafted Batik
              </p>
              <h1 className="font-serif text-[clamp(32px,4vw,52px)] font-medium leading-[1.1] mb-4">
                {product.name}
              </h1>

              <div className="text-2xl font-serif text-ink mb-6">{product.price}</div>

              <p className="text-ink-soft leading-relaxed mb-2 text-[15px]">
                {product.descriptionEn}
              </p>
              <p className="text-ink-soft leading-relaxed mb-8 text-[15px] italic">
                {product.descriptionMs}
              </p>

              <div className="h-px bg-line mb-8" />

              {/* Client-side actions (qty + cart + WhatsApp) */}
              <ProductActions product={product} />

              <div className="mt-8 p-4 bg-warm-white rounded-xl border border-line">
                <p className="text-sm text-ink-soft leading-relaxed">
                  🕐 Made to order — allow <strong>2–4 weeks</strong> for delivery. Each piece is handcrafted by Terengganu artisans.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-20">
            <div className="border-t border-line pt-12 mb-10">
              <h2 className="font-serif text-2xl font-medium">You may also like</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-line bg-warm-white mb-3">
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="33vw"
                    />
                  </div>
                  <h3 className="font-serif text-lg font-medium mb-1">{p.name}</h3>
                  <p className="text-sm text-ink-soft">{p.price}</p>
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
