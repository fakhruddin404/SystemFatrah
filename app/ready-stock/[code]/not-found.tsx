import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ReadyStockNotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] bg-sand">
        <div className="max-w-[720px] mx-auto px-6 lg:px-10 py-24 text-center">
          <p className="text-xs font-semibold tracking-[0.12em] text-maroon uppercase mb-4">Ready Stock</p>
          <h1 className="font-serif text-[clamp(30px,4vw,44px)] font-medium leading-[1.1] mb-4">
            This bag is no longer available
          </h1>
          <p className="text-ink-soft text-[16px] mb-8">
            It may have just found a new home, or the link may be wrong. Have a look at what is ready now, or order a
            design made just for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/ready-stock"
              className="inline-flex items-center justify-center bg-maroon text-warm-white py-[15px] px-[30px] text-sm font-medium border border-maroon transition-colors hover:bg-maroon-deep"
            >
              See ready stock
            </Link>
            <Link
              href="/pre-order"
              className="inline-flex items-center justify-center bg-transparent text-ink py-[15px] px-[30px] text-sm font-medium border border-ink transition-colors hover:bg-ink hover:text-warm-white"
            >
              Browse pre-order
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
