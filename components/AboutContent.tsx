'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { aboutContent as c } from '@/content/about';
import { SOCIAL_LINKS, whatsappUrl } from '@/lib/site';

const outlineLink =
  'inline-flex items-center justify-center bg-transparent text-ink py-[13px] px-[26px] text-sm font-medium border border-ink transition-colors hover:bg-ink hover:text-warm-white';

export default function AboutContent() {
  const { lang } = useLanguage();

  return (
    <main className="bg-sand min-h-screen">
      {/* Hero */}
      <section className="bg-ink text-warm-white py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <p className="text-xs font-semibold tracking-[0.12em] text-gold uppercase mb-6">{c.eyebrow[lang]}</p>
          <h1 className="font-serif text-[clamp(38px,5.6vw,76px)] font-medium leading-[1.05] max-w-4xl mb-8">
            {c.headline[lang]}
          </h1>
          <p className="text-[17px] text-[#FAF7F1]/70 max-w-xl leading-relaxed">{c.intro[lang]}</p>
        </div>
      </section>

      {/* Who we are */}
      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <p className="text-xs font-semibold tracking-[0.1em] text-maroon uppercase mb-5">{c.who.title[lang]}</p>
            <div className="space-y-4">
              {c.who.paragraphs.map((p, i) => (
                <p key={i} className="text-[16px] text-ink-soft leading-relaxed">{p[lang]}</p>
              ))}
            </div>
          </div>
          <div className="border border-ink bg-warm-white p-10 grid gap-8">
            {c.stats.map((s) => (
              <div key={s.label.en}>
                <div className="font-serif text-4xl font-light text-maroon mb-1">{s.value[lang]}</div>
                <p className="text-sm text-ink-soft">{s.label[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest sourcing */}
      <section className="bg-warm-white border-y border-ink">
        <div className="max-w-[860px] mx-auto px-6 lg:px-10 py-16 lg:py-24 text-center">
          <p className="text-xs font-semibold tracking-[0.1em] text-maroon uppercase mb-5">{c.sourcing.title[lang]}</p>
          <p className="font-serif text-[clamp(22px,2.8vw,32px)] leading-[1.4]">{c.sourcing.body[lang]}</p>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <h2 className="font-serif text-[clamp(28px,3vw,38px)] font-medium mb-14 text-center">{c.stepsTitle[lang]}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {c.steps.map((step) => (
            <div key={step.number}>
              <span className="block text-[11px] font-bold tracking-[0.1em] text-maroon mb-2">{step.number}</span>
              <h3 className="font-serif text-[22px] font-medium leading-snug mb-3">{step.title[lang]}</h3>
              <p className="text-[15px] text-ink-soft leading-relaxed border-l-2 border-ink pl-4">{step.body[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For every age */}
      <section className="bg-[#2A2420] text-warm-white py-20 text-center">
        <div className="max-w-[860px] mx-auto px-6 lg:px-10">
          <h2 className="font-serif text-[clamp(26px,3.4vw,40px)] font-medium mb-5">{c.everyAge.title[lang]}</h2>
          <p className="text-[16px] text-[#FAF7F1]/75 leading-relaxed">{c.everyAge.body[lang]}</p>
        </div>
      </section>

      {/* Two ways to buy */}
      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <h2 className="font-serif text-[clamp(28px,3vw,38px)] font-medium mb-12 text-center">{c.buy.title[lang]}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-ink bg-warm-white p-8">
            <h3 className="font-serif text-2xl font-medium mb-3">{c.buy.ready.title[lang]}</h3>
            <p className="text-[15px] text-ink-soft leading-relaxed mb-6">{c.buy.ready.body[lang]}</p>
            <Link href="/ready-stock" className="inline-flex items-center justify-center bg-ready text-warm-white py-[13px] px-[26px] text-sm font-medium transition-colors hover:bg-ready-deep">
              {c.buy.ready.cta[lang]}
            </Link>
          </div>
          <div className="border border-ink bg-warm-white p-8">
            <h3 className="font-serif text-2xl font-medium mb-3">{c.buy.preorder.title[lang]}</h3>
            <p className="text-[15px] text-ink-soft leading-relaxed mb-6">{c.buy.preorder.body[lang]}</p>
            <Link href="/pre-order" className={outlineLink}>{c.buy.preorder.cta[lang]}</Link>
          </div>
        </div>
      </section>

      {/* Find us */}
      <section className="border-t border-ink py-16 text-center">
        <div className="max-w-[720px] mx-auto px-6 lg:px-10">
          <h2 className="font-serif text-2xl font-medium mb-4">{c.find.title[lang]}</h2>
          <p className="text-ink-soft text-[15px] mb-8">{c.find.body[lang]}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={outlineLink}>WhatsApp</a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className={outlineLink}>Instagram</a>
            <a href={SOCIAL_LINKS.threads} target="_blank" rel="noopener noreferrer" className={outlineLink}>Threads</a>
            <a href={SOCIAL_LINKS.shopee} target="_blank" rel="noopener noreferrer" className={outlineLink}>Shopee</a>
          </div>
        </div>
      </section>
    </main>
  );
}
