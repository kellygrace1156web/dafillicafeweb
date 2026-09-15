import { useEffect, useState } from 'react';
import { Link as LinkIcon, ChefHat, CheckCircle2, Clock, Loader2, ArrowLeft, Receipt, Phone, MapPin, Utensils, ShoppingBasket, Bike, Printer } from 'lucide-react';
import { supabase, type Order } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { CAFE_NAME } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';

type TrackOrderProps = {
  orderId: string;
  onBack: () => void;
};

const STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock, color: 'amber' },
  { key: 'preparing', label: 'Cooking', icon: ChefHat, color: 'blue' },
  { key: 'completed', label: 'Ready', icon: CheckCircle2, color: 'green' },
] as const;

const ORDER_TYPE_ICON = {
  'dine-in': Utensils,
  takeaway: ShoppingBasket,
  delivery: Bike,
} as const;

export function TrackOrder({ orderId, onBack }: TrackOrderProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { cafeAddress } = useSettings();

  useEffect(() => {
    let cancelled = false;

    async function fetchOrder() {
      const { data, error: err } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (cancelled) return;

      if (err || !data) {
        setError(true);
        setLoading(false);
        return;
      }
      setOrder(data as Order);
      setLoading(false);

      if ((data as Order).status === 'completed') {
        const storedId = localStorage.getItem('active_order_id');
        if (storedId === orderId) {
          localStorage.removeItem('active_order_id');
          window.dispatchEvent(new Event('active-order-changed'));
        }
      }
    }

    fetchOrder();

    // Realtime subscription for live status updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          const updated = payload.new as Order;
          setOrder(updated);
          if (updated.status === 'completed') {
            const storedId = localStorage.getItem('active_order_id');
            if (storedId === orderId) {
              localStorage.removeItem('active_order_id');
              window.dispatchEvent(new Event('active-order-changed'));
            }
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 text-sage-800 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Order Not Found</h2>
          <p className="text-sm text-stone-500 mb-6">
            We couldn't find this order. The link may be invalid or the order may have been removed.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-full bg-sage-900 text-sage-50 font-semibold text-sm hover:bg-sage-800 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex((s) => s.key === order.status);
  const created = new Date(order.created_at);
  const TypeIcon = ORDER_TYPE_ICON[order.order_type];
  const trackingUrl = `${window.location.origin}/track-order?id=${order.id}`;

  return (
    <div className="min-h-screen bg-stone-50 pt-20 md:pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back link */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-sage-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>

        {/* Order header */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-stone-400 font-medium">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <h1 className="text-2xl font-bold text-stone-900 mt-0.5">Track Your Order</h1>
              <p className="text-sm text-stone-500 mt-1">
                Placed on {created.toLocaleDateString()} at{' '}
                {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <TypeIcon className="w-4 h-4" />
              <span className="capitalize">{order.order_type.replace('-', ' ')}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative mt-8 mb-4">
            {/* Connector line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-stone-200 rounded-full" />
            <div
              className="absolute top-6 left-0 h-1 bg-gradient-to-r from-sage-500 to-green-500 rounded-full transition-all duration-700"
              style={{ width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isComplete = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isComplete
                          ? step.color === 'amber'
                            ? 'bg-sage-500 border-sage-500 text-white'
                            : step.color === 'blue'
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-stone-300 text-stone-300'
                      } ${isCurrent ? 'ring-4 ring-sage-200 scale-110' : ''}`}
                    >
                      <Icon className={`w-6 h-6 ${isCurrent ? 'animate-pulse' : ''}`} />
                    </div>
                    <span
                      className={`text-xs font-semibold transition-colors ${
                        isComplete ? 'text-stone-900' : 'text-stone-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status message */}
          <div
            className={`mt-6 rounded-xl p-4 text-center ${
              order.status === 'completed'
                ? 'bg-green-50 text-green-800'
                : order.status === 'preparing'
                ? 'bg-blue-50 text-blue-800'
                : 'bg-sage-50 text-sage-800'
            }`}
          >
            {order.status === 'pending' && 'Your order has been received and is waiting to be prepared.'}
            {order.status === 'preparing' && 'Our chefs are preparing your order right now!'}
            {order.status === 'completed' && 'Your order is ready! Please collect it or wait for delivery.'}
          </div>
        </div>

        {/* Order details */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
          <h2 className="font-bold text-stone-900 flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-sage-700" />
            Order Details
          </h2>

          <div className="flex flex-wrap gap-4 text-sm text-stone-600 mb-4">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-stone-900">{order.customer_name}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-stone-400" />
              {order.phone}
            </span>
            {order.order_type === 'dine-in' && order.table_number && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-stone-400" />
                Table {order.table_number}
              </span>
            )}
            {order.order_type === 'delivery' && order.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-stone-400" />
                {order.address}
              </span>
            )}
          </div>

          <div className="bg-stone-50 rounded-xl p-4 space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-stone-700">
                  {item.name} <span className="text-stone-400">x{item.quantity}</span>
                </span>
                <span className="font-medium text-stone-600">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Tax (10%)</span>
              <span>{formatCurrency(Number(order.tax))}</span>
            </div>
            <div className="flex justify-between text-stone-900 font-bold text-base pt-1.5 border-t border-stone-100">
              <span>Total</span>
              <span className="text-sage-900">{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Tracking link */}
        <div className="bg-sage-50 rounded-2xl border border-sage-200 p-5 flex items-center gap-3 no-print">
          <LinkIcon className="w-5 h-5 text-sage-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sage-900">Live Tracking Link</p>
            <p className="text-xs text-sage-700 truncate">{trackingUrl}</p>
            <p className="text-xs text-sage-600 mt-0.5">This page updates automatically when the status changes. Bookmark it to check back later.</p>
          </div>
        </div>

        {/* Printable Receipt */}
        {order.status === 'completed' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mt-5">
            <div className="flex items-center justify-between mb-4 no-print">
              <h2 className="font-bold text-stone-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sage-700" />
                Digital Receipt
              </h2>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sage-900 text-sage-50 text-sm font-semibold hover:bg-sage-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>

            <div id="receipt-print" className="max-w-sm mx-auto text-stone-900">
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-stone-900">
                <h1 className="font-serif italic text-2xl font-bold">{CAFE_NAME}</h1>
                <p className="text-xs text-stone-600 mt-1">{cafeAddress || 'I-8 Markaz, Islamabad'}</p>
              </div>

              {/* Order info */}
              <div className="py-3 text-xs space-y-1 border-b border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-500">Order ID</span>
                  <span className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Date</span>
                  <span className="font-semibold">{created.toLocaleDateString()} {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Customer</span>
                  <span className="font-semibold">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Phone</span>
                  <span className="font-semibold">{order.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Type</span>
                  <span className="font-semibold capitalize">{order.order_type.replace('-', ' ')}</span>
                </div>
                {order.order_type === 'dine-in' && order.table_number && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Table</span>
                    <span className="font-semibold">{order.table_number}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="py-3 space-y-1.5 border-b border-stone-200">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-stone-700">
                      {item.name} ×{item.quantity}
                    </span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-3 space-y-1 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Tax</span>
                  <span>{formatCurrency(Number(order.tax))}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-stone-300">
                  <span>Grand Total</span>
                  <span>{formatCurrency(Number(order.total))}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 border-t border-stone-200">
                <p className="text-xs text-stone-500">Thank you for visiting!</p>
                <p className="font-serif italic text-sm font-semibold mt-1">{CAFE_NAME}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-stone-400 mt-6 no-print">
          {CAFE_NAME} — Thank you for your order!
        </p>
      </div>
    </div>
  );
}
