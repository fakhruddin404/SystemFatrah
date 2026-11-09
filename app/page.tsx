import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Showcase from '@/components/Showcase';
import Collection from '@/components/Collection';
import ReadyNow from '@/components/ReadyNow';
import Banner from '@/components/Banner';
import Footer from '@/components/Footer';
import { fetchProducts } from '@/lib/products';
import { fetchLatestAvailable } from '@/lib/ready-stock';

// Ready-stock availability changes whenever a bag sells; keep the page fresh.
export const revalidate = 60;

export default async function Home() {
  const [products, readyNow] = await Promise.all([fetchProducts(), fetchLatestAvailable(4)]);

  // Use the first 4 products for the Showcase slider
  const showcaseSlides = products.slice(0, 4);

  return (
    <>
      <Header />
      <Hero />
      <Showcase slides={showcaseSlides} />
      <ReadyNow items={readyNow} />
      <Collection products={products} />
      <Banner />
      <Footer />
    </>
  );
}
