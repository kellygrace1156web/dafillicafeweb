import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Package,
  Search,
  Upload,
  Link as LinkIcon,
} from 'lucide-react';
import { supabase, type Category, type Product } from '@/lib/supabase';
import { formatCurrency, slugify } from '@/lib/format';

type AdminProductsProps = {
  categories: Category[];
  products: Product[];
  onProductsChanged: () => void;
  onCategoriesChanged: () => void;
};

type FormData = {
  id?: string;
  name: string;
  description: string;
  price: string;
  tax_percentage: string;
  image_url: string;
  category_id: string;
  is_veg: boolean;
  is_in_stock: boolean;
};

const emptyForm: FormData = {
  name: '',
  description: '',
  price: '',
  tax_percentage: '0',
  image_url: '',
  category_id: '',
  is_veg: true,
  is_in_stock: true,
};

export function AdminProducts({
  categories,
  products,
  onProductsChanged,
  onCategoriesChanged,
}: AdminProductsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (categories.length > 0 && !editing.category_id) {
      setEditing((e) => ({ ...e, category_id: categories[0].id }));
    }
  }, [categories, editing.category_id]);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'all' || p.category_id === filterCat;
    return matchesSearch && matchesCat;
  });

  const openAdd = () => {
    setEditing({ ...emptyForm, category_id: categories[0]?.id ?? '' });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing({
      id: p.id,
      name: p.name,
      description: p.description,
      price: String(p.price),
      tax_percentage: String(p.tax_percentage ?? 0),
      image_url: p.image_url,
      category_id: p.category_id,
      is_veg: p.is_veg,
      is_in_stock: p.is_in_stock,
    });
    setShowForm(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpe?g|webp|gif)$/)) {
      alert('Please select an image file (PNG, JPG, JPEG, WebP, or GIF)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB. Please choose a smaller file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditing((prev) => ({ ...prev, image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editing.name.trim() || !editing.price || !editing.category_id) {
      alert('Please fill in name, price, and category');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editing.name.trim(),
        description: editing.description.trim(),
        price: parseFloat(editing.price),
        tax_percentage: parseFloat(editing.tax_percentage) || 0,
        image_url: editing.image_url.trim(),
        category_id: editing.category_id,
        is_veg: editing.is_veg,
        is_in_stock: editing.is_in_stock,
      };
      if (editing.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
      setShowForm(false);
      onProductsChanged();
    } catch (err) {
      alert('Failed to save product. ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setConfirmDelete(null);
      onProductsChanged();
    } catch (err) {
      alert('Failed to delete product. ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      const { error } = await supabase.from('categories').insert({
        name: catName.trim(),
        slug: slugify(catName),
        sort_order: categories.length + 1,
      });
      if (error) throw error;
      setCatName('');
      setShowCatForm(false);
      onCategoriesChanged();
    } catch (err) {
      alert('Failed to add category. ' + (err as Error).message);
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its products? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      onCategoriesChanged();
      onProductsChanged();
    } catch (err) {
      alert('Failed to delete category. ' + (err as Error).message);
    }
  };

  const catNameById = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="space-y-6">
      {/* Categories strip */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-sage-800" />
            Categories
          </h3>
          <button
            onClick={() => setShowCatForm(!showCatForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage-900 text-sage-50 text-sm font-semibold hover:bg-sage-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </div>

        {showCatForm && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Category name (e.g. Shakes)"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
            />
            <button
              onClick={handleAddCategory}
              disabled={catSaving}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {catSaving ? 'Adding...' : 'Add'}
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            return (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 group"
              >
                <span className="text-sm font-medium text-stone-700">{cat.name}</span>
                <span className="text-xs text-stone-400">{count}</span>
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Products */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-stone-100">
          <h3 className="font-bold text-stone-900">Menu Products ({products.length})</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
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
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400 bg-white"
            >
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sage-900 text-sage-50 text-sm font-semibold hover:bg-sage-800 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-500 border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Veg</th>
                <th className="px-5 py-3 font-semibold">Stock</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-stone-400">
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate">{p.name}</p>
                          <p className="text-xs text-stone-400 truncate max-w-xs">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-stone-600">{catNameById(p.category_id)}</td>
                    <td className="px-5 py-3 font-semibold text-sage-900">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-5 py-3">
                      {p.is_veg ? (
                        <span className="inline-block w-4 h-4 border-2 border-green-600 rounded-sm" />
                      ) : (
                        <span className="inline-block w-4 h-4 border-2 border-red-600 rounded-sm" />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.is_in_stock
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {p.is_in_stock ? 'In Stock' : 'Out'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg hover:bg-sage-100 text-sage-700 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p.id)}
                          className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[80] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white">
              <h3 className="font-bold text-lg text-stone-900">
                {editing.id ? 'Edit Product' : 'Add Product'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                  placeholder="Cappuccino"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400 resize-none"
                  placeholder="Rich espresso topped with steamed milk..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                    placeholder="180"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                    Category
                  </label>
                  <select
                    value={editing.category_id}
                    onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                    Tax %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editing.tax_percentage}
                    onChange={(e) => setEditing({ ...editing, tax_percentage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                    placeholder="0"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">0 = default 10%</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                  Product Image
                </label>

                {/* Mode toggle */}
                <div className="flex gap-1.5 mb-3 bg-stone-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                      imageMode === 'upload'
                        ? 'bg-white text-sage-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                      imageMode === 'url'
                        ? 'bg-white text-sage-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Image URL
                  </button>
                </div>

                {/* Upload mode */}
                {imageMode === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-stone-300 rounded-lg py-6 px-4 text-center hover:border-sage-400 hover:bg-sage-50/30 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-stone-600">
                        Click to browse and upload
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        PNG, JPG, JPEG · Max 2MB
                      </p>
                    </button>
                  </div>
                ) : (
                  /* URL mode */
                  <input
                    type="text"
                    value={editing.image_url.startsWith('data:') ? '' : editing.image_url}
                    onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                    placeholder="https://images.pexels.com/..."
                  />
                )}

                {/* Preview */}
                {editing.image_url && (
                  <div className="mt-3 relative">
                    <img
                      src={editing.image_url}
                      alt="Preview"
                      className="w-full h-32 rounded-lg object-cover border border-stone-200"
                    />
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, image_url: '' })}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-stone-900/70 text-white flex items-center justify-center hover:bg-stone-900 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_veg}
                    onChange={(e) => setEditing({ ...editing, is_veg: e.target.checked })}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm font-medium text-stone-700">Veg</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_in_stock}
                    onChange={(e) => setEditing({ ...editing, is_in_stock: e.target.checked })}
                    className="w-4 h-4 accent-sage-600"
                  />
                  <span className="text-sm font-medium text-stone-700">In Stock</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-lg text-stone-600 font-semibold text-sm hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-sage-900 text-sage-50 font-semibold text-sm hover:bg-sage-800 transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[80] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="font-bold text-stone-900 mb-1">Delete product?</h3>
            <p className="text-sm text-stone-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-lg text-stone-600 font-semibold text-sm hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
