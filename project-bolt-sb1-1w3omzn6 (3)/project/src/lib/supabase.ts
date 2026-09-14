import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  is_in_stock: boolean;
  stock_quantity: number;
  tax_percentage: number;
  sort_order: number;
  created_at: string;
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tax_percentage?: number;
};

export type SiteSetting = {
  key: string;
  value: string;
  updated_at: string;
};

export type PaymentMethod = 'cash' | 'online';

export type PaymentConfig = {
  cash_enabled: boolean;
  online_enabled: boolean;
  easypaisa_name: string;
  easypaisa_number: string;
  jazzcash_name: string;
  jazzcash_number: string;
  bank_name: string;
  bank_title: string;
  bank_iban: string;
};

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  order_type: 'dine-in' | 'takeaway' | 'delivery';
  table_number: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'preparing' | 'completed';
  created_at: string;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  payment_screenshot_url: string | null;
};
