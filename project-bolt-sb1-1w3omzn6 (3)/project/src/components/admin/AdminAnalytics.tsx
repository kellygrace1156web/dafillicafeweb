import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Award, Loader2, Receipt } from 'lucide-react';
import { supabase, type Order } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';

type AdminAnalyticsProps = {
  refreshTrigger: number;
};

type TimeFilter = 'today' | '7days' | '30days' | 'all';

const FILTER_LABELS: Record<TimeFilter, string> = {
  today: 'Today',
  '7days': 'Last 7 Days',
  '30days': 'Last 30 Days',
  all: 'All Time',
};

function getStartDate(filter: TimeFilter): Date | null {
  const now = new Date();
  if (filter === 'today') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d;
  }
  if (filter === '7days') {
    const d = new Date(now);
    d.setDate(now.getDate() - 7);
    return d;
  }
  if (filter === '30days') {
    const d = new Date(now);
    d.setDate(now.getDate() - 30);
    return d;
  }
  return null;
}

export function AdminAnalytics({ refreshTrigger }: AdminAnalyticsProps) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (!cancelled && !error) setAllOrders(data as Order[]);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const filteredOrders = useMemo(() => {
    const startDate = getStartDate(timeFilter);
    if (!startDate) return allOrders;
    const startMs = startDate.getTime();
    return allOrders.filter((o) => new Date(o.created_at).getTime() >= startMs);
  }, [allOrders, timeFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = filteredOrders.length;
    const totalSales = filteredOrders.reduce((s, o) => s + Number(o.subtotal), 0);

    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of filteredOrders) {
      for (const item of o.items) {
        const key = item.id || item.name;
        if (!itemMap[key]) itemMap[key] = { name: item.name, qty: 0, revenue: 0 };
        itemMap[key].qty += item.quantity;
        itemMap[key].revenue += item.price * item.quantity;
      }
    }
    const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Daily data for chart - last 7 days within filter range
    const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { date: key, revenue: 0, orders: 0 };
    }
    for (const o of filteredOrders) {
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].revenue += Number(o.total);
        dailyMap[key].orders += 1;
      }
    }
    const dailyData = Object.values(dailyMap);

    return { totalRevenue, totalOrders, totalSales, topItems, dailyData };
  }, [filteredOrders]);

  const maxDailyRevenue = Math.max(...stats.dailyData.map((d) => d.revenue), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sage-800 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
    { label: 'Total Sales (pre-tax)', value: formatCurrency(stats.totalSales), icon: TrendingUp, color: 'bg-sage-100 text-sage-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Time filter tabs */}
      <div className="flex items-center gap-1.5 bg-white rounded-xl border border-stone-200 p-1.5 w-fit overflow-x-auto">
        {(Object.keys(FILTER_LABELS) as TimeFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setTimeFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              timeFilter === f ? 'bg-sage-900 text-sage-50' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-stone-500">{s.label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-stone-900">{s.value}</p>
              <p className="text-xs text-stone-400 mt-1">{FILTER_LABELS[timeFilter]}</p>
            </div>
          );
        })}
      </div>

      {/* Daily sales chart */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h3 className="font-bold text-stone-900 mb-4">Daily Sales (Last 7 Days)</h3>
        <div className="flex items-end justify-between gap-2 h-44">
          {stats.dailyData.map((d) => {
            const heightPct = (d.revenue / maxDailyRevenue) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-sage-700 to-sage-500 rounded-t-lg transition-all hover:from-sage-800 hover:to-sage-600 relative group"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                      {formatCurrency(d.revenue)}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 font-medium">
                  {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top selling items */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-sage-600" />
          Top Selling Items ({FILTER_LABELS[timeFilter]})
        </h3>
        {stats.topItems.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-stone-400">
            <Receipt className="w-8 h-8 mb-2 text-stone-300" />
            <p className="text-sm">No sales data for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.topItems.map((item, i) => {
              const maxQty = stats.topItems[0].qty || 1;
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-stone-400">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-stone-800">{item.name}</span>
                      <span className="text-xs text-stone-500">
                        {item.qty} sold · {formatCurrency(item.revenue)}
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sage-600 to-sage-400 rounded-full transition-all"
                        style={{ width: `${(item.qty / maxQty) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
