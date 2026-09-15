import { useState, useEffect, useCallback } from 'react';
import { Loader2, UtensilsCrossed, Lock, Instagram, Facebook } from 'lucide-react';
import { type Category, type Product } from '@/lib/supabase';
import { fetchMenuData, fetchProducts } from '@/lib/data';
import { CartProvider, useCart } from '@/context/CartContext';
import { useSettings } from '@/hooks/useSettings';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { CategoryNav } from '@/components/CategoryNav';
import { MenuSection } from '@/components/MenuSection';
import { CartDrawer } from '@/components/CartDrawer';
import { TrackOrder } from '@/components/TrackOrder';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminGate } from '@/components/admin/AdminGate';

type View = 'cafe' | 'admin' | 'track';

function CafeApp() {
  const { totalItems } = useCart();
  const { isOpen, openingTime, closingTime, instagramUrl, tiktokUrl, facebookUrl } = useSettings();
  const [view, setView] = useState<View>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/track-order')) return 'track';
    return 'cafe';
  });
  const [trackOrderId, setTrackOrderId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || '';
  });
  const [adminUnlocked, setAdminUnlocked] = useState(
    () => sessionStorage.getItem('admin_unlocked') === '1'
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { categories: visibleCats, products: visibleProds, allCategories: allCats } = await fetchMenuData();
      setCategories(visibleCats);
      setAllCategories(allCats);
      setProducts(visibleProds);
      setAllProducts(await fetchProducts(false));
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) setView('admin');
      else if (path.startsWith('/track-order')) {
        setView('track');
        const params = new URLSearchParams(window.location.search);
        setTrackOrderId(params.get('id') || '');
      } else setView('cafe');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (v: View) => {
    setView(v);
    const path = v === 'admin' ? '/admin' : v === 'track' ? '/track-order' : '/';
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  const navigateToTrack = (orderId: string) => {
    setCartOpen(false);
    setTrackOrderId(orderId);
    setView('track');
    const path = `/track-order?id=${orderId}`;
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  const scrollToCategory = useCallback((slug: string) => {
    setActiveCategory(slug);
    const el = document.getElementById(`cat-${slug}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (view !== 'cafe' || categories.length === 0) return;
    const onScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (const cat of categories) {
        const el = document.getElementById(`cat-${cat.slug}`);
        if (el && el.offsetTop <= scrollPos) {
          setActiveCategory(cat.slug);
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [view, categories]);

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const productsByCategory = (catId: string) =>
    filteredProducts.filter((p) => p.category_id === catId);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sage-800 animate-spin" />
      </div>
    );
  }

  // Track order view
  if (view === 'track') {
    return (
      <>
        <Header
          cartCount={totalItems}
          onCartClick={() => setCartOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
          onNavigate={navigate}
          currentView="cafe"
        />
        <TrackOrder orderId={trackOrderId} onBack={() => navigate('cafe')} />
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          onOrderPlaced={navigateToTrack}
        />
      </>
    );
  }

  // Admin view
  if (view === 'admin') {
    if (!adminUnlocked) {
      return (
        <AdminGate
          onUnlock={() => setAdminUnlocked(true)}
          onBack={() => navigate('cafe')}
        />
      );
    }
    return (
      <>
        <Header
          cartCount={0}
          onCartClick={() => {}}
          searchQuery=""
          onSearchChange={() => {}}
          onNavigate={navigate}
          currentView="admin"
        />
        <AdminDashboard
          categories={allCategories}
          products={allProducts}
          onProductsChanged={loadData}
          onCategoriesChanged={loadData}
        />
      </>
    );
  }

  // Cafe view
  return (
    <>
      <Header
        cartCount={totalItems}
        onCartClick={() => setCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigate={navigate}
        currentView="cafe"
        onTrackActiveOrder={navigateToTrack}
      />

      {/* Closed banner */}
      {!isOpen && (
        <div className="fixed top-16 md:top-20 left-0 right-0 z-40 bg-red-600 text-white py-2.5 px-4 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <Lock className="w-4 h-4" />
            We are currently closed. {openingTime && closingTime ? `Open daily ${openingTime} – ${closingTime}.` : 'Please check back later.'}
          </div>
        </div>
      )}

      <Hero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        onCategoryClick={scrollToCategory}
        activeCategory={activeCategory}
        isOpen={isOpen}
        openingTime={openingTime}
        closingTime={closingTime}
      />

      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={scrollToCategory}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
        {searchQuery.trim() && filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">
              No items found for "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-5 py-2 rounded-full bg-sage-900 text-sage-50 text-sm font-semibold hover:bg-sage-800 transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          categories.map((cat) => (
            <MenuSection
              key={cat.id}
              category={cat}
              products={productsByCategory(cat.id)}
            />
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-600 to-sage-800 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-sage-50" />
              </div>
              <div>
                <h3 className="font-bold text-white">Da Filli Cafe</h3>
                <p className="text-xs text-stone-400">Brewed with passion, served with love</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <button
                onClick={() => navigate('admin')}
                className="hover:text-sage-400 transition-colors"
              >
                Admin
              </button>
              <span className="text-stone-500">
                {isOpen ? `Open now · ${openingTime} – ${closingTime}` : `Opens at ${openingTime}`}
              </span>
            </div>
          </div>

          {/* Social media links */}
          {(instagramUrl || tiktokUrl || facebookUrl) && (
            <div className="mt-6 flex items-center gap-4">
              <span className="text-xs text-stone-500 font-semibold uppercase tracking-wide">Follow us</span>
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-stone-800 hover:bg-sage-700 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4 text-stone-300" />
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-stone-800 hover:bg-sage-700 flex items-center justify-center transition-colors text-xs font-bold text-stone-300"
                  aria-label="TikTok"
                >
                  TT
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-stone-800 hover:bg-sage-700 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 text-stone-300" />
                </a>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-stone-800 text-center text-xs text-stone-500">
            © 2026 Da Filli Cafe. All rights reserved.
          </div>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onOrderPlaced={navigateToTrack}
      />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <CafeApp />
    </CartProvider>
  );
}
