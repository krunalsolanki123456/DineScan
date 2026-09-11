import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Copy, Trash2, PackageX, Image as ImageIcon, Star, Clock, Sparkles, CheckCircle2, AlertTriangle, Info, Table, Upload, Loader2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  createAddon, createMenuItem, deleteAddon, deleteMenuItem, getAddons, getCategories, getMenuItems, updateMenuItem, seedSampleMenu,
} from '@/lib/services';
import type { Category, MenuItem, MenuItemAddon } from '@/types';
import { ConfirmModal, Drawer, FilterDropdown, FoodTypeIcon, SearchInput, Toast } from '@/components/ui';
import { PageHeader, Toggle, inputClass, labelClass } from '@/components/admin/PageBits';
import { cn, formatCurrency } from '@/lib/utils';
import { demoCategories, demoMenuItems } from '@/data/demo';
import { compressImageFile } from '@/lib/image-upload';

const emptyForm = {
  name: '', description: '', image_url: '', category_id: '', price: '', discount_price: '', food_type: 'veg', spice_level: 'medium', prep_time: '15',
  is_available: true, is_featured: false, is_recommended: false, is_bestseller: false,
};

type FormState = typeof emptyForm;

export default function MenuManagementPage() {
  const { restaurant } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availability, setAvailability] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [addons, setAddons] = useState<Array<{ id?: string; name: string; price: string }>>([]);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seedModalOpen, setSeedModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ categoriesAdded: number; itemsAdded: number } | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setToast('Please upload a valid image file (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setToast('Image file size must be less than 8MB');
      return;
    }
    setUploadingImage(true);
    try {
      // Compress to max 800x600 for sharp, fast-loading food photo
      const dataUrl = await compressImageFile(file, 800, 600, 0.85);
      setForm((prev) => ({ ...prev, image_url: dataUrl }));
      setToast('Food image uploaded successfully');
    } catch {
      setToast('Failed to process food image');
    } finally {
      setUploadingImage(false);
    }
  };

  const load = async () => {
    if (!restaurant) return;
    try {
      const [mi, cats] = await Promise.all([getMenuItems(restaurant.id), getCategories(restaurant.id)]);
      setItems(mi);
      setCategories(cats);
    } catch {
      setItems(demoMenuItems.map((x) => ({ ...x, restaurant_id: restaurant.id })));
      setCategories(demoCategories.map((x) => ({ ...x, restaurant_id: restaurant.id })));
    }
  };

  useEffect(() => { void load(); }, [restaurant?.id]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || (item.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || item.category_id === categoryFilter;
    const matchesAvailability = !availability || (availability === 'available' ? item.is_available : !item.is_available);
    return matchesSearch && matchesCategory && matchesAvailability;
  }), [items, search, categoryFilter, availability]);

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || 'Uncategorized';

  const openNew = () => {
    setEditing(null); setForm(emptyForm); setAddons([]); setDrawerOpen(true);
  };

  const openEdit = async (item: MenuItem) => {
    setEditing(item);
    setForm({
      name:item.name, description:item.description || '', image_url:item.image_url || '', category_id:item.category_id || '', price:String(item.price),
      discount_price:item.discount_price == null ? '' : String(item.discount_price), food_type:item.food_type, spice_level:item.spice_level,
      prep_time:String(item.prep_time), is_available:item.is_available, is_featured:item.is_featured, is_recommended:item.is_recommended, is_bestseller:item.is_bestseller,
    });
    setAddons([]);
    setDrawerOpen(true);
    try {
      const rows = await getAddons(item.id);
      setAddons(rows.map((a) => ({ id:a.id, name:a.name, price:String(a.price) })));
    } catch { /* optional */ }
  };

  const save = async () => {
    if (!restaurant || !form.name.trim()) return;
    setSaving(true);
    const payload: Partial<MenuItem> = {
      restaurant_id: restaurant.id, name: form.name.trim(), description: form.description || null, image_url: form.image_url || null,
      category_id: form.category_id || null, price: Number(form.price) || 0, discount_price: form.discount_price ? Number(form.discount_price) : null,
      food_type: form.food_type, spice_level: form.spice_level, prep_time: Number(form.prep_time) || 15,
      is_available: form.is_available, is_featured: form.is_featured, is_recommended: form.is_recommended, is_bestseller: form.is_bestseller,
    };
    try {
      let saved: MenuItem | null = null;
      if (editing) {
        saved = await updateMenuItem(editing.id, payload);
        const old = await getAddons(editing.id);
        await Promise.all(old.map((a) => deleteAddon(a.id)));
        await Promise.all(addons.filter((a) => a.name.trim()).map((a) => createAddon({ menu_item_id: editing.id, name:a.name.trim(), price:Number(a.price)||0 })));
      } else {
        saved = await createMenuItem(payload);
        if (saved) await Promise.all(addons.filter((a) => a.name.trim()).map((a) => createAddon({ menu_item_id:saved!.id, name:a.name.trim(), price:Number(a.price)||0 })));
      }
      if (saved) setItems((prev) => editing ? prev.map((x) => x.id === editing.id ? saved! : x) : [saved!, ...prev]);
      setDrawerOpen(false); setToast(editing ? 'Menu item updated' : 'Menu item added');
    } catch (e) {
      console.error(e); setToast('Could not save item');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMenuItem(deleteTarget.id);
      setItems((p) => p.filter((x) => x.id !== deleteTarget.id));
      setToast('Menu item deleted');
    } catch { setToast('Could not delete item'); }
  };

  const duplicate = async (item: MenuItem) => {
    if (!restaurant) return;
    const copy: Partial<MenuItem> = { ...item, id: undefined, name:`${item.name} Copy`, restaurant_id:restaurant.id };
    try {
      const created = await createMenuItem(copy);
      if (created) setItems((p) => [created as MenuItem, ...p]);
      setToast('Item duplicated');
    } catch { setToast('Could not duplicate item'); }
  };

  const toggleAvailability = async (item: MenuItem) => {
    const next = !item.is_available;
    setItems((p) => p.map((x) => x.id === item.id ? { ...x, is_available: next } : x));
    try { await updateMenuItem(item.id, { is_available: next }); } catch { /* optimistic UI */ }
  };

  const handleSeedMenu = async () => {
    if (!restaurant) return;
    setSeeding(true);
    setSeedError(null);
    setSeedResult(null);
    try {
      const result = await seedSampleMenu(restaurant.id);
      setSeedResult(result);
      await load();
    } catch (e: unknown) {
      setSeedError(e instanceof Error ? e.message : 'Could not seed menu. Check database connection.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Items" description={`${items.length} dishes in your digital menu`} actions={
        <>
          <button
            onClick={() => { setSeedModalOpen(true); setSeedResult(null); setSeedError(null); }}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
          >
            <Sparkles size={17}/> Seed Sample Menu
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"><Plus size={17}/> Add Menu Item</button>
        </>
      } />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search menu items..." className="flex-1" />
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterDropdown value={categoryFilter} onChange={setCategoryFilter} label="All Categories" options={categories.map((c)=>({value:c.id,label:c.name}))}/>
            <FilterDropdown value={availability} onChange={setAvailability} label="All Availability" options={[{value:'available',label:'Available'},{value:'out',label:'Out of stock'}]}/>

            {/* View Switchers: Grid, List, Table */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition', viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                title="Grid Cards"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
                  <rect x="13" y="3.5" width="7.5" height="7.5" rx="2" />
                  <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" />
                  <rect x="13" y="13" width="7.5" height="7.5" rx="2" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition', viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                title="List Cards"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="6" width="18" height="3.8" rx="1.9" />
                  <rect x="3" y="14.2" width="18" height="3.8" rx="1.9" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition', viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                title="Table View"
              >
                <Table size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Grid View (Vertical Cards - Image 2) */}
      {viewMode === 'grid' && (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 min-[460px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map(item => (
            <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition hover:border-slate-300 hover:shadow-md">
              {/* Top Image */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon size={32} /></div>
                )}
                {item.is_bestseller && (
                  <span className="absolute left-2.5 top-2.5 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur">
                    Bestseller
                  </span>
                )}
                <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700 backdrop-blur shadow-xs">
                  <FoodTypeIcon type={item.food_type} size={11} />
                  <span className="capitalize">{item.food_type}</span>
                </div>
              </div>

              {/* Bottom Body */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="truncate font-bold text-slate-900 text-sm sm:text-base">{item.name}</h3>
                    <span className="text-slate-400 p-0.5"><Info size={15} /></span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                    {item.description || 'No description provided for this dish.'}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{categoryName(item.category_id)}</p>
                </div>

                {/* Price & Actions */}
                <div className="mt-4 flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                  <div>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {formatCurrency(Number(item.discount_price ?? item.price))}
                    </span>
                    {item.discount_price && (
                      <span className="ml-1.5 text-xs text-slate-400 line-through">
                        {formatCurrency(Number(item.price))}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={()=>void toggleAvailability(item)} className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', item.is_available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                      {item.is_available ? 'Active' : 'Off'}
                    </button>
                    <button onClick={()=>void openEdit(item)} title="Edit" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={15}/></button>
                    <button onClick={()=>setDeleteTarget(item)} title="Delete" className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={15}/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && <div className="col-span-full p-16 text-center text-slate-400"><PackageX className="mx-auto text-slate-300" size={36}/><p className="mt-3 font-medium text-slate-700">No menu items found</p></div>}
        </div>
      )}

      {/* 2. List View (Horizontal Cards - Image 1) */}
      {viewMode === 'list' && (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(item => (
            <div key={item.id} className="group relative flex overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)] transition hover:border-slate-300 hover:shadow-md">
              {/* Left Image */}
              <div className="relative h-32 w-32 sm:h-36 sm:w-36 shrink-0 overflow-hidden bg-slate-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon size={26} /></div>
                )}
                {item.is_bestseller && (
                  <span className="absolute left-2 top-2 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs backdrop-blur">
                    Bestseller
                  </span>
                )}
              </div>

              {/* Right Content */}
              <div className="flex flex-1 flex-col justify-between p-3.5 min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="truncate font-bold text-slate-900 text-sm sm:text-base">{item.name}</h3>
                    <span className="text-slate-400 p-0.5"><Info size={15} /></span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                    {item.description || 'No description provided for this dish.'}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{categoryName(item.category_id)}</p>
                </div>

                {/* Bottom Row */}
                <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {formatCurrency(Number(item.discount_price ?? item.price))}
                    </span>
                    {item.discount_price && (
                      <span className="ml-1 text-xs text-slate-400 line-through">
                        {formatCurrency(Number(item.price))}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={()=>void toggleAvailability(item)} className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', item.is_available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                      {item.is_available ? 'Active' : 'Off'}
                    </button>
                    <button onClick={()=>void openEdit(item)} title="Edit" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={15}/></button>
                    <button onClick={()=>setDeleteTarget(item)} title="Delete" className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={15}/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && <div className="col-span-full p-16 text-center text-slate-400"><PackageX className="mx-auto text-slate-300" size={36}/><p className="mt-3 font-medium text-slate-700">No menu items found</p></div>}
        </div>
      )}

      {/* 3. Table View */}
      {viewMode === 'table' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[2.2fr_1fr_.8fr_.8fr_.8fr_100px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Item</span><span>Category</span><span>Type</span><span>Price</span><span>Availability</span><span>Actions</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="grid gap-4 px-4 py-4 transition hover:bg-slate-50 lg:grid-cols-[2.2fr_1fr_.8fr_.8fr_.8fr_100px] lg:items-center lg:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon size={20}/></div>}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><p className="truncate font-semibold text-slate-900">{item.name}</p>{item.is_bestseller && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Bestseller</span>}</div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.description || 'No description'}</p>
                    <div className="mt-1.5 flex gap-3 text-[11px] text-slate-400"><span className="inline-flex items-center gap-1"><Clock size={12}/>{item.prep_time} min</span><span className="inline-flex items-center gap-1"><Star size={12}/>{item.rating}</span></div>
                  </div>
                </div>
                <div className="text-sm text-slate-600"><span className="lg:hidden font-medium text-slate-400">Category: </span>{categoryName(item.category_id)}</div>
                <div className="flex items-center gap-2 text-sm capitalize text-slate-600"><FoodTypeIcon type={item.food_type}/>{item.food_type}</div>
                <div className="text-sm font-semibold text-slate-900">{item.discount_price ? <><span>{formatCurrency(Number(item.discount_price))}</span><span className="ml-2 text-xs font-normal text-slate-400 line-through">{formatCurrency(Number(item.price))}</span></> : formatCurrency(Number(item.price))}</div>
                <button onClick={()=>void toggleAvailability(item)} className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${item.is_available?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{item.is_available?'Available':'Out of stock'}</button>
                <div className="flex items-center gap-1">
                  <button onClick={()=>void openEdit(item)} title="Edit" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={16}/></button>
                  <button onClick={()=>void duplicate(item)} title="Duplicate" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Copy size={16}/></button>
                  <button onClick={()=>setDeleteTarget(item)} title="Delete" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {!filtered.length && <div className="p-12 text-center"><PackageX className="mx-auto text-slate-300" size={34}/><p className="mt-3 font-medium text-slate-700">No menu items found</p><p className="text-sm text-slate-400">Try changing your filters or add a new dish.</p></div>}
          </div>
        </div>
      )}

      <Drawer isOpen={drawerOpen} onClose={()=>setDrawerOpen(false)} title={editing?'Edit Menu Item':'Add Menu Item'}>
        <div className="space-y-5 p-6">
          {/* Food Image Upload & Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Food Photo</label>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, image_url: '' }))}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImageFile(f);
                e.target.value = '';
              }}
            />

            {/* Upload Area or Preview */}
            {form.image_url ? (
              <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/30 p-2.5">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner">
                  <img
                    src={form.image_url}
                    alt="Dish Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-semibold text-xs backdrop-blur-xs">
                      <Loader2 className="animate-spin mr-2" size={20} /> Compressing photo...
                    </div>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-600 shadow-xs hover:bg-brand-50 transition"
                  >
                    <Upload size={13} /> Change Photo
                  </button>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Photo Attached</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handleImageFile(f);
                }}
                className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/70 hover:bg-brand-50/30 p-6 text-center transition flex flex-col items-center justify-center"
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 py-3 text-brand-600">
                    <Loader2 className="animate-spin" size={28} />
                    <span className="text-xs font-bold">Uploading & compressing food image...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 group-hover:scale-105 group-hover:border-brand-300 transition">
                      <Upload className="text-slate-500 group-hover:text-brand-500 transition" size={22} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-800 group-hover:text-brand-600 transition">
                      Click to upload food photo
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose from device or drag & drop (JPG, PNG, WebP up to 8MB)
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Optional URL toggle */}
            <div className="mt-2">
              <details className="text-xs text-slate-400 group">
                <summary className="cursor-pointer font-medium hover:text-slate-600 flex items-center gap-1.5 py-0.5">
                  <LinkIcon size={12} /> Or paste image URL
                </summary>
                <div className="mt-2">
                  <input
                    className={inputClass}
                    value={form.image_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </details>
            </div>
          </div>
          <div><label className={labelClass}>Item name</label><input className={inputClass} value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Paneer Tikka"/></div>
          <div><label className={labelClass}>Description</label><textarea rows={3} className={inputClass} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="Describe this dish..."/></div>
          <div><label className={labelClass}>Category</label><select className={inputClass} value={form.category_id} onChange={(e)=>setForm({...form,category_id:e.target.value})}><option value="">Select category</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Regular price</label><input type="number" className={inputClass} value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})}/></div><div><label className={labelClass}>Discount price</label><input type="number" className={inputClass} value={form.discount_price} onChange={(e)=>setForm({...form,discount_price:e.target.value})}/></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>Food type</label><select className={inputClass} value={form.food_type} onChange={(e)=>setForm({...form,food_type:e.target.value})}><option value="veg">Veg</option><option value="non-veg">Non-Veg</option></select></div><div><label className={labelClass}>Spice level</label><select className={inputClass} value={form.spice_level} onChange={(e)=>setForm({...form,spice_level:e.target.value})}><option value="mild">Mild</option><option value="medium">Medium</option><option value="hot">Hot</option></select></div></div>
          <div><label className={labelClass}>Preparation time (minutes)</label><input type="number" className={inputClass} value={form.prep_time} onChange={(e)=>setForm({...form,prep_time:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4"><Toggle checked={form.is_available} onChange={(v)=>setForm({...form,is_available:v})} label="Available"/><Toggle checked={form.is_featured} onChange={(v)=>setForm({...form,is_featured:v})} label="Featured"/><Toggle checked={form.is_recommended} onChange={(v)=>setForm({...form,is_recommended:v})} label="Recommended"/><Toggle checked={form.is_bestseller} onChange={(v)=>setForm({...form,is_bestseller:v})} label="Bestseller"/></div>
          <div>
            <div className="mb-2 flex items-center justify-between"><label className={labelClass}>Add-ons</label><button onClick={()=>setAddons((p)=>[...p,{name:'',price:''}])} className="text-xs font-semibold text-brand-600">+ Add option</button></div>
            <div className="space-y-2">{addons.map((a,i)=><div key={a.id || i} className="grid grid-cols-[1fr_100px_36px] gap-2"><input className={inputClass} value={a.name} onChange={(e)=>setAddons((p)=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="Extra Cheese"/><input className={inputClass} type="number" value={a.price} onChange={(e)=>setAddons((p)=>p.map((x,j)=>j===i?{...x,price:e.target.value}:x))} placeholder="₹"/><button onClick={()=>setAddons((p)=>p.filter((_,j)=>j!==i))} className="rounded-xl text-red-500 hover:bg-red-50"><Trash2 size={16} className="mx-auto"/></button></div>)}</div>
          </div>
          <button disabled={saving} onClick={()=>void save()} className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">{saving?'Saving...':'Save Item'}</button>
        </div>
      </Drawer>

      <ConfirmModal isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={()=>void remove()} title="Delete menu item?" message={`Delete ${deleteTarget?.name || 'this item'} from your menu?`} confirmLabel="Delete" danger />
      {toast && <Toast message={toast} type={toast.startsWith('Could')?'error':'success'} onClose={()=>setToast(null)}/>}

      {/* Seed Sample Menu Modal */}
      {seedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="rounded-t-2xl bg-gradient-to-br from-brand-500 to-orange-600 p-6 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 mb-3">
                <Sparkles size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-black">Seed Sample Menu</h2>
              <p className="mt-1 text-sm text-white/80">Instantly populate your menu with real restaurant data.</p>
            </div>

            <div className="p-6">
              {!seedResult && !seedError && (
                <>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                      <div className="text-sm text-amber-800">
                        <p className="font-semibold">This will replace existing data</p>
                        <p className="mt-1 text-xs">All current menu items and categories will be deleted and replaced with sample data.</p>
                      </div>
                    </div>
                  </div>

                  {/* What will be added */}
                  <p className="mb-3 text-sm font-semibold text-slate-700">What will be added:</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { icon: '🥗', label: 'Starters', count: 5 },
                      { icon: '🍛', label: 'Main Course', count: 4 },
                      { icon: '🥡', label: 'Chinese', count: 3 },
                      { icon: '🍚', label: 'Rice', count: 3 },
                      { icon: '🫓', label: 'Breads', count: 2 },
                      { icon: '🍮', label: 'Desserts', count: 2 },
                      { icon: '🥤', label: 'Drinks', count: 3 },
                    ].map(c => (
                      <div key={c.label} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="text-lg">{c.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{c.label}</p>
                          <p className="text-[10px] text-slate-400">{c.count} items</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2">
                      <span className="text-lg">📦</span>
                      <div>
                        <p className="text-xs font-semibold text-brand-800">Total</p>
                        <p className="text-[10px] text-brand-600">22 menu items</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSeedModalOpen(false)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleSeedMenu()}
                      disabled={seeding}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      {seeding ? (
                        <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Seeding...</>
                      ) : (
                        <><Sparkles size={16}/> Seed Now</>
                      )}
                    </button>
                  </div>
                </>
              )}

              {seedResult && (
                <div className="text-center py-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Menu Seeded Successfully!</h3>
                  <p className="mt-2 text-sm text-slate-500">Your menu is now live and ready for customers.</p>
                  <div className="mt-5 flex justify-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-black text-brand-500">{seedResult.categoriesAdded}</p>
                      <p className="text-xs text-slate-500 mt-1">Categories Added</p>
                    </div>
                    <div className="w-px bg-slate-100" />
                    <div className="text-center">
                      <p className="text-3xl font-black text-brand-500">{seedResult.itemsAdded}</p>
                      <p className="text-xs text-slate-500 mt-1">Menu Items Added</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSeedModalOpen(false)}
                    className="mt-6 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                  >
                    Done
                  </button>
                </div>
              )}

              {seedError && (
                <div className="text-center py-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
                    <AlertTriangle size={32} className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Seeding Failed</h3>
                  <p className="mt-2 text-sm text-red-500">{seedError}</p>
                  <div className="mt-5 flex gap-3">
                    <button onClick={() => setSeedModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600">
                      Close
                    </button>
                    <button onClick={() => void handleSeedMenu()} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white">
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
