import { useEffect, useState } from 'react';
import type { Category } from '@/lib/supabase';

type CategoryNavProps = {
  categories: Category[];
  activeCategory: string;
  onCategoryClick: (slug: string) => void;
};

export function CategoryNav({ categories, activeCategory, onCategoryClick }: CategoryNavProps) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById('category-nav-sentinel');
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div id="category-nav-sentinel" className="h-px w-full" />
      <nav
        className={`sticky top-16 md:top-20 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/60 transition-shadow ${
          stuck ? 'shadow-md' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3 -mx-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryClick(cat.slug)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${
                  activeCategory === cat.slug
                    ? 'bg-sage-900 text-sage-50 shadow-md'
                    : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
