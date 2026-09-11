import { useEffect, useMemo, useState } from 'react';
import {
  Plus, QrCode, Download, Printer, Pencil, Trash2,
  Users, MapPin, Table2, CheckCircle2, ExternalLink,
  Copy, Check, Globe, Wifi, Laptop, Sparkles
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '@/lib/auth-context';
import { createTable, deleteTable, getTables, updateTable } from '@/lib/services';
import type { RestaurantTable } from '@/types';
import { ConfirmModal, Modal, StatCard, Toast } from '@/components/ui';
import { PageHeader, inputClass, labelClass } from '@/components/admin/PageBits';
import { demoTables } from '@/data/demo';
import { slugify } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  available: 'bg-green-50 text-green-700 border-green-200',
  occupied: 'bg-red-50 text-red-700 border-red-200',
  reserved: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function TablesPage() {
  const { restaurant } = useAuth();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RestaurantTable | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ table_number: '', seats: '4', area: 'Ground Floor', status: 'available' });

  // Resolve restaurant slug
  const restaurantSlug = useMemo(() => {
    return restaurant?.slug || (restaurant?.name ? slugify(restaurant.name) : 'sk-restaurant');
  }, [restaurant]);

  useEffect(() => {
    if (!restaurant) return;
    (async () => {
      try {
        const rows = await getTables(restaurant.id);
        setTables(rows);
      } catch {
        setTables(demoTables.map(x => ({ ...x, restaurant_id: restaurant.id })));
      }
    })();
  }, [restaurant?.id]);

  const stats = useMemo(() => ({
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  }), [tables]);

  const openNew = () => {
    setEditing(null);
    setForm({
      table_number: String(tables.length + 1).padStart(2, '0'),
      seats: '4',
      area: 'Ground Floor',
      status: 'available',
    });
    setFormOpen(true);
  };

  const openEdit = (t: RestaurantTable) => {
    setEditing(t);
    setForm({ table_number: t.table_number, seats: String(t.seats), area: t.area, status: t.status });
    setFormOpen(true);
  };

  const save = async () => {
    if (!restaurant || !form.table_number.trim()) return;
    const payload = {
      restaurant_id: restaurant.id,
      table_number: form.table_number.trim(),
      seats: Number(form.seats) || 4,
      area: form.area,
      status: form.status,
    };
    try {
      if (editing) {
        const saved = await updateTable(editing.id, payload);
        if (saved) setTables(p => p.map(x => x.id === editing.id ? saved : x));
      } else {
        const saved = await createTable(payload);
        if (saved) setTables(p => [...p, saved]);
      }
      setFormOpen(false);
      setToast(editing ? 'Table updated' : 'Table created');
    } catch {
      setToast('Could not save table');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTable(deleteTarget.id);
      setTables(p => p.filter(x => x.id !== deleteTarget.id));
      setToast('Table deleted');
    } catch {
      setToast('Could not delete table');
    }
  };

  // Helper to determine if we are currently on a live domain (e.g., Vercel or custom domain)
  const isLiveSite = typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  // Live Vercel production deployment URL
  const PRODUCTION_VERCEL_URL = 'https://dinescan-one.vercel.app';

  // Configured production/app URL from environment or default Vercel domain
  const envAppUrl = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_APP_URL || '').trim() || PRODUCTION_VERCEL_URL;

  // Local Wi-Fi IP fallback for local network mobile testing
  const DEFAULT_WIFI_IP = '10.2.7.19:5173';

  // QR Host resolution: defaults to https://dinescan-one.vercel.app
  const [qrHost, setQrHost] = useState(() => {
    if (typeof window === 'undefined') return PRODUCTION_VERCEL_URL;

    // If running on Vercel or any live domain, ALWAYS default to current origin
    if (isLiveSite) {
      const saved = localStorage.getItem('dinescan_qr_host');
      // If user had previously stored a stale local IP or localhost, purge it
      if (saved && !saved.includes('10.2.7.19') && !saved.includes('localhost') && !saved.includes('127.0.0.1')) {
        return saved.trim();
      }
      localStorage.setItem('dinescan_qr_host', window.location.origin);
      return window.location.origin;
    }

    // If running on localhost: purge any old 10.2.7.19 IP and use Vercel URL
    const saved = localStorage.getItem('dinescan_qr_host');
    if (saved && saved.trim() && !saved.includes('10.2.7.19')) {
      return saved.trim();
    }

    // Default to the Vercel production URL so all scanned QR codes open on Vercel
    localStorage.setItem('dinescan_qr_host', envAppUrl);
    return envAppUrl;
  });
  const [editingHost, setEditingHost] = useState(false);
  const [tempHost, setTempHost] = useState(qrHost);

  // Return full URL for table QR & Menu:
  const qrUrl = (table: RestaurantTable, forceDesktop = false) => {
    if (forceDesktop && typeof window !== 'undefined') {
      return `${window.location.origin}/menu/${restaurantSlug}?table=${encodeURIComponent(table.table_number)}`;
    }
    let host = qrHost.trim();
    if (!host || host.includes('10.2.7.19')) {
      host = envAppUrl || PRODUCTION_VERCEL_URL;
    }
    // Format protocol correctly (https for vercel/production domains, preserve http for local IPs)
    let full = host;
    if (!full.startsWith('http://') && !full.startsWith('https://')) {
      full = full.includes('localhost') || full.match(/^\d+\.\d+\.\d+\.\d+/) ? `http://${full}` : `https://${full}`;
    }
    // Remove any trailing slash
    full = full.replace(/\/+$/, '');
    return `${full}/menu/${restaurantSlug}?table=${encodeURIComponent(table.table_number)}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setToast('Menu link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const downloadQr = () => {
    if (!qrTable) return;
    const canvas = document.getElementById('dinescan-qr') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `DineScan-Table-${qrTable.table_number}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const printQr = () => {
    if (!qrTable) return;
    const canvas = document.getElementById('dinescan-qr') as HTMLCanvasElement | null;
    if (!canvas) return;
    const targetUrl = qrUrl(qrTable);
    const w = window.open('', '_blank', 'width=600,height=800');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>DineScan Table ${qrTable.table_number}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; }
            .card { text-align: center; border: 1px solid #e2e8f0; background: white; border-radius: 28px; padding: 36px; width: 340px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
            .brand { color: #ea580c; font-weight: 900; font-size: 28px; letter-spacing: -0.5px; }
            .subtitle { font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #ea580c; margin-top: 4px; margin-bottom: 20px; }
            .table-badge { font-size: 24px; font-weight: 900; color: #0f172a; margin-top: 16px; }
            .rest-name { font-size: 14px; font-weight: 600; color: #475569; margin-top: 4px; }
            .hint { color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 12px; }
            .url-box { margin-top: 16px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 11px; color: #ea580c; font-weight: 600; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">🍽️ DineScan</div>
            <div class="subtitle">SCAN TO OPEN MENU & ORDER</div>
            <img width="240" height="240" src="${canvas.toDataURL('image/png')}" />
            <div class="table-badge">Table ${qrTable.table_number}</div>
            <div class="rest-name">${restaurant?.name || 'Restaurant'}</div>
            <p class="hint">Point your phone camera at the QR code to browse our full digital menu and order directly from your table.</p>
            <div class="url-box">Direct Link: ${targetUrl}</div>
          </div>
          <script>window.onload = () => window.print()</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  // Base public URL for customer menu links (defaults to https://dinescan-one.vercel.app)
  const publicBaseUrl = isLiveSite
    ? window.location.origin
    : (qrHost || envAppUrl || PRODUCTION_VERCEL_URL);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tables & QR Codes"
        description="Generate contactless QR codes and direct menu links for every dining table."
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`${publicBaseUrl}/menu/${restaurantSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Globe size={16} className="text-orange-600" />
              <span>General Menu ↗</span>
            </a>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition"
            >
              <Plus size={17} /> Add Table
            </button>
          </div>
        }
      />

      {/* Global Quick Menu Link Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50 to-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-xs">
            <Globe size={20} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-800">
              Live Customer Digital Menu URL
            </p>
            <p className="text-xs text-slate-600 font-medium">
              Customers scan table QR codes to access this menu. You can also open or copy the direct link below:
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold text-orange-700 break-all">
              {`${publicBaseUrl}/menu/${restaurantSlug}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => copyToClipboard(`${publicBaseUrl}/menu/${restaurantSlug}`, 'general-menu')}
            className="flex items-center gap-1.5 rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 transition cursor-pointer"
          >
            {copiedId === 'general-menu' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedId === 'general-menu' ? 'Copied!' : 'Copy Menu Link'}</span>
          </button>
          <a
            href={`${publicBaseUrl}/menu/${restaurantSlug}?table=01`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-700 transition"
          >
            <ExternalLink size={14} />
            <span>Open Menu Preview</span>
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Tables" value={tables.length} icon={<Table2 size={20} />} accent="orange" />
        <StatCard title="Available" value={stats.available} icon={<CheckCircle2 size={20} />} accent="green" />
        <StatCard title="Occupied" value={stats.occupied} icon={<Users size={20} />} accent="purple" />
        <StatCard title="QR Codes" value={tables.length} icon={<QrCode size={20} />} accent="blue" />
      </div>

      {/* Table Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {tables.map((table) => {
          const directUrl = qrUrl(table);
          return (
            <div key={table.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Table</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">{table.table_number}</h3>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[table.status] || 'bg-slate-50'}`}>
                  {table.status}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-slate-500">
                <p className="flex items-center gap-2"><Users size={15} /> {table.seats} seats</p>
                <p className="flex items-center gap-2"><MapPin size={15} /> {table.area}</p>
              </div>

              {/* Direct Scan / Open Link preview on card */}
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Scan / Menu Link:</span>
                  <button
                    onClick={() => copyToClipboard(directUrl, table.id)}
                    className="flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    {copiedId === table.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedId === table.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-xs font-semibold text-orange-600 hover:underline font-mono"
                  title="Click to open menu for this table in new tab"
                >
                  {directUrl} ↗
                </a>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setQrTable(table)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 hover:bg-orange-100/90 border border-orange-200/80 px-3 py-2 text-xs font-bold text-orange-700 shadow-2xs hover:shadow-xs transition active:scale-[0.99] cursor-pointer"
                >
                  <QrCode size={14} className="text-orange-600" />
                  <span>View QR Code</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openEdit(table)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition active:scale-[0.98] cursor-pointer shadow-2xs"
                  >
                    <Pencil size={13.5} className="text-slate-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(table)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 transition active:scale-[0.98] cursor-pointer shadow-2xs group"
                  >
                    <Trash2 size={13.5} className="text-rose-500 group-hover:scale-110 transition-transform" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Table Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Table' : 'Add Table'}>
        <div className="space-y-4 p-6">
          <div>
            <label className={labelClass}>Table number / name</label>
            <input
              className={inputClass}
              value={form.table_number}
              onChange={e => setForm({ ...form, table_number: e.target.value })}
              placeholder="12"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Seats</label>
              <input
                type="number"
                className={inputClass}
                value={form.seats}
                onChange={e => setForm({ ...form, seats: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Area</label>
            <select
              className={inputClass}
              value={form.area}
              onChange={e => setForm({ ...form, area: e.target.value })}
            >
              <option>Ground Floor</option>
              <option>First Floor</option>
              <option>Outdoor</option>
              <option>VIP</option>
            </select>
          </div>
          <button
            onClick={() => void save()}
            className="w-full rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition"
          >
            Save Table
          </button>
        </div>
      </Modal>

      {/* QR Code & Scan To Open Modal */}
      <Modal
        isOpen={!!qrTable}
        onClose={() => setQrTable(null)}
        title={`Table ${qrTable?.table_number || ''} — QR Code & Menu Link`}
        maxWidth="max-w-lg"
      >
        {qrTable && (
          <div className="p-6 space-y-4">
            {/* Visual Printable Card Preview */}
            <div className="rounded-3xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-white p-6 text-center shadow-xs">
              <img src="/dinescan-logo-horizontal.png" className="mx-auto h-9 object-contain" alt="DineScan" />
              <p className="mt-2 text-xs font-black tracking-[.22em] text-orange-600">
                SCAN TO OPEN MENU & ORDER
              </p>

              <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                <QRCodeCanvas id="dinescan-qr" value={qrUrl(qrTable)} size={220} level="H" includeMargin />
              </div>

              <h3 className="mt-4 text-2xl font-black text-slate-900">Table {qrTable.table_number}</h3>
              <p className="text-sm font-semibold text-slate-700">{restaurant?.name || 'Restaurant'}</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                Scan the QR code with any phone camera to browse the live menu and place orders.
              </p>

              {/* Direct URL printed directly on the card so it is always visible */}
              <div className="mt-3 rounded-xl bg-orange-100/60 border border-orange-200 px-3 py-1.5 text-center">
                <span className="text-[10px] font-bold uppercase text-orange-800 tracking-wider">Direct Menu Link:</span>
                <p className="font-mono text-xs font-bold text-orange-950 break-all select-all">
                  {qrUrl(qrTable)}
                </p>
              </div>
            </div>

            {/* Direct Instant Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={qrUrl(qrTable, true)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 transition"
              >
                <ExternalLink size={15} />
                <span>Open Menu in Browser ↗</span>
              </a>

              <button
                onClick={() => copyToClipboard(qrUrl(qrTable), 'modal-qr-url')}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
              >
                {copiedId === 'modal-qr-url' ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                <span>{copiedId === 'modal-qr-url' ? 'Link Copied!' : 'Copy Menu Link'}</span>
              </button>
            </div>

            {/* Download PNG & Print PDF Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={downloadQr}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
              >
                <Download size={14} /> Download PNG
              </button>
              <button
                onClick={printQr}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
              >
                <Printer size={14} /> Print / Table Stand
              </button>
            </div>

            {/* Network Host & IP Configuration */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">QR Code Target URL / Host</span>
                  <p className="text-[11px] text-slate-500">
                    Choose whether QR codes point to your live Vercel domain or a local testing address:
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (editingHost) {
                      const clean = tempHost.trim();
                      localStorage.setItem('dinescan_qr_host', clean);
                      setQrHost(clean);
                      setEditingHost(false);
                      setToast('QR Code URL updated!');
                    } else {
                      setTempHost(qrHost);
                      setEditingHost(true);
                    }
                  }}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  {editingHost ? 'Save' : 'Custom URL'}
                </button>
              </div>

              {/* Quick Presets: Vercel / Live Domain vs Local Network IP */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Dedicated Vercel Production URL */}
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('dinescan_qr_host', PRODUCTION_VERCEL_URL);
                    setQrHost(PRODUCTION_VERCEL_URL);
                    setTempHost(PRODUCTION_VERCEL_URL);
                    setToast(`Switched QR to Vercel: ${PRODUCTION_VERCEL_URL}`);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    qrHost === PRODUCTION_VERCEL_URL || qrHost.includes('dinescan-one.vercel.app')
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Globe size={13} />
                  <span>🚀 Vercel Live (dinescan-one.vercel.app)</span>
                </button>

                {/* Current Browser Origin (if distinct) */}
                {typeof window !== 'undefined' && !window.location.host.includes('dinescan-one.vercel.app') && (
                  <button
                    type="button"
                    onClick={() => {
                      const origin = window.location.origin;
                      localStorage.setItem('dinescan_qr_host', origin);
                      setQrHost(origin);
                      setTempHost(origin);
                      setToast(`Switched to: ${origin}`);
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                      qrHost === window.location.origin
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🌐 Current Host ({window.location.host})</span>
                  </button>
                )}

                {/* Local Wi-Fi IP for phone testing on local network */}
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('dinescan_qr_host', DEFAULT_WIFI_IP);
                    setQrHost(DEFAULT_WIFI_IP);
                    setTempHost(DEFAULT_WIFI_IP);
                    setToast(`Switched QR to Local Wi-Fi IP: ${DEFAULT_WIFI_IP}`);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    qrHost === DEFAULT_WIFI_IP
                      ? 'bg-slate-800 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Wifi size={13} />
                  <span>📱 Local Wi-Fi ({DEFAULT_WIFI_IP})</span>
                </button>
              </div>

              {editingHost && (
                <div className="flex gap-2 pt-1">
                  <input
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-orange-500"
                    value={tempHost}
                    onChange={e => setTempHost(e.target.value)}
                    placeholder="Enter your Vercel URL e.g. https://your-project.vercel.app"
                  />
                  <button
                    onClick={() => {
                      const clean = tempHost.trim();
                      localStorage.setItem('dinescan_qr_host', clean);
                      setQrHost(clean);
                      setEditingHost(false);
                      setToast('Host saved!');
                    }}
                    className="rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
        title="Delete table?"
        message={`Delete Table ${deleteTarget?.table_number || ''} and its QR code?`}
        confirmLabel="Delete"
        danger
      />

      {toast && (
        <Toast
          message={toast}
          type={toast.startsWith('Could') ? 'error' : 'success'}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
