import { useState } from 'react';
import { Search, Loader2, PackageCheck, AlertTriangle, PackageX } from 'lucide-react';
import { supabase, type Product, type Category } from '@/lib/supabase';

type AdminInventoryProps = {
  products: Product[];
  categories: Category[];
  onProductsChanged: () => void;
};

function stockStatus(qty: number, inStock: boolean): 'in' | 'low' | 'out' {
  if (!inStock || qty === 0) return 'out';
  if (qty <= 5) return 'low';
  return 'in';
}

const STATUS_CONFIG = {
  in: { label: 'In Stock', color: 'bg-green-100 text-green-700', icon: PackageCheck },
  low: { label: 'Low Stock', color: 'bg-sage-100 text-sage-700', icon: AlertTriangle },
  out: { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: PackageX },
} as const;

export function AdminInventory({ products, categories, onProductsChanged }: AdminInventoryProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const status = stockStatus(p.stock_quantity, p.is_in_stock);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const catNameById = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  const updateStock = async (id: string, quantity: number, inStock: boolean) => {
    setUpdating(id);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: quantity, is_in_stock: inStock })
        .eq('id', id);
      if (error) throw error;
      onProductsChanged();
    } catch {
      alert('Failed to update stock');
    } finally {
      setUpdating(null);
    }
  };

  const adjustQty = (p: Product, delta: number) => {
    const newQty = Math.max(0, p.stock_quantity + delta);
    updateStock(p.id, newQty, newQty > 0);
  };

  const toggleInStock = (p: Product) => {
    updateStock(p.id, p.stock_quantity, !p.is_in_stock);
  };

  const counts = {
    in: products.filter((p) => stockStatus(p.stock_quantity, p.is_in_stock) === 'in').length,
    low: products.filter((p) => stockStatus(p.stock_quantity, p.is_in_stock) === 'low').length,
    out: products.filter((p) => stockStatus(p.stock_quantity, p.is_in_stock) === 'out').length,
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {(['in', 'low', 'out'] as const).map((s) => {
          const Icon = STATUS_CONFIG[s].icon;
          return (
            <div key={s} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${STATUS_CONFIG[s].color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{counts[s]}</p>
                <p className="text-xs text-stone-500">{STATUS_CONFIG[s].label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-stone-100">
          <h3 className="font-bold text-stone-900">Inventory Management</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400 w-full sm:w-48"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'in' | 'low' | 'out')}
              className="px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400 bg-white"
            >
              <option value="all">All</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-500 border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Quantity</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-400">
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const status = stockStatus(p.stock_quantity, p.is_in_stock);
                  const StatusIcon = STATUS_CONFIG[status].icon;
                  const isUpdating = updating === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <span className="font-semibold text-stone-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-stone-600">{catNameById(p.category_id)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => adjustQty(p, -1)}
                            disabled={isUpdating}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold disabled:opacity-50"
                          >
                            -
                          </button>
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 text-sage-700 animate-spin" />
                          ) : (
                            <span className="min-w-[28px] text-center font-bold text-stone-800">
                              {p.stock_quantity}
                            </span>
                          )}
                          <button
                            onClick={() => adjustQty(p, 1)}
                            disabled={isUpdating}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[status].color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {STATUS_CONFIG[status].label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleInStock(p)}
                          disabled={isUpdating}
                          className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                            p.is_in_stock ? 'bg-green-500' : 'bg-stone-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                              p.is_in_stock ? 'translate-x-5' : ''
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
