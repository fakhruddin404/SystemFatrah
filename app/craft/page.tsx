import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Our Craft — FATRAH',
  description: 'The story behind Terengganu batik — the artisans, the wax, the dye, and the tradition carried forward.',
};

const steps = [
  {
    number: '01',
    title: 'The Cloth',
    titleMs: 'Kain',
    body: 'We source premium cotton and silk from local suppliers. Each bolt is washed and pre-treated by hand before a single line is drawn.',
    bodyMs: 'Kami mendapatkan kapas dan sutera premium daripada pembekal tempatan. Setiap gulung dibasuh dan dirawat terlebih dahulu sebelum sebarang garisan dilukis.',
    icon: '🧵',
  },
  {
    number: '02',
    title: 'The Wax',
    titleMs: 'Lilin',
    body: 'Hot wax is applied with a canting — a small copper-tipped pen — in a slow, meditative process. No two lines are ever identical.',
    bodyMs: 'Lilin panas digunakan dengan canting — pen berujung tembaga kecil — dalam proses yang perlahan dan meditatif. Tiada dua garisan yang serupa.',
    icon: '🕯️',
  },
  {
    number: '03',
    title: 'The Dye',
    titleMs: 'Celupan',
    body: 'The waxed cloth is immersed in natural dye baths — indigo, rust, mahogany — with each colour requiring its own soak and dry cycle.',
    bodyMs: 'Kain berlilin dicelup ke dalam pemandian pewarna semula jadi — indigo, karat, mahogani — setiap warna memerlukan kitaran rendam dan keringnya tersendiri.',
    icon: '🎨',
  },
  {
    number: '04',
    title: 'The Boil',
    titleMs: 'Merebus',
    body: 'Once dyeing is complete, the cloth is boiled to remove the wax, revealing the final pattern — always a surprise, always unique.',
    bodyMs: 'Setelah pencelupan selesai, kain direbus untuk menghilangkan lilin, mendedahkan corak akhir — sentiasa mengejutkan, sentiasa unik.',
    icon: '♨️',
  },
  {
    number: '05',
    title: 'The Making',
    titleMs: 'Pembuatan',
    body: 'Our Kuala Terengganu workshop hand-cuts and sews each bag to order, with reinforced stitching and brass hardware that outlasts trends.',
    bodyMs: 'Bengkel kami di Kuala Terengganu memotong dan menjahit setiap beg mengikut tempahan, dengan jahitan diperkuat dan perkakasan loyang yang tahan lama.',
    icon: '✂️',
  },
  {
    number: '06',
    title: 'Quality Check',
    titleMs: 'Pemeriksaan Kualiti',
    body: 'Every piece passes through a final quality check before leaving our hands. If it isn\'t perfect, it doesn\'t ship.',
    bodyMs: 'Setiap produk melalui pemeriksaan kualiti akhir sebelum meninggalkan tangan kami. Jika ia tidak sempurna, ia tidak dihantar.',
    icon: '✅',
  },
];

export default function CraftPage() {
  return (
    <>
      <Header />
      <main className="bg-sand min-h-screen">

        {/* Hero */}
        <section className="bg-ink text-warm-white py-24 lg:py-32">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p className="text-xs font-semibold tracking-[0.12em] text-gold uppercase mb-6">Our Craft</p>
            <h1 className="font-serif text-[clamp(40px,6vw,80px)] font-medium leading-[1.05] max-w-3xl mb-8">
              Made slowly,<br />on purpose.
            </h1>
            <p className="text-[17px] text-[#FAF7F1]/70 max-w-xl leading-relaxed">
              Every FATRAH bag begins as a blank cloth and ends as a wearable story — coloured by fire, water, wax, and the patient hands of our artisans in Terengganu.
            </p>
          </div>
        </section>

        {/* Process */}
        <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <h2 className="font-serif text-[clamp(28px,3vw,38px)] font-medium mb-16 text-center">How a bag is made</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.number} className="group">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl">{step.icon}</span>
                  <div>
                    <span className="block text-[11px] font-bold tracking-[0.1em] text-maroon mb-1">{step.number}</span>
                    <h3 className="font-serif text-[22px] font-medium leading-snug">{step.title}</h3>
                    <p className="text-xs text-ink-soft italic">{step.titleMs}</p>
                  </div>
                </div>
                <p className="text-[15px] text-ink-soft leading-relaxed border-l-2 border-line pl-4 ml-1">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Quote Banner */}
        <section className="bg-[#2A2420] text-warm-white py-20 text-center">
          <div className="max-w-[860px] mx-auto px-6 lg:px-10">
            <p className="font-serif italic text-[clamp(22px,3vw,32px)] leading-[1.45] mb-5">
              &quot;We don&apos;t chase speed. Batik teaches you to trust the process — the wax, the dye, the boil. Rushing it ruins it.&quot;
            </p>
            <p className="text-[13px] tracking-[0.08em] text-[#FAF7F1]/50">— HAMZAH, HEAD ARTISAN, FATRAH WORKSHOP</p>
          </div>
        </section>

        {/* Artisans */}
        <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-[0.1em] text-maroon uppercase mb-5">The People</p>
              <h2 className="font-serif text-[clamp(28px,3.5vw,44px)] font-medium leading-[1.1] mb-6">
                Three generations of wax-resist craft.
              </h2>
              <p className="text-[15px] text-ink-soft leading-relaxed mb-4">
                Our core team of five artisans trained under the late Mek Weh — one of Terengganu&apos;s last master batik makers. Today, they pass that knowledge to younger hands in our workshop on Jalan Banggol.
              </p>
              <p className="text-[15px] text-ink-soft leading-relaxed">
                Each artisan signs the lining of every bag they complete. If you look inside your FATRAH bag, you&apos;ll find their mark.
              </p>
            </div>
            <div className="flex-1 bg-warm-white border border-line rounded-2xl p-10 text-center">
              <div className="text-5xl font-serif font-light text-maroon mb-2">5</div>
              <p className="text-sm text-ink-soft mb-8">Core artisans</p>
              <div className="text-5xl font-serif font-light text-maroon mb-2">3</div>
              <p className="text-sm text-ink-soft mb-8">Generations of knowledge</p>
              <div className="text-5xl font-serif font-light text-maroon mb-2">100%</div>
              <p className="text-sm text-ink-soft">Made in Terengganu</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-line py-16 text-center">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <h2 className="font-serif text-2xl font-medium mb-4">Carry the tradition forward.</h2>
            <p className="text-ink-soft text-[15px] mb-8">Browse our handcrafted collection — every piece made to order.</p>
            <Link
              href="/#collection"
              className="inline-flex items-center gap-2.5 bg-maroon text-warm-white py-[15px] px-[30px] text-sm font-medium border border-maroon hover:bg-maroon-deep transition-colors"
            >
              Shop the Collection →
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
