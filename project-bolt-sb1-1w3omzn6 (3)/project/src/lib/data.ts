import { supabase } from '@/lib/supabase';
import type { Category, Product } from '@/lib/supabase';

function mapCategory(raw: Record<string, unknown>): Category {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Unnamed'),
    slug: String(raw.slug ?? ''),
    sort_order: Number(raw.sort_order ?? 0),
    created_at: String(raw.created_at ?? ''),
  };
}

function mapProduct(raw: Record<string, unknown>): Product {
  return {
    id: String(raw.id ?? ''),
    category_id: String(raw.category_id ?? ''),
    name: String(raw.name ?? 'Unnamed'),
    description: String(raw.description ?? ''),
    price: Number(raw.price ?? 0),
    image_url: String(raw.image_url ?? ''),
    is_veg: Boolean(raw.is_veg ?? true),
    is_in_stock: Boolean(raw.is_in_stock ?? true),
    stock_quantity: Number(raw.stock_quantity ?? 0),
    tax_percentage: Number(raw.tax_percentage ?? 0),
    sort_order: Number(raw.sort_order ?? 0),
    created_at: String(raw.created_at ?? ''),
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map((row) => mapCategory(row as unknown as Record<string, unknown>));
}

export async function fetchProducts(onlyInStock: boolean): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('sort_order', { ascending: true });

  if (onlyInStock) {
    query = query.eq('is_in_stock', true);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map((row) => mapProduct(row as unknown as Record<string, unknown>));
}

export async function fetchMenuData() {
  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchProducts(true),
  ]);

  // Only keep categories that have at least one in-stock product
  const categoryIdsWithProducts = new Set(products.map((p) => p.category_id));
  const visibleCategories = categories.filter((c) => categoryIdsWithProducts.has(c.id));

  return { categories: visibleCategories, products, allCategories: categories };
}
