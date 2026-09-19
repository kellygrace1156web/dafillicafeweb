import { memo } from 'react';
import { Plus, Minus, Leaf } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/format';

type ProductCardProps = {
  product: Product;
};

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { getQuantity, addItem, incrementItem, decrementItem } = useCart();
  const qty = getQuantity(product.id);

  return (
    <div className="group bg-white rounded-xl md:rounded-2xl overflow-hidden border border-stone-200/70 hover:border-sage-300 hover:shadow-xl shadow-sm transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative h-28 sm:h-44 md:h-48 overflow-hidden bg-stone-100" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 192px' }}>
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Veg indicator */}
        <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 bg-white/95 backdrop-blur-sm rounded-md p-0.5 md:p-1 shadow-sm">
          {product.is_veg ? (
            <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-green-600 flex items-center justify-center rounded-sm">
              <Leaf className="w-2 h-2 md:w-2.5 md:h-2.5 text-green-600" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-red-600 flex items-center justify-center rounded-sm">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-600" />
            </div>
          )}
        </div>
        {/* Out of stock overlay */}
        {!product.is_in_stock && (
          <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
            <span className="px-2 py-1 md:px-4 md:py-1.5 bg-white text-stone-900 text-[10px] md:text-xs font-bold rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-2 md:p-4 flex flex-col flex-1">
        <h3 className="font-bold text-stone-900 text-xs md:text-base leading-tight line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-1 text-[11px] md:text-sm text-stone-500 leading-snug line-clamp-1 md:line-clamp-2 flex-1 hidden sm:block">
          {product.description}
        </p>

        <div className="mt-2 md:mt-3 flex items-center justify-between gap-1">
          <span className="text-sm md:text-lg font-bold text-sage-900 whitespace-nowrap">
            {formatCurrency(product.price)}
          </span>

          {product.is_in_stock && (
            <div className="flex items-center flex-shrink-0">
              {qty === 0 ? (
                <button
                  onClick={() => addItem(product)}
                  className="flex items-center gap-0.5 md:gap-1.5 px-2 py-1.5 md:px-4 md:py-2 rounded-full bg-sage-900 hover:bg-sage-800 text-sage-50 text-[11px] md:text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              ) : (
                <div className="flex items-center gap-0.5 md:gap-1 bg-sage-50 rounded-full border border-sage-200">
                  <button
                    onClick={() => decrementItem(product.id)}
                    className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-sage-100 text-sage-900 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <span className="min-w-[16px] md:min-w-[20px] text-center font-bold text-sage-900 text-xs md:text-sm">
                    {qty}
                  </span>
                  <button
                    onClick={() => incrementItem(product.id)}
                    className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-sage-100 text-sage-900 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
