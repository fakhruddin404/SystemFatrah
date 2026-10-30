import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Showcase from '@/components/Showcase';
import Collection from '@/components/Collection';
import Banner from '@/components/Banner';
import Footer from '@/components/Footer';
import { fetchProducts } from '@/lib/products';

export default async function Home() {
  const products = await fetchProducts();
  
  // Use the first 4 products for the Showcase slider
  const showcaseSlides = products.slice(0, 4);

  return (
    <>
      <Header />
      <Hero />
      <Showcase slides={showcaseSlides} />
      <Collection products={products} />
      <Banner />
      <Footer />
    </>
  );
}
