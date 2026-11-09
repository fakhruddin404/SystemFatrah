import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PreorderCatalog } from '@/components/CatalogPage';
import { fetchProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Pre-order',
  description:
    'Choose a Terengganu batik bag design and we will sew it to order, in the size you choose.',
};

export const revalidate = 3600;

export default async function PreorderPage() {
  const products = await fetchProducts();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-sand">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
          <PreorderCatalog products={products} />
        </div>
      </main>
      <Footer />
    </>
  );
}
