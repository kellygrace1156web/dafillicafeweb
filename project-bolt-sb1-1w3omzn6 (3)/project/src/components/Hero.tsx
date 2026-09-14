import { Search } from 'lucide-react';
import type { Category } from '@/lib/supabase';
import { siteConfig } from '@/config/siteConfig';

type HeroProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories: Category[];
  onCategoryClick: (slug: string) => void;
  activeCategory: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
};

export function Hero({
  searchQuery,
  onSearchChange,
  categories,
  onCategoryClick,
  activeCategory,
  isOpen,
  openingTime,
  closingTime,
}: HeroProps) {
  return (
    <section className={`relative min-h-[88vh] flex items-center overflow-hidden pt-16 ${!isOpen ? 'mt-10' : ''}`}>
      <div className="hero-background absolute inset-0" aria-hidden="true">
        <img
          src="/image.png"
          alt="Da Filli Cafe drinks"
          className="h-full w-full object-cover"
          width="1920"
          height="1080"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-2xl text-left">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border mb-6 ${
              isOpen
                ? 'bg-sage-50/15 border-sage-50/20'
                : 'bg-red-500/20 border-red-400/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
            />
            <span className="text-xs font-medium text-sage-50">
              {isOpen
                ? `Open now · ${openingTime} – ${closingTime}`
                : `Closed · Opens at ${openingTime}`}
            </span>
          </div>

          <h1 className="font-serif italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.98] tracking-tight drop-shadow-2xl">
            Da Filli Cafe
          </h1>
          <div className="mt-4 h-1 w-20 rounded-full bg-sage-400" />

          <p className="mt-6 text-base md:text-lg text-stone-200 leading-relaxed max-w-xl">
            {siteConfig.heroTagline}
          </p>

          <div className="mt-8 relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for coffee, burgers, desserts..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/30 focus:border-sage-400 focus:ring-4 focus:ring-sage-400/20 outline-none text-stone-800 placeholder:text-stone-400 shadow-2xl text-base"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryClick(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                  activeCategory === cat.slug
                    ? 'bg-sage-400 text-stone-900 shadow-lg'
                    : 'bg-white/15 backdrop-blur-sm text-white border border-white/25 hover:bg-white/25'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-50 to-transparent" />
    </section>
  );
}
