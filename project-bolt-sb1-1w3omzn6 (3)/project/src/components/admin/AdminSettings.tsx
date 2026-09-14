import { useState, useEffect } from 'react';
import { Phone, Save, CheckCircle2, Loader2, Info, Clock, Store, MapPin, Instagram, Facebook, Bike, CreditCard, Wallet, Banknote } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import type { PaymentConfig } from '@/lib/supabase';

export function AdminSettings() {
  const {
    whatsappNumber,
    cafeStatus,
    openingTime,
    closingTime,
    cafeAddress,
    instagramUrl,
    tiktokUrl,
    facebookUrl,
    deliveryEnabled,
    paymentConfig,
    saveWhatsatsappNumber,
    saveCafeStatus,
    saveTimings,
    saveCafeInfo,
    saveDeliveryEnabled,
    savePaymentConfig,
    loading,
  } = useSettings();
  const [waInput, setWaInput] = useState('');
  const [openInput, setOpenInput] = useState('');
  const [closeInput, setCloseInput] = useState('');
  const [addrInput, setAddrInput] = useState('');
  const [igInput, setIgInput] = useState('');
  const [tiktokInput, setTiktokInput] = useState('');
  const [fbInput, setFbInput] = useState('');
  const [payInput, setPayInput] = useState<PaymentConfig>(paymentConfig);
  const [savingWa, setSavingWa] = useState(false);
  const [savingTimings, setSavingTimings] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [waSaved, setWaSaved] = useState(false);
  const [timingsSaved, setTimingsSaved] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);
  const [deliverySaved, setDeliverySaved] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

  useEffect(() => { setWaInput(whatsappNumber); }, [whatsappNumber]);
  useEffect(() => { setOpenInput(openingTime); }, [openingTime]);
  useEffect(() => { setCloseInput(closingTime); }, [closingTime]);
  useEffect(() => { setAddrInput(cafeAddress); }, [cafeAddress]);
  useEffect(() => { setIgInput(instagramUrl); }, [instagramUrl]);
  useEffect(() => { setTiktokInput(tiktokUrl); }, [tiktokUrl]);
  useEffect(() => { setFbInput(facebookUrl); }, [facebookUrl]);
  useEffect(() => { setPayInput(paymentConfig); }, [paymentConfig]);

  const handleSaveWa = async () => {
    setSavingWa(true);
    try {
      await saveWhatsatsappNumber(waInput.trim());
      setWaSaved(true);
      setTimeout(() => setWaSaved(false), 3000);
    } catch {
      alert('Failed to save WhatsApp number');
    } finally {
      setSavingWa(false);
    }
  };

  const handleSaveTimings = async () => {
    setSavingTimings(true);
    try {
      await saveTimings(openInput.trim(), closeInput.trim());
      setTimingsSaved(true);
      setTimeout(() => setTimingsSaved(false), 3000);
    } catch {
      alert('Failed to save timings');
    } finally {
      setSavingTimings(false);
    }
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      await saveCafeInfo(addrInput.trim(), igInput.trim(), tiktokInput.trim(), fbInput.trim());
      setInfoSaved(true);
      setTimeout(() => setInfoSaved(false), 3000);
    } catch {
      alert('Failed to save cafe settings');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleToggleDelivery = async () => {
    setSavingDelivery(true);
    try {
      await saveDeliveryEnabled(!deliveryEnabled);
      setDeliverySaved(true);
      setTimeout(() => setDeliverySaved(false), 3000);
    } catch {
      alert('Failed to update delivery setting');
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleSavePayment = async () => {
    setSavingPayment(true);
    try {
      await savePaymentConfig(payInput);
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
    } catch {
      alert('Failed to save payment configuration');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = cafeStatus === 'open' ? 'closed' : 'open';
    try {
      await saveCafeStatus(newStatus);
    } catch {
      alert('Failed to update cafe status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sage-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* Cafe Info: Address & Social */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div>
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sage-700" />
            Cafe Location & Social Links
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Set your cafe's physical address and social media links. These appear on receipts and across the website.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
            Cafe Address
          </label>
          <input
            type="text"
            value={addrInput}
            onChange={(e) => setAddrInput(e.target.value)}
            placeholder="I-8 Markaz, Islamabad"
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
          />
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              <Instagram className="w-3 h-3 inline mr-1" /> Instagram URL
            </label>
            <input
              type="text"
              value={igInput}
              onChange={(e) => setIgInput(e.target.value)}
              placeholder="https://instagram.com/dafillicafe"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              TikTok URL
            </label>
            <input
              type="text"
              value={tiktokInput}
              onChange={(e) => setTiktokInput(e.target.value)}
              placeholder="https://tiktok.com/@dafillicafe"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              <Facebook className="w-3 h-3 inline mr-1" /> Facebook URL
            </label>
            <input
              type="text"
              value={fbInput}
              onChange={(e) => setFbInput(e.target.value)}
              placeholder="https://facebook.com/dafillicafe"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
            />
          </div>
        </div>

        <button
          onClick={handleSaveInfo}
          disabled={savingInfo}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sage-900 text-sage-50 font-semibold text-sm hover:bg-sage-800 transition-colors disabled:opacity-60"
        >
          {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {savingInfo ? 'Saving...' : 'Save Cafe Info'}
        </button>

        {infoSaved && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Cafe info saved successfully!
          </div>
        )}
      </div>

      {/* Cafe Status & Timings */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div>
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-sage-700" />
            Cafe Status & Timings
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Toggle your cafe status and set operating hours. When closed, ordering is disabled on the homepage.
          </p>
        </div>

        <div className="flex items-center justify-between bg-stone-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${cafeStatus === 'open' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <div>
              <p className="font-semibold text-stone-900">Cafe is {cafeStatus === 'open' ? 'Open' : 'Closed'}</p>
              <p className="text-xs text-stone-500">{cafeStatus === 'open' ? 'Customers can place orders' : 'Ordering is disabled'}</p>
            </div>
          </div>
          <button
            onClick={handleToggleStatus}
            className={`relative w-14 h-7 rounded-full transition-colors ${cafeStatus === 'open' ? 'bg-green-500' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${cafeStatus === 'open' ? 'translate-x-7' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              <Clock className="w-3 h-3 inline mr-1" /> Opening Time
            </label>
            <input type="text" value={openInput} onChange={(e) => setOpenInput(e.target.value)} placeholder="8:00 AM" className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              <Clock className="w-3 h-3 inline mr-1" /> Closing Time
            </label>
            <input type="text" value={closeInput} onChange={(e) => setCloseInput(e.target.value)} placeholder="11:00 PM" className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400" />
          </div>
        </div>

        <button onClick={handleSaveTimings} disabled={savingTimings} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sage-900 text-sage-50 font-semibold text-sm hover:bg-sage-800 transition-colors disabled:opacity-60">
          {savingTimings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {savingTimings ? 'Saving...' : 'Save Timings'}
        </button>

        {timingsSaved && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Timings saved successfully!
          </div>
        )}
      </div>

      {/* Delivery Toggle */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div>
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Bike className="w-5 h-5 text-sage-700" />
            Delivery Option
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Enable or disable delivery as an order type. When disabled, customers can only choose Dine-In or Takeaway.
          </p>
        </div>

        <div className="flex items-center justify-between bg-stone-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${deliveryEnabled ? 'bg-green-500' : 'bg-stone-400'}`} />
            <div>
              <p className="font-semibold text-stone-900">Delivery is {deliveryEnabled ? 'Available' : 'Disabled'}</p>
              <p className="text-xs text-stone-500">{deliveryEnabled ? 'Customers can select delivery at checkout' : 'Delivery option is hidden from customers'}</p>
            </div>
          </div>
          <button
            onClick={handleToggleDelivery}
            disabled={savingDelivery}
            className={`relative w-14 h-7 rounded-full transition-colors disabled:opacity-50 ${deliveryEnabled ? 'bg-green-500' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${deliveryEnabled ? 'translate-x-7' : ''}`} />
          </button>
        </div>

        {deliverySaved && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Delivery setting updated!
          </div>
        )}
      </div>

      {/* Payment Configuration */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div>
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sage-700" />
            Payment Configuration
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Configure which payment methods customers can use at checkout. Online payment details are shown to customers who choose to pay online.
          </p>
        </div>

        {/* Cash toggle */}
        <div className="flex items-center justify-between bg-stone-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-sage-700" />
            <div>
              <p className="font-semibold text-stone-900">Cash on Delivery / Pay at Counter</p>
              <p className="text-xs text-stone-500">Customers pay with cash when they receive their order</p>
            </div>
          </div>
          <button
            onClick={() => setPayInput((p) => ({ ...p, cash_enabled: !p.cash_enabled }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${payInput.cash_enabled ? 'bg-green-500' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${payInput.cash_enabled ? 'translate-x-7' : ''}`} />
          </button>
        </div>

        {/* Online toggle */}
        <div className="flex items-center justify-between bg-stone-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-sage-700" />
            <div>
              <p className="font-semibold text-stone-900">Online Mobile Wallet / Bank Transfer</p>
              <p className="text-xs text-stone-500">Customers pay via EasyPaisa, JazzCash, or bank transfer</p>
            </div>
          </div>
          <button
            onClick={() => setPayInput((p) => ({ ...p, online_enabled: !p.online_enabled }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${payInput.online_enabled ? 'bg-green-500' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${payInput.online_enabled ? 'translate-x-7' : ''}`} />
          </button>
        </div>

        {/* Online payment account details */}
        {payInput.online_enabled && (
          <div className="space-y-4 pt-2 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Account Details (shown to customers)</p>

            {/* EasyPaisa */}
            <div className="bg-green-50/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-green-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-600" /> EasyPaisa
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={payInput.easypaisa_name}
                  onChange={(e) => setPayInput((p) => ({ ...p, easypaisa_name: e.target.value }))}
                  placeholder="Account Name"
                  className="px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                />
                <input
                  type="text"
                  value={payInput.easypaisa_number}
                  onChange={(e) => setPayInput((p) => ({ ...p, easypaisa_number: e.target.value }))}
                  placeholder="Account Number"
                  className="px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                />
              </div>
            </div>

            {/* JazzCash */}
            <div className="bg-red-50/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600" /> JazzCash
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={payInput.jazzcash_name}
                  onChange={(e) => setPayInput((p) => ({ ...p, jazzcash_name: e.target.value }))}
                  placeholder="Account Name"
                  className="px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                />
                <input
                  type="text"
                  value={payInput.jazzcash_number}
                  onChange={(e) => setPayInput((p) => ({ ...p, jazzcash_number: e.target.value }))}
                  placeholder="Account Number"
                  className="px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                />
              </div>
            </div>

            {/* Bank Transfer */}
            <div className="bg-blue-50/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-blue-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Bank Transfer
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={payInput.bank_name}
                  onChange={(e) => setPayInput((p) => ({ ...p, bank_name: e.target.value }))}
                  placeholder="Bank Name"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                />
                <input
                  type="text"
                  value={payInput.bank_title}
                  onChange={(e) => setPayInput((p) => ({ ...p, bank_title: e.target.value }))}
                  placeholder="Account Title"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                />
                <input
                  type="text"
                  value={payInput.bank_iban}
                  onChange={(e) => setPayInput((p) => ({ ...p, bank_iban: e.target.value }))}
                  placeholder="IBAN"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:border-sage-400"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSavePayment}
          disabled={savingPayment}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sage-900 text-sage-50 font-semibold text-sm hover:bg-sage-800 transition-colors disabled:opacity-60"
        >
          {savingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {savingPayment ? 'Saving...' : 'Save Payment Config'}
        </button>

        {paymentSaved && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Payment configuration saved successfully!
          </div>
        )}
      </div>

      {/* WhatsApp Number */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div>
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-600" />
            WhatsApp Order Number
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Enter the phone number where customer order summaries should be sent. Include the country code without any + or spaces (e.g. 923001234567).
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">WhatsApp Number</label>
          <input type="text" value={waInput} onChange={(e) => setWaInput(e.target.value)} placeholder="e.g. 923001234567" className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
          <p className="text-xs text-stone-400 mt-1.5">
            {waInput ? `Orders will be sent to wa.me/${waInput}` : 'Leave empty to disable WhatsApp ordering temporarily.'}
          </p>
        </div>

        <button onClick={handleSaveWa} disabled={savingWa} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60">
          {savingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {savingWa ? 'Saving...' : 'Save Number'}
        </button>

        {waSaved && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            WhatsApp number saved successfully!
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">How WhatsApp ordering works</p>
          <p className="text-blue-700 leading-relaxed">
            When a customer places an order, the checkout saves it to the database and offers a "Send via WhatsApp" button with a pre-filled message containing the full order summary and a live tracking link.
          </p>
        </div>
      </div>
    </div>
  );
}
