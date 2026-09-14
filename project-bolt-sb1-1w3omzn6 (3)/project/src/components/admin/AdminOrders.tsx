import { useEffect, useState } from 'react';
import { Loader2, Clock, ChefHat, CheckCircle2, Phone, MapPin, Utensils, ShoppingBasket, Bike, RefreshCw, Trash2, Receipt as ReceiptIcon, Banknote, Wallet } from 'lucide-react';
import { supabase, type Order } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { ReceiptModal } from '@/components/ReceiptModal';

type AdminOrdersProps = {
  refreshTrigger: number;
  onOrdersChanged?: () => void;
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-sage-100 text-sage-800 border-sage-300', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: ChefHat },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
} as const;

const ORDER_TYPE_ICON = {
  'dine-in': Utensils,
  takeaway: ShoppingBasket,
  delivery: Bike,
} as const;

export function AdminOrders({ refreshTrigger, onOrdersChanged }: AdminOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'completed'>('all');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [cafeAddress, setCafeAddress] = useState('I-8 Markaz, Islamabad');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!cancelled && !error) setOrders(data as Order[]);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  useEffect(() => {
    async function loadAddress() {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'cafe_address')
        .maybeSingle();
      if (data?.value) setCafeAddress(data.value);
    }
    loadAddress();
  }, []);

  const updateStatus = async (id: string, status: Order['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    } catch {
      alert('Failed to update order status');
    }
  };

  const reloadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) setOrders(data as Order[]);
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (!confirm(`Delete order for "${customerName}"? This action cannot be undone.`)) return;
    try {
      const { error, count } = await supabase
        .from('orders')
        .delete({ count: 'exact' })
        .eq('id', id);
      if (error) throw error;
      if (count === 0) throw new Error('No rows were deleted — the order may have already been removed.');
      setOrders((prev) => prev.filter((o) => o.id !== id));
      onOrdersChanged?.();
    } catch (err) {
      alert('Failed to delete order. Reloading the list.');
      console.error('Delete failed:', err);
      reloadOrders();
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 bg-white rounded-xl border border-stone-200 p-1.5 w-fit overflow-x-auto">
        {(['all', 'pending', 'preparing', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all whitespace-nowrap ${
              filter === f ? 'bg-sage-900 text-sage-50' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {f}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-sage-50/20' : 'bg-stone-100'}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sage-800 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 py-16 text-center">
          <RefreshCw className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400 font-medium">No orders here yet</p>
          <p className="text-sm text-stone-300 mt-1">New orders will appear in real time</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order) => {
            const StatusIcon = STATUS_CONFIG[order.status].icon;
            const TypeIcon = ORDER_TYPE_ICON[order.order_type];
            const created = new Date(order.created_at);
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-medium">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <h3 className="font-bold text-stone-900 mt-0.5">{order.customer_name}</h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[order.status].color}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {STATUS_CONFIG[order.status].label}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <TypeIcon className="w-3.5 h-3.5" />
                    <span className="capitalize">{order.order_type.replace('-', ' ')}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {order.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {order.payment_method === 'online' ? (
                      <><Wallet className="w-3.5 h-3.5" /> Online</>
                    ) : (
                      <><Banknote className="w-3.5 h-3.5" /> Cash</>
                    )}
                  </span>
                  <span className="text-stone-400">
                    {created.toLocaleDateString()} {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {order.payment_method === 'online' && order.transaction_id && (
                  <p className="text-xs text-stone-500 flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-stone-700">TID: {order.transaction_id}</span>
                  </p>
                )}

                {order.order_type === 'dine-in' && order.table_number && (
                  <p className="text-xs text-stone-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Table: {order.table_number}
                  </p>
                )}
                {order.order_type === 'delivery' && order.address && (
                  <p className="text-xs text-stone-500 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5" /> {order.address}
                  </p>
                )}

                {/* Items */}
                <div className="bg-stone-50 rounded-xl p-3 space-y-1.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-stone-700">
                        {item.name} <span className="text-stone-400">×{item.quantity}</span>
                      </span>
                      <span className="font-medium text-stone-600">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                  <span className="text-sm text-stone-500">Total (incl. tax)</span>
                  <span className="font-bold text-sage-900">{formatCurrency(order.total)}</span>
                </div>

                {/* Status actions */}
                <div className="flex gap-2">
                  {order.status !== 'pending' && (
                    <button
                      onClick={() => updateStatus(order.id, 'pending')}
                      className="flex-1 py-2 rounded-lg border border-sage-300 text-sage-700 text-xs font-semibold hover:bg-sage-50 transition-colors"
                    >
                      Pending
                    </button>
                  )}
                  {order.status !== 'preparing' && (
                    <button
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="flex-1 py-2 rounded-lg border border-blue-300 text-blue-700 text-xs font-semibold hover:bg-blue-50 transition-colors"
                    >
                      Preparing
                    </button>
                  )}
                  {order.status !== 'completed' && (
                    <button
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="flex-1 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => setReceiptOrder(order)}
                    className="px-3 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors flex items-center gap-1"
                    title="View receipt"
                  >
                    <ReceiptIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(order.id, order.customer_name)}
                    className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors flex items-center gap-1"
                    title="Delete order"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          cafeAddress={cafeAddress}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}
