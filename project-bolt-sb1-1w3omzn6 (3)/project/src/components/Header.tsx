import { Coffee, ShoppingCart, Search, X, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';

type HeaderProps = {
  cartCount: number;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigate: (view: 'cafe' | 'admin') => void;
  currentView: 'cafe' | 'admin';
  onTrackActiveOrder?: (orderId: string) => void;
};

export function Header({
  cartCount,
  onCartClick,
  searchQuery,
  onSearchChange,
  onNavigate,
  currentView,
  onTrackActiveOrder,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const checkActiveOrder = () => {
      const id = localStorage.getItem('active_order_id');
      setActiveOrderId(id);
    };
    checkActiveOrder();
    window.addEventListener('active-order-changed', checkActiveOrder);
    window.addEventListener('storage', checkActiveOrder);
    return () => {
      window.removeEventListener('active-order-changed', checkActiveOrder);
      window.removeEventListener('storage', checkActiveOrder);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo + Brand */}
          <button
            onClick={() => onNavigate('cafe')}
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-sage-700 to-sage-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Coffee className="w-6 h-6 text-sage-50" />
            </div>
            <div className="text-left">
              <h1 className="text-lg md:text-xl font-bold text-sage-950 leading-none tracking-tight">
                Da Filli Cafe
              </h1>
              <p className="text-[10px] md:text-xs text-sage-700 font-medium mt-0.5">
                Brewed with passion
              </p>
            </div>
          </button>

          {/* Search (desktop) */}
          {currentView === 'cafe' && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search for coffee, burgers, desserts..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-stone-100 border border-transparent focus:border-sage-400 focus:bg-white focus:ring-2 focus:ring-sage-100 outline-none text-sm text-stone-800 placeholder:text-stone-400 transition-all"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {currentView === 'cafe' && (
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden p-2.5 rounded-full hover:bg-stone-100 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-stone-700" />
              </button>
            )}

            {currentView === 'cafe' && (
              <button
                onClick={onCartClick}
                className="relative flex flex-col items-center gap-0.5 min-w-[52px] px-2 py-1.5 rounded-xl bg-sage-900 hover:bg-sage-800 text-sage-50 shadow-md hover:shadow-lg transition-all hover:scale-105"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-[10px] font-bold leading-none">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-in fade-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && currentView === 'cafe' && (
        <div className="md:hidden absolute top-0 left-0 right-0 bg-white shadow-lg p-4 flex items-center gap-3 z-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search menu..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-stone-100 outline-none text-sm text-stone-800"
            />
          </div>
          <button
            onClick={() => setSearchOpen(false)}
            className="p-2 rounded-full hover:bg-stone-100"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>
      )}

      {/* Floating Track Active Order button */}
      {activeOrderId && onTrackActiveOrder && currentView === 'cafe' && (
        <button
          onClick={() => onTrackActiveOrder(activeOrderId)}
          className="fixed bottom-5 right-5 z-[55] flex items-center gap-2 px-5 py-3 rounded-full bg-sage-900 text-sage-50 shadow-xl hover:bg-sage-800 transition-all hover:scale-105 active:scale-95 animate-in slide-in-from-bottom"
        >
          <Truck className="w-5 h-5" />
          <span className="text-sm font-bold">Track Active Order</span>
        </button>
      )}
    </header>
  );
}
