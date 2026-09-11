import { useEffect, useMemo, useState } from 'react';
import { Clock3, RefreshCw, Search, UtensilsCrossed, CheckCircle2, XCircle, Printer, Receipt } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getOrderItems, getOrders, updateOrderStatus } from '@/lib/services';
import type { Order, OrderItem } from '@/types';
import { ORDER_STATUSES } from '@/types';
import { StatusBadge, Toast } from '@/components/ui';
import { PageHeader } from '@/components/admin/PageBits';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { demoOrders } from '@/data/demo';

const nextAction: Record<string, { label: string; status: string }> = {
  new: { label: 'Accept Order', status: 'accepted' },
  accepted: { label: 'Start Preparing', status: 'preparing' },
  preparing: { label: 'Mark Ready', status: 'ready' },
  ready: { label: 'Mark Served', status: 'served' },
};

function printBill(
  order: Order,
  items: OrderItem[],
  restaurantName: string,
  restaurantAddress: string,
  gstNumber: string,
  restaurantLogo?: string | null,
  restaurantPhone?: string | null
) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const displayLogo = restaurantLogo || '/dinescan-logo-horizontal.png';

  const itemRows = items.map(i => `
    <tr>
      <td style="padding:7px 4px;border-bottom:1px dashed #e2e8f0;font-weight:500;">${i.name}</td>
      <td style="padding:7px 4px;border-bottom:1px dashed #e2e8f0;text-align:center;">${i.quantity}</td>
      <td style="padding:7px 4px;border-bottom:1px dashed #e2e8f0;text-align:right;">${formatCurrency(i.price)}</td>
      <td style="padding:7px 4px;border-bottom:1px dashed #e2e8f0;text-align:right;font-weight:700;">${formatCurrency(i.price * i.quantity)}</td>
    </tr>
    ${i.addons ? `<tr><td colspan="4" style="padding:2px 4px 6px;font-size:11px;color:#64748b;border-bottom:1px dashed #e2e8f0;">↳ Add-ons: ${i.addons}</td></tr>` : ''}
    ${i.special_instructions ? `<tr><td colspan="4" style="padding:2px 4px 6px;font-size:11px;color:#f97316;border-bottom:1px dashed #e2e8f0;">📝 ${i.special_instructions}</td></tr>` : ''}
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice #${order.order_number} - ${restaurantName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .bill { background: #fff; width: 380px; border-radius: 16px; box-shadow: 0 4px 32px rgba(0,0,0,0.12); overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 24px 20px 20px; text-align: center; }
    .logo-badge { background: #ffffff; border-radius: 14px; padding: 8px 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .logo-img { max-height: 55px; max-width: 170px; object-fit: contain; display: block; }
    .restaurant { font-size: 18px; font-weight: 800; letter-spacing: -0.3px; line-height: 1.2; }
    .tagline { font-size: 11px; font-weight: 600; opacity: 0.9; margin-top: 4px; letter-spacing: 1.2px; text-transform: uppercase; }
    .restaurant-addr { font-size: 11px; opacity: 0.9; margin-top: 4px; line-height: 1.4; }
    .divider { border: none; border-top: 2px dashed #f97316; margin: 0; }
    .meta { padding: 14px 20px; background: #fff7ed; border-bottom: 1px dashed #fdba74; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .meta-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #9a3412; font-weight: 600; display: block; }
    .meta-item span { font-size: 13px; font-weight: 700; color: #1e293b; }
    .items-section { padding: 16px 20px; }
    .items-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { font-size: 11px; text-transform: uppercase; color: #94a3b8; padding: 6px 4px; border-bottom: 2px solid #f1f5f9; text-align: left; }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    .totals { padding: 0 20px 16px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding: 4px 0; }
    .total-row.grand { font-size: 17px; font-weight: 900; color: #1e293b; border-top: 2px solid #f1f5f9; margin-top: 8px; padding-top: 10px; }
    .grand-amount { color: #f97316; }
    .footer { background: #f8fafc; padding: 16px 20px; text-align: center; border-top: 2px dashed #e2e8f0; }
    .thanks { font-size: 14px; font-weight: 800; color: #1e293b; }
    .visit { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .gst { font-size: 10px; color: #64748b; margin-top: 6px; font-weight: 600; }
    @media print {
      body { background: white; padding: 0; }
      .bill { box-shadow: none; border: none; border-radius: 0; width: 100%; max-width: 380px; margin: 0 auto; }
    }
  </style>
</head>
<body>
  <div class="bill">
    <div class="header">
      <div class="logo-badge">
        <img src="${displayLogo}" alt="${restaurantName} Logo" class="logo-img" onerror="this.parentElement.style.display='none'"/>
      </div>
      <div class="restaurant">${restaurantName}</div>
      <div class="tagline">Tax Invoice / Bill</div>
      ${restaurantAddress ? `<div class="restaurant-addr">📍 ${restaurantAddress}</div>` : ''}
      ${restaurantPhone ? `<div class="restaurant-addr">📞 ${restaurantPhone}</div>` : ''}
    </div>
    <hr class="divider"/>
    <div class="meta">
      <div class="meta-grid">
        <div class="meta-item"><label>Order No.</label><span>#${order.order_number}</span></div>
        <div class="meta-item"><label>Table</label><span>${order.table_number ? `Table ${order.table_number}` : 'Takeaway'}</span></div>
        <div class="meta-item"><label>Customer</label><span>${order.customer_name || 'Guest'}</span></div>
        <div class="meta-item"><label>Date &amp; Time</label><span style="font-size:12px;">${dateStr}, ${timeStr}</span></div>
      </div>
    </div>
    <div class="items-section">
      <div class="items-title">Ordered Items</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amt</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>
    <div class="totals">
      <div class="total-row"><span>Items Total</span><span>${formatCurrency(Number(order.items_total))}</span></div>
      ${Number(order.tax_amount) > 0 ? `<div class="total-row"><span>GST / Tax</span><span>${formatCurrency(Number(order.tax_amount))}</span></div>` : ''}
      ${Number(order.service_charge) > 0 ? `<div class="total-row"><span>Service Charge</span><span>${formatCurrency(Number(order.service_charge))}</span></div>` : ''}
      ${Number(order.discount_amount) > 0 ? `<div class="total-row" style="color:#16a34a; font-weight:600;"><span>Discount</span><span>- ${formatCurrency(Number(order.discount_amount))}</span></div>` : ''}
      <div class="total-row grand"><span>Grand Total</span><span class="grand-amount">${formatCurrency(Number(order.grand_total))}</span></div>
    </div>
    <div class="footer">
      <div class="thanks">Thank you for dining with us! 🙏</div>
      <div class="visit">We hope to see you again soon.</div>
      ${gstNumber ? `<div class="gst">GSTIN: ${gstNumber}</div>` : ''}
      <div class="gst" style="margin-top:6px; color:#94a3b8; font-weight:normal;">Powered by DineScan</div>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=480,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export default function OrdersPage() {
  const { restaurant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    if (!restaurant) return;
    try {
      const rows = await getOrders(restaurant.id);
      setOrders(rows.length ? rows : demoOrders.map(x => ({ ...x, restaurant_id: restaurant.id })));
    } catch {
      setOrders(demoOrders.map(x => ({ ...x, restaurant_id: restaurant.id })));
    }
  };

  useEffect(() => { void load(); }, [restaurant?.id]);

  const filtered = useMemo(() => orders.filter(o =>
    (tab === 'all' || o.status === tab) &&
    (!search || String(o.order_number).toLowerCase().includes(search.toLowerCase()) ||
      String(o.table_number).includes(search) ||
      String(o.customer_name || '').toLowerCase().includes(search.toLowerCase()))
  ), [orders, tab, search]);

  const open = async (o: Order) => {
    setSelected(o);
    if (o.id.startsWith('demo-')) {
      setOrderItems([
        { id: 'd1', order_id: o.id, menu_item_id: null, name: 'Paneer Tikka', quantity: 2, price: 280, addons: null, special_instructions: o.special_instructions, created_at: o.created_at },
        { id: 'd2', order_id: o.id, menu_item_id: null, name: 'Butter Naan', quantity: 3, price: 70, addons: null, special_instructions: null, created_at: o.created_at },
      ]);
    } else {
      try { setOrderItems(await getOrderItems(o.id)); } catch { setOrderItems([]); }
    }
  };

  const setStatus = async (o: Order, status: string) => {
    setOrders(p => p.map(x => x.id === o.id ? { ...x, status } : x));
    if (selected?.id === o.id) setSelected({ ...o, status });
    try {
      await updateOrderStatus(o.id, status);
      setToast(`Order #${o.order_number} moved to ${status}`);
    } catch { setToast('Could not update order status'); }
  };

  const handlePrintBill = () => {
    if (!selected) return;
    printBill(
      selected,
      orderItems,
      restaurant?.name || 'Restaurant',
      [restaurant?.address, restaurant?.city, restaurant?.pincode].filter(Boolean).join(', '),
      restaurant?.gst_number || '',
      restaurant?.logo_url || null,
      restaurant?.phone || ''
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Manage dine-in orders in real time." actions={
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCw size={16}/> Refresh
        </button>
      }/>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-hide flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {['all', ...ORDER_STATUSES].map(s => (
              <button key={s} onClick={() => setTab(s)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold capitalize ${tab === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {s === 'all' ? 'All' : s} {s !== 'all' && <span className="ml-1 text-[10px] text-slate-400">{orders.filter(o => o.status === s).length}</span>}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order, table or customer..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none lg:w-72"/>
          </div>
        </div>
      </div>

      {/* Orders list + Detail panel */}
      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">

        {/* Orders List */}
        <div className="space-y-3">
          {filtered.map(o => (
            <button key={o.id} onClick={() => void open(o)}
              className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-orange-200 ${selected?.id === o.id ? 'border-orange-300 ring-2 ring-orange-50' : 'border-slate-200'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 font-black text-brand-600">T{o.table_number}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">#{o.order_number}</p>
                      <StatusBadge status={o.status}/>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{o.customer_name || 'Guest'} • Table {o.table_number} • {formatRelativeTime(o.created_at)}</p>
                    {o.special_instructions && <p className="mt-1 text-xs text-amber-700">Note: {o.special_instructions}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <p className="font-bold text-slate-900">{formatCurrency(Number(o.grand_total))}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock3 size={12}/>{o.estimated_prep_time} min</p>
                  </div>
                  {nextAction[o.status] && (
                    <span onClick={e => { e.stopPropagation(); void setStatus(o, nextAction[o.status].status); }}
                      className="rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white hover:bg-brand-600">
                      {nextAction[o.status].label}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {!filtered.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400">No orders found.</div>
          )}
        </div>

        {/* Order Detail Panel */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-0">
          {selected ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Order Details</p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">#{selected.order_number}</h3>
                </div>
                <StatusBadge status={selected.status}/>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 text-sm">
                <div><p className="text-xs text-slate-400">Table</p><p className="font-semibold">{selected.table_number}</p></div>
                <div><p className="text-xs text-slate-400">Customer</p><p className="font-semibold">{selected.customer_name || 'Guest'}</p></div>
                {selected.customer_phone && <div><p className="text-xs text-slate-400">Phone</p><p className="font-semibold">{selected.customer_phone}</p></div>}
              </div>

              {/* Items */}
              <div className="p-5">
                <p className="text-sm font-bold text-slate-900">Items</p>
                <div className="mt-3 space-y-2">
                  {orderItems.map(i => (
                    <div key={i.id} className="flex justify-between rounded-xl border border-slate-100 p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{i.quantity} × {i.name}</p>
                        {i.addons && <p className="text-xs text-slate-400">Add-ons: {i.addons}</p>}
                        {i.special_instructions && <p className="text-xs text-amber-600">📝 {i.special_instructions}</p>}
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(Number(i.price) * i.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="mx-5 mb-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5"><Receipt size={13}/> Bill Summary</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Items Total</span><span>{formatCurrency(Number(selected.items_total))}</span></div>
                  {Number(selected.tax_amount) > 0 && <div className="flex justify-between text-slate-600"><span>GST / Tax</span><span>{formatCurrency(Number(selected.tax_amount))}</span></div>}
                  {Number(selected.service_charge) > 0 && <div className="flex justify-between text-slate-600"><span>Service Charge</span><span>{formatCurrency(Number(selected.service_charge))}</span></div>}
                  {Number(selected.discount_amount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>− {formatCurrency(Number(selected.discount_amount))}</span></div>}
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-900">
                    <span>Grand Total</span>
                    <span className="text-brand-500">{formatCurrency(Number(selected.grand_total))}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid gap-2 p-5">
                {/* 🖨️ Print Bill Button */}
                <button
                  onClick={handlePrintBill}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-900"
                >
                  <Printer size={17}/> Print Bill / Invoice
                </button>

                {nextAction[selected.status] && (
                  <button onClick={() => void setStatus(selected, nextAction[selected.status].status)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600">
                    <CheckCircle2 size={17}/>{nextAction[selected.status].label}
                  </button>
                )}

                {!['served', 'cancelled'].includes(selected.status) && (
                  <button onClick={() => void setStatus(selected, 'cancelled')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                    <XCircle size={16}/> Cancel Order
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <UtensilsCrossed size={34} className="mx-auto"/>
              <p className="mt-3 text-sm">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} type={toast.startsWith('Could') ? 'error' : 'success'} onClose={() => setToast(null)}/>}
    </div>
  );
}
