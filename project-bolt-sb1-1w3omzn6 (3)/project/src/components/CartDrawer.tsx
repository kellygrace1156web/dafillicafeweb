import { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Utensils,
  ShoppingBasket,
  Bike,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Lock,
  Printer,
  Banknote,
  Wallet,
  Upload,
  CreditCard,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/format';
import { CAFE_NAME } from '@/lib/constants';
import { supabase, type Order, type PaymentMethod } from '@/lib/supabase';
import { useSettings } from '@/hooks/useSettings';
import { ReceiptModal } from '@/components/ReceiptModal';

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
};

type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export function CartDrawer({ open, onClose, onOrderPlaced }: CartDrawerProps) {
  const { items, incrementItem, decrementItem, removeItem, clearCart, subtotal, taxBreakdown, totalTax, total } = useCart();
  const { whatsappNumber, isOpen, cafeAddress, deliveryEnabled, paymentConfig } = useSettings();
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');

  const tax = totalTax;

  const availableOrderTypes: { value: OrderType; label: string; icon: typeof Utensils }[] = [
    { value: 'dine-in', label: 'Dine-In', icon: Utensils },
    { value: 'takeaway', label: 'Takeaway', icon: ShoppingBasket },
    ...(deliveryEnabled ? [{ value: 'delivery' as OrderType, label: 'Delivery', icon: Bike }] : []),
  ];

  const availablePaymentMethods: { value: PaymentMethod; label: string; icon: typeof Banknote; desc: string }[] = [];
  if (paymentConfig.cash_enabled) {
    availablePaymentMethods.push({
      value: 'cash',
      label: 'Cash on Delivery / Pay at Counter',
      icon: Banknote,
      desc: 'Pay with cash when you receive your order',
    });
  }
  if (paymentConfig.online_enabled) {
    availablePaymentMethods.push({
      value: 'online',
      label: 'Online Mobile Wallet / Bank Transfer',
      icon: Wallet,
      desc: 'EasyPaisa / JazzCash / Bank Transfer',
    });
  }

  const hasOnlineDetails =
    paymentConfig.easypaisa_number ||
    paymentConfig.jazzcash_number ||
    paymentConfig.bank_iban;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[0-9+\-\s()]{7,}$/.test(phone.trim())) e.phone = 'Enter a valid phone number';
    if (orderType === 'dine-in' && !tableNumber.trim()) e.tableNumber = 'Table number is required';
    if (orderType === 'delivery' && !address.trim()) e.address = 'Address is required';
    if (paymentMethod === 'online' && !transactionId.trim()) e.transactionId = 'Transaction ID is required for online payment';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildWhatsAppMessage = (orderId: string) => {
    const trackingUrl = `${window.location.origin}/track-order?id=${orderId}`;
    const lines = [
      `*${CAFE_NAME} — New Order*`,
      `Order ID: ${orderId.slice(0, 8).toUpperCase()}`,
      ``,
      `*Customer:* ${name}`,
      `*Phone:* ${phone}`,
      `*Type:* ${orderType.toUpperCase()}`,
    ];
    if (orderType === 'dine-in') lines.push(`*Table:* ${tableNumber}`);
    if (orderType === 'delivery') lines.push(`*Address:* ${address}`);
    lines.push(``, `*Items:*`);
    items.forEach((i) => {
      lines.push(`  • ${i.name} x${i.quantity} — ${formatCurrency(i.price * i.quantity)}`);
    });
    lines.push(
      ``,
      `Subtotal: ${formatCurrency(subtotal)}`,
    );
    taxBreakdown.forEach((t) => {
      lines.push(`Tax (${t.label}): ${formatCurrency(t.amount)}`);
    });
    lines.push(
      `*Total: ${formatCurrency(total)}*`,
      ``,
      `*Payment:* ${paymentMethod === 'online' ? 'Online Mobile Wallet / Bank Transfer' : 'Cash on Delivery / Pay at Counter'}`,
    );
    if (paymentMethod === 'online' && transactionId) {
      lines.push(`*Transaction ID:* ${transactionId}`);
      if (screenshotFile) lines.push(`*Receipt Screenshot:* ${screenshotFile.name}`);
    }
    lines.push(
      ``,
      `*Track this order live:*`,
      `${trackingUrl}`,
      ``,
      `_Sent from Da Filli Cafe web ordering_`
    );
    return encodeURIComponent(lines.join('\n'));
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_name: name.trim(),
          phone: phone.trim(),
          order_type: orderType,
          table_number: tableNumber.trim(),
          address: address.trim(),
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            tax_percentage: i.tax_percentage,
          })),
          subtotal,
          tax,
          total,
          status: 'pending',
          payment_method: paymentMethod,
          transaction_id: paymentMethod === 'online' ? transactionId.trim() : null,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      const orderId = data?.id ?? 'unknown';
      setPlacedOrderId(orderId);
      setPlacedOrder(data as Order);

      const msg = buildWhatsAppMessage(orderId);
      if (whatsappNumber) {
        setWhatsappLink(`https://wa.me/${whatsappNumber}?text=${msg}`);
      }

      setSuccess(true);
      clearCart();
      setName('');
      setPhone('');
      setTableNumber('');
      setAddress('');
      setOrderType('dine-in');
      setPaymentMethod('cash');
      setTransactionId('');
      setScreenshotFile(null);
    } catch (err) {
      alert('Failed to place order. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (success) {
      setSuccess(false);
      setShowReceipt(false);
      setPlacedOrder(null);
    }
    onClose();
  };

  const paymentLabel = (method: PaymentMethod) =>
    method === 'online' ? 'Online Mobile Wallet / Bank Transfer' : 'Cash on Delivery / Pay at Counter';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-stone-950/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-stone-50 z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-sage-900" />
            <h2 className="font-bold text-lg text-stone-900">Your Order</h2>
            {items.length > 0 && (
              <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Order Placed!</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Your order has been confirmed. Here is your digital receipt.
            </p>

            {/* Inline receipt preview */}
            {placedOrder && (
              <div className="w-full bg-white rounded-xl border border-stone-200 p-4 text-left text-xs space-y-1 max-h-[220px] overflow-y-auto">
                <div className="text-center pb-2 border-b border-stone-200">
                  <p className="font-bold text-stone-900">{CAFE_NAME}</p>
                  <p className="text-stone-500">{cafeAddress || 'I-8 Markaz, Islamabad'}</p>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Order ID</span>
                  <span className="font-semibold text-stone-700">#{placedOrder.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Payment</span>
                  <span className="font-semibold text-stone-700">{paymentLabel(placedOrder.payment_method)}</span>
                </div>
                {placedOrder.payment_method === 'online' && placedOrder.transaction_id && (
                  <div className="flex justify-between text-stone-500">
                    <span>TID</span>
                    <span className="font-semibold text-stone-700">{placedOrder.transaction_id}</span>
                  </div>
                )}
                {placedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-stone-700">
                    <span>{item.name} ×{item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-stone-500 pt-1 border-t border-stone-100">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(placedOrder.subtotal))}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Tax</span>
                  <span>{formatCurrency(Number(placedOrder.tax))}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                  <span>Grand Total</span>
                  <span>{formatCurrency(Number(placedOrder.total))}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 mt-1 w-full">
              <button
                onClick={() => setShowReceipt(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-sage-300 bg-sage-50 text-sage-700 text-sm font-semibold hover:bg-sage-100 transition-colors flex-1"
              >
                <Printer className="w-4 h-4" />
                View / Print Receipt
              </button>
              <button
                onClick={() => onOrderPlaced(placedOrderId)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-sage-900 text-sage-50 text-sm font-semibold hover:bg-sage-800 transition-colors flex-1"
              >
                Track Order Now
              </button>
            </div>
            {whatsappLink && (
              <button
                onClick={() => window.open(whatsappLink, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Send via WhatsApp
              </button>
            )}
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
              <ShoppingBag className="w-9 h-9 text-stone-300" />
            </div>
            <h3 className="font-bold text-stone-800">Your cart is empty</h3>
            <p className="text-sm text-stone-400">Add some delicious items to get started!</p>
          </div>
        ) : (
          <>
            {/* Items list + order details + payment */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-white rounded-xl p-3 border border-stone-200/60"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-stone-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {formatCurrency(item.price)} each
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-stone-100 rounded-full">
                        <button
                          onClick={() => decrementItem(item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="min-w-[18px] text-center text-sm font-bold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => incrementItem(item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-sage-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Order type selector */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">
                  Order Type
                </label>
                <div className={`grid gap-2 ${availableOrderTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {availableOrderTypes.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setOrderType(value)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                        orderType === value
                          ? 'border-sage-500 bg-sage-50 text-sage-900'
                          : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method selector — right after Order Type */}
              {availablePaymentMethods.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    {availablePaymentMethods.map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        onClick={() => setPaymentMethod(value)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                          paymentMethod === value
                            ? 'border-sage-500 bg-sage-50'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mt-0.5 ${paymentMethod === value ? 'text-sage-700' : 'text-stone-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${paymentMethod === value ? 'text-sage-900' : 'text-stone-700'}`}>
                            {label}
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${
                          paymentMethod === value ? 'border-sage-600 bg-sage-600' : 'border-stone-300'
                        }`}>
                          {paymentMethod === value && (
                            <div className="w-full h-full rounded-full scale-[0.5] bg-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Online payment details — shown when Online is selected */}
              {paymentMethod === 'online' && hasOnlineDetails && (
                <div className="bg-stone-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 uppercase tracking-wide">
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay to any of these accounts
                  </div>

                  {paymentConfig.easypaisa_number && (
                    <div className="bg-green-50/70 rounded-lg p-3 text-xs">
                      <p className="font-bold text-green-800 mb-1">EasyPaisa</p>
                      <p className="text-stone-700">{paymentConfig.easypaisa_name}</p>
                      <p className="text-stone-700 font-mono font-semibold">{paymentConfig.easypaisa_number}</p>
                    </div>
                  )}
                  {paymentConfig.jazzcash_number && (
                    <div className="bg-red-50/70 rounded-lg p-3 text-xs">
                      <p className="font-bold text-red-800 mb-1">JazzCash</p>
                      <p className="text-stone-700">{paymentConfig.jazzcash_name}</p>
                      <p className="text-stone-700 font-mono font-semibold">{paymentConfig.jazzcash_number}</p>
                    </div>
                  )}
                  {paymentConfig.bank_iban && (
                    <div className="bg-blue-50/70 rounded-lg p-3 text-xs">
                      <p className="font-bold text-blue-800 mb-1">Bank Transfer</p>
                      <p className="text-stone-700">{paymentConfig.bank_name}</p>
                      <p className="text-stone-700">{paymentConfig.bank_title}</p>
                      <p className="text-stone-700 font-mono font-semibold break-all">{paymentConfig.bank_iban}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction ID + screenshot upload for online payment */}
              {paymentMethod === 'online' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                      Transaction ID (TID) *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your transaction ID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                        errors.transactionId
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-stone-200 focus:border-sage-400'
                      }`}
                    />
                    {errors.transactionId && (
                      <p className="text-xs text-red-500 mt-1">{errors.transactionId}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                      Upload Receipt Screenshot
                    </label>
                    <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-dashed border-stone-300 text-sm text-stone-500 cursor-pointer hover:border-sage-400 hover:bg-sage-50/30 transition-colors">
                      <Upload className="w-4 h-4" />
                      {screenshotFile ? screenshotFile.name : 'Choose file...'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Customer details form — after payment block */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">
                  Customer Details
                </label>
                <div>
                  <input
                    type="text"
                    placeholder="Customer name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      errors.name
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-stone-200 focus:border-sage-400'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Phone number *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      errors.phone
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-stone-200 focus:border-sage-400'
                    }`}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
                {orderType === 'dine-in' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Table number *"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                        errors.tableNumber
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-stone-200 focus:border-sage-400'
                      }`}
                    />
                    {errors.tableNumber && (
                      <p className="text-xs text-red-500 mt-1">{errors.tableNumber}</p>
                    )}
                  </div>
                )}
                {orderType === 'delivery' && (
                  <div>
                    <textarea
                      placeholder="Delivery address *"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors resize-none ${
                        errors.address
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-stone-200 focus:border-sage-400'
                      }`}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bill summary — inside scrollable area, before the confirm button */}
              <div className="space-y-1.5 text-sm pt-2">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {taxBreakdown.map((t) => (
                  <div key={t.label} className="flex justify-between text-stone-600">
                    <span>Tax ({t.label})</span>
                    <span className="font-medium">{formatCurrency(t.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-stone-900 font-bold text-base pt-1.5 border-t border-stone-100">
                  <span>Total</span>
                  <span className="text-sage-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer: Confirm Order button at the very bottom */}
            <div className="border-t border-stone-200 bg-white px-5 py-4">
              {!isOpen ? (
                <div className="w-full py-3.5 rounded-xl bg-stone-200 text-stone-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  Cafe is Closed — Ordering Disabled
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-sage-900 hover:bg-sage-800 text-sage-50 font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Order
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Receipt modal — only shown when user clicks "View / Print Receipt" */}
      {showReceipt && placedOrder && (
        <ReceiptModal
          order={placedOrder}
          cafeAddress={cafeAddress}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  );
}
