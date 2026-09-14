import { X, Printer, Receipt as ReceiptIcon } from 'lucide-react';
import type { Order } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { CAFE_NAME } from '@/lib/constants';

type ReceiptModalProps = {
  order: Order | null;
  cafeAddress: string;
  onClose: () => void;
};

export function ReceiptModal({ order, cafeAddress, onClose }: ReceiptModalProps) {
  if (!order) return null;

  const created = new Date(order.created_at);
  const isOnline = order.payment_method === 'online';
  const paymentLabel = isOnline ? 'Online Mobile Wallet / Bank Transfer' : 'Cash on Delivery / Pay at Counter';

  return (
    <>
      <div
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 no-print">
            <h2 className="font-bold text-stone-900 flex items-center gap-2">
              <ReceiptIcon className="w-5 h-5 text-sage-700" />
              Digital Receipt
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sage-700 text-sage-50 text-sm font-semibold hover:bg-sage-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>
          </div>

          {/* Printable receipt body */}
          <div id="receipt-print" className="px-6 py-6 text-stone-900">
            <div className="text-center pb-4 border-b-2 border-stone-900">
              <h1 className="font-serif italic text-2xl font-bold">{CAFE_NAME}</h1>
              <p className="text-xs text-stone-600 mt-1">{cafeAddress || 'I-8 Markaz, Islamabad'}</p>
            </div>

            <div className="py-3 text-xs space-y-1 border-b border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">Order ID</span>
                <span className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date</span>
                <span className="font-semibold">
                  {created.toLocaleDateString()} {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
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
              {order.order_type === 'delivery' && order.address && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Address</span>
                  <span className="font-semibold max-w-[60%] text-right">{order.address}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Payment</span>
                <span className="font-semibold">{paymentLabel}</span>
              </div>
              {isOnline && order.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Transaction ID</span>
                  <span className="font-semibold">{order.transaction_id}</span>
                </div>
              )}
            </div>

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

            <div className="text-center pt-3 border-t border-stone-200">
              <p className="text-xs text-stone-500">Thank you for visiting!</p>
              <p className="font-serif italic text-sm font-semibold mt-1">{CAFE_NAME}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
