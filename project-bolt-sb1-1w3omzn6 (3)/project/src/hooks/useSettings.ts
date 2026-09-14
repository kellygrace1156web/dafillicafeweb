import { useState, useEffect, useCallback } from 'react';
import { supabase, type PaymentConfig } from '@/lib/supabase';
import { siteConfig } from '@/config/siteConfig';

export type CafeStatus = 'open' | 'closed';

const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  cash_enabled: true,
  online_enabled: false,
  easypaisa_name: '',
  easypaisa_number: '',
  jazzcash_name: '',
  jazzcash_number: '',
  bank_name: '',
  bank_title: '',
  bank_iban: '',
};

export function useSettings() {
  const [whatsappNumber, setWhatsappNumber] = useState(siteConfig.whatsappNumber);
  const [cafeStatus, setCafeStatus] = useState<CafeStatus>('open');
  const [openingTime, setOpeningTime] = useState('8:00 AM');
  const [closingTime, setClosingTime] = useState('11:00 PM');
  const [cafeAddress, setCafeAddress] = useState('I-8 Markaz, Islamabad');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (!error && data) {
      for (const row of data) {
        if (row.key === 'whatsapp_number') setWhatsappNumber(row.value || siteConfig.whatsappNumber);
        if (row.key === 'cafe_status') setCafeStatus(row.value as CafeStatus);
        if (row.key === 'opening_time') setOpeningTime(row.value);
        if (row.key === 'closing_time') setClosingTime(row.value);
        if (row.key === 'cafe_address') setCafeAddress(row.value || 'I-8 Markaz, Islamabad');
        if (row.key === 'instagram_url') setInstagramUrl(row.value);
        if (row.key === 'tiktok_url') setTiktokUrl(row.value);
        if (row.key === 'facebook_url') setFacebookUrl(row.value);
        if (row.key === 'delivery_enabled') setDeliveryEnabled(row.value === 'true');
        if (row.key === 'payment_config') {
          try {
            const parsed = JSON.parse(row.value);
            setPaymentConfig({ ...DEFAULT_PAYMENT_CONFIG, ...parsed });
          } catch { /* keep defaults */ }
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
  };

  const saveWhatsatsappNumber = async (num: string) => {
    await saveSetting('whatsapp_number', num);
    setWhatsappNumber(num);
  };

  const saveCafeStatus = async (status: CafeStatus) => {
    await saveSetting('cafe_status', status);
    setCafeStatus(status);
  };

  const saveTimings = async (opening: string, closing: string) => {
    await Promise.all([saveSetting('opening_time', opening), saveSetting('closing_time', closing)]);
    setOpeningTime(opening);
    setClosingTime(closing);
  };

  const saveCafeInfo = async (address: string, ig: string, tiktok: string, fb: string) => {
    await Promise.all([
      saveSetting('cafe_address', address),
      saveSetting('instagram_url', ig),
      saveSetting('tiktok_url', tiktok),
      saveSetting('facebook_url', fb),
    ]);
    setCafeAddress(address);
    setInstagramUrl(ig);
    setTiktokUrl(tiktok);
    setFacebookUrl(fb);
  };

  const saveDeliveryEnabled = async (enabled: boolean) => {
    await saveSetting('delivery_enabled', enabled ? 'true' : 'false');
    setDeliveryEnabled(enabled);
  };

  const savePaymentConfig = async (config: PaymentConfig) => {
    await saveSetting('payment_config', JSON.stringify(config));
    setPaymentConfig(config);
  };

  const isOpen = cafeStatus === 'open';

  return {
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
    isOpen,
    loading,
    saveWhatsatsappNumber,
    saveCafeStatus,
    saveTimings,
    saveCafeInfo,
    saveDeliveryEnabled,
    savePaymentConfig,
    reloadSettings: loadSettings,
  };
}
