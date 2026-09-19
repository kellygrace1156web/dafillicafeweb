import { memo } from 'react';
import type { Category, Product } from '@/lib/supabase';
import { ProductCard } from './ProductCard';

type MenuSectionProps = {
  category: Category;
  products: Product[];
};

export const MenuSection = memo(function MenuSection({ category, products }: MenuSectionProps) {
  if (products.length === 0) return null;

  return (
    <section id={`cat-${category.slug}`} className="scroll-mt-32 md:scroll-mt-36">
      <div className="flex items-center gap-3 mb-4 md:mb-5">
        <h2 className="text-lg md:text-2xl font-bold text-stone-900">{category.name}</h2>
        <span className="text-xs md:text-sm text-stone-400 font-medium">
          {products.length} item{products.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-5"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 320px' }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
});
