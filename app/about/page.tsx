import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AboutContent from '@/components/AboutContent';

export const metadata: Metadata = {
  title: 'Our Story',
  description:
    'Fat_Rahz Batik turns authentic Terengganu batik into modern, elegant bags. 100% handmade, sewn in Terengganu since 2014.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <AboutContent />
      <Footer />
    </>
  );
}
