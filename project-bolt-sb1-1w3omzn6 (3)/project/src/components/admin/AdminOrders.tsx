import { useEffect, useState, useMemo } from 'react';
import {
  Loader2,
  Clock,
  ChefHat,
  CheckCircle2,
  Phone,
  MapPin,
  Utensils,
  ShoppingBasket,
  Bike,
  RefreshCw,
  Trash2,
  Receipt as ReceiptIcon,
  Banknote,
  Wallet,
  Plus,
  Minus,
  X,
  ShoppingBag,
  Printer,
} from 'lucide-react';
import { supabase, type Order, type Product, type Category, type OrderItem } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { TAX_RATE, CAFE_NAME } from '@/lib/constants';
import { ReceiptModal } from '@/components/ReceiptModal';

type AdminOrdersProps = {
  refreshTrigger: number;
  onOrdersChanged?: () => void;
};

type OrderType = 'dine-in' | 'takeaway' | 'delivery';

type ManualCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tax_percentage: number;
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

  // POS modal state
  const [showPOS, setShowPOS] = useState(false);
  const [posProducts, setPosProducts] = useState<Product[]>([]);
  const [posCategories, setPosCategories] = useState<Category[]>([]);
  const [posLoading, setPosLoading] = useState(false);
  const [posOrderType, setPosOrderType] = useState<OrderType>('dine-in');
  const [posName, setPosName] = useState('');
  const [posPhone, setPosPhone] = useState('');
  const [posTable, setPosTable] = useState('');
  const [posAddress, setPosAddress] = useState('');
  const [posCart, setPosCart] = useState<ManualCartItem[]>([]);
  const [posActiveCat, setPosActiveCat] = useState('');
  const [posSubmitting, setPosSubmitting] = useState(false);
  const [posError, setPosError] = useState('');

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

  // === POS modal helpers ===

  const openPOS = async () => {
    setShowPOS(true);
    setPosError('');
    if (posProducts.length === 0) {
      setPosLoading(true);
      try {
        const [{ data: cats }, { data: prods }] = await Promise.all([
          supabase.from('categories').select('*').order('sort_order', { ascending: true }),
          supabase.from('products').select('*').order('sort_order', { ascending: true }),
        ]);
        const mappedCats = (cats ?? []) as unknown as Category[];
        const mappedProds = (prods ?? []) as unknown as Product[];
        setPosCategories(mappedCats);
        setPosProducts(mappedProds);
        if (mappedCats.length > 0) setPosActiveCat(mappedCats[0].id);
      } catch {
        setPosError('Failed to load menu items.');
      } finally {
        setPosLoading(false);
      }
    }
  };

  const resetPOS = () => {
    setPosOrderType('dine-in');
    setPosName('');
    setPosPhone('');
    setPosTable('');
    setPosAddress('');
    setPosCart([]);
    setPosError('');
  };

  const closePOS = () => {
    setShowPOS(false);
    resetPOS();
  };

  const addToCart = (p: Product) => {
    setPosCart((prev) => {
      const existing = prev.find((i) => i.id === p.id);
      if (existing) {
        return prev.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, quantity: 1, tax_percentage: p.tax_percentage ?? 0 }];
    });
  };

  const incrementCart = (id: string) => {
    setPosCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)));
  };

  const decrementCart = (id: string) => {
    setPosCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setPosCart((prev) => prev.filter((i) => i.id !== id));
  };

  const posSubtotal = posCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const posTax = posCart.reduce((sum, i) => {
    const rate = i.tax_percentage > 0 ? i.tax_percentage / 100 : TAX_RATE;
    return sum + i.price * i.quantity * rate;
  }, 0);
  const posTotal = posSubtotal + posTax;

  const posFilteredProducts = useMemo(
    () => posProducts.filter((p) => p.category_id === posActiveCat),
    [posProducts, posActiveCat]
  );

  const handleConfirmPOS = async () => {
    setPosError('');
    if (!posName.trim()) {
      setPosError('Customer name is required.');
      return;
    }
    if (posOrderType === 'dine-in' && !posTable.trim()) {
      setPosError('Table number is required for dine-in orders.');
      return;
    }
    if (posOrderType === 'delivery' && !posAddress.trim()) {
      setPosError('Delivery address is required.');
      return;
    }
    if (posCart.length === 0) {
      setPosError('Please add at least one item to the order.');
      return;
    }

    setPosSubmitting(true);
    try {
      const items: OrderItem[] = posCart.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        tax_percentage: i.tax_percentage,
      }));

      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_name: posName.trim(),
          phone: posPhone.trim() || '—',
          order_type: posOrderType,
          table_number: posTable.trim(),
          address: posAddress.trim(),
          items,
          subtotal: posSubtotal,
          tax: posTax,
          total: posTotal,
          status: 'pending',
          payment_method: 'cash',
          transaction_id: null,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      const newOrder = data as unknown as Order;
      await reloadOrders();
      onOrdersChanged?.();

      // Close POS modal and reset form
      setShowPOS(false);
      resetPOS();

      // Trigger the receipt print modal
      setReceiptOrder(newOrder);
    } catch (err) {
      setPosError('Failed to create order. ' + (err as Error).message);
    } finally {
      setPosSubmitting(false);
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
      {/* Header row with New Order button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <button
          onClick={openPOS}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sage-900 text-sage-50 text-sm font-bold hover:bg-sage-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
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

      {/* POS / New Order modal */}
      {showPOS && (
        <div className="fixed inset-0 z-[85] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* POS Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-stone-200">
              <h3 className="font-bold text-lg text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-sage-800" />
                Create New Order
              </h3>
              <button
                onClick={closePOS}
                className="p-2 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* POS Body: two columns on desktop */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col lg:flex-row min-h-full">
                {/* Left: Customer details + cart */}
                <div className="lg:w-[400px] flex-shrink-0 bg-white lg:border-r border-stone-200 p-5 space-y-4">
                  {/* Order type */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">
                      Customer Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'dine-in', label: 'Dine-In', icon: Utensils },
                        { value: 'takeaway', label: 'Takeaway', icon: ShoppingBasket },
                        { value: 'delivery', label: 'Delivery', icon: Bike },
                      ] as { value: OrderType; label: string; icon: typeof Utensils }[]).map(
                        ({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => setPosOrderType(value)}
                            className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              posOrderType === value
                                ? 'border-sage-500 bg-sage-50 text-sage-900'
                                : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Customer fields */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={posName}
                      onChange={(e) => setPosName(e.target.value)}
                      placeholder="Customer name"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={posPhone}
                      onChange={(e) => setPosPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                    />
                  </div>

                  {posOrderType === 'dine-in' && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                        Table Number *
                      </label>
                      <input
                        type="text"
                        value={posTable}
                        onChange={(e) => setPosTable(e.target.value)}
                        placeholder="e.g. T5"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                      />
                    </div>
                  )}

                  {posOrderType === 'delivery' && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                        Delivery Address *
                      </label>
                      <textarea
                        value={posAddress}
                        onChange={(e) => setPosAddress(e.target.value)}
                        rows={2}
                        placeholder="Full delivery address"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400 resize-none"
                      />
                    </div>
                  )}

                  {/* Cart */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide">
                        Order Items
                      </label>
                      {posCart.length > 0 && (
                        <button
                          onClick={() => setPosCart([])}
                          className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    {posCart.length === 0 ? (
                      <div className="bg-stone-50 rounded-lg p-4 text-center text-sm text-stone-400 border border-dashed border-stone-200">
                        Click items on the right to add them
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {posCart.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 bg-stone-50 rounded-lg p-2.5"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-stone-800 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-stone-500">
                                {formatCurrency(item.price)} each
                              </p>
                            </div>
                            <div className="flex items-center gap-1 bg-white rounded-full border border-stone-200">
                              <button
                                onClick={() => decrementCart(item.id)}
                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-700"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="min-w-[16px] text-center text-xs font-bold text-stone-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => incrementCart(item.id)}
                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-700"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-sm font-bold text-sage-900 min-w-[60px] text-right">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 text-stone-300 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  {posCart.length > 0 && (
                    <div className="space-y-1.5 text-sm pt-2 border-t border-stone-100">
                      <div className="flex justify-between text-stone-600">
                        <span>Subtotal</span>
                        <span className="font-medium">{formatCurrency(posSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Tax</span>
                        <span className="font-medium">{formatCurrency(posTax)}</span>
                      </div>
                      <div className="flex justify-between text-stone-900 font-bold text-base pt-1.5 border-t border-stone-100">
                        <span>Total</span>
                        <span className="text-sage-900">{formatCurrency(posTotal)}</span>
                      </div>
                    </div>
                  )}

                  {posError && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{posError}</p>
                  )}
                </div>

                {/* Right: Item picker */}
                <div className="flex-1 p-5 flex flex-col">
                  {/* Category tabs */}
                  {posLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-sage-800 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-1.5 mb-4 flex-wrap">
                        {posCategories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setPosActiveCat(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              posActiveCat === cat.id
                                ? 'bg-sage-900 text-sage-50'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>

                      {/* Products grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 280px)' }}>
                        {posFilteredProducts.map((p) => {
                          const inCart = posCart.find((i) => i.id === p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => addToCart(p)}
                              disabled={!p.is_in_stock}
                              className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                inCart
                                  ? 'border-sage-500 bg-sage-50'
                                  : 'border-stone-200 bg-white hover:border-sage-300 hover:bg-sage-50/30'
                              }`}
                            >
                              {inCart && (
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-sage-600 text-white text-[10px] font-bold flex items-center justify-center">
                                  {inCart.quantity}
                                </span>
                              )}
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-16 rounded-lg object-cover"
                              />
                              <p className="text-xs font-semibold text-stone-800 leading-tight line-clamp-2">
                                {p.name}
                              </p>
                              <p className="text-xs font-bold text-sage-900">
                                {formatCurrency(p.price)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* POS Footer: Confirm & Print */}
            <div className="border-t border-stone-200 bg-white px-6 py-4 flex items-center justify-between gap-3">
              <div className="text-sm text-stone-600">
                {posCart.length > 0 ? (
                  <span>
                    <span className="font-bold text-stone-900">{posCart.length}</span> item{posCart.length !== 1 ? 's' : ''} ·{' '}
                    <span className="font-bold text-sage-900">{formatCurrency(posTotal)}</span>
                  </span>
                ) : (
                  <span className="text-stone-400">No items added yet</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closePOS}
                  className="px-4 py-2.5 rounded-lg text-stone-600 font-semibold text-sm hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPOS}
                  disabled={posSubmitting || posCart.length === 0}
                  className="px-5 py-2.5 rounded-lg bg-sage-900 text-sage-50 font-bold text-sm hover:bg-sage-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {posSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Confirm & Print
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
