import { useState, useEffect } from 'react';
import { Package, ClipboardList, BarChart3, Boxes, Settings } from 'lucide-react';
import type { Category, Product } from '@/lib/supabase';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminInventory } from './AdminInventory';
import { AdminSettings } from './AdminSettings';

type Tab = 'menu' | 'orders' | 'analytics' | 'inventory' | 'settings';

type AdminDashboardProps = {
  categories: Category[];
  products: Product[];
  onProductsChanged: () => void;
  onCategoriesChanged: () => void;
};

export function AdminDashboard({
  categories,
  products,
  onProductsChanged,
  onCategoriesChanged,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('menu');
  const [ordersRefresh, setOrdersRefresh] = useState(0);

  const switchTab = (t: Tab) => {
    setTab(t);
    if (t === 'orders' || t === 'analytics') {
      setOrdersRefresh((n) => n + 1);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'menu', label: 'Menu', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Cafe Settings', icon: Settings },
  ];

  // Persist active tab across re-renders within session
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_tab') as Tab | null;
    if (saved) setTab(saved);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('admin_tab', tab);
  }, [tab]);

  return (
    <div className="min-h-screen bg-stone-50 pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Admin Dashboard</h1>
          <p className="text-sm text-stone-500 mt-1">Manage your menu, track orders, and view analytics</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 bg-white rounded-xl border border-stone-200 p-1.5 w-fit overflow-x-auto max-w-full">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  tab === t.id ? 'bg-sage-900 text-sage-50 shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'menu' && (
          <AdminProducts
            categories={categories}
            products={products}
            onProductsChanged={onProductsChanged}
            onCategoriesChanged={onCategoriesChanged}
          />
        )}
        {tab === 'inventory' && (
          <AdminInventory
            products={products}
            categories={categories}
            onProductsChanged={onProductsChanged}
          />
        )}
        {tab === 'orders' && <AdminOrders refreshTrigger={ordersRefresh} onOrdersChanged={() => setOrdersRefresh((n) => n + 1)} />}
        {tab === 'analytics' && <AdminAnalytics refreshTrigger={ordersRefresh} />}
        {tab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
