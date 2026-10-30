'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/products';

interface ShowcaseProps {
  slides: Product[];
}

export default function Showcase({ slides }: ShowcaseProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (i: number) => setCurrent((i + slides.length) % slides.length);
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!slides || slides.length === 0) return null;

  return (
    <section className="relative h-[60vh] min-h-[380px] lg:h-[78vh] lg:min-h-[460px] max-h-[720px] overflow-hidden">
      {slides.map((s, i) => (
        <div 
          key={s.id} 
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === current ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
        >
          <div className="absolute inset-0 bg-ink/30 z-10" /> {/* Dark overlay for text legibility */}
          <Image
            src={s.imageUrl}
            alt={s.name}
            fill
            priority={i === 0}
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute left-6 bottom-6 lg:left-10 lg:bottom-10 text-warm-white z-20">
            <div className="font-serif text-[28px] font-medium mb-1.5">{s.name}</div>
            <div className="text-sm opacity-85">{s.price}</div>
          </div>
        </div>
      ))}

      <button 
        className="absolute top-1/2 -translate-y-1/2 left-6 bg-[#FAF7F1]/85 w-11 h-11 rounded-full text-xl text-ink flex items-center justify-center z-20 transition-colors hover:bg-warm-white" 
        aria-label="Previous" 
        onClick={() => { prev(); resetTimer(); }}
      >
        ‹
      </button>
      <button 
        className="absolute top-1/2 -translate-y-1/2 right-6 bg-[#FAF7F1]/85 w-11 h-11 rounded-full text-xl text-ink flex items-center justify-center z-20 transition-colors hover:bg-warm-white" 
        aria-label="Next" 
        onClick={() => { next(); resetTimer(); }}
      >
        ›
      </button>

      <div className="absolute bottom-6 right-6 lg:right-10 z-20 flex gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`w-2 h-2 rounded-full p-0 transition-colors ${i === current ? 'bg-warm-white' : 'bg-[#FAF7F1]/50'}`}
            onClick={() => { goTo(i); resetTimer(); }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
