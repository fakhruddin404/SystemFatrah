import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ReadyStockCatalog } from '@/components/CatalogPage';
import { fetchReadyStock } from '@/lib/ready-stock';

export const metadata: Metadata = {
  title: 'Ready Stock',
  description:
    'One-of-a-kind Terengganu batik bags, each with its own pattern, ready to order on WhatsApp.',
};

// Sold bags must disappear quickly; admin changes also invalidate the data tag.
export const revalidate = 60;

export default async function ReadyStockPage() {
  const items = await fetchReadyStock();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-sand">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
          <ReadyStockCatalog items={items} />
        </div>
      </main>
      <Footer />
    </>
  );
}
