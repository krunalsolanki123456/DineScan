import { useEffect, useState } from 'react';
import { Palette, Save, Smartphone, Star, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { updateRestaurant } from '@/lib/services';
import { PageHeader, Toggle, inputClass, labelClass } from '@/components/admin/PageBits';
import { FoodTypeIcon, Toast } from '@/components/ui';
import { useTheme, THEME_PRESETS } from '@/lib/theme-context';

export default function AppearancePage() {
  const { restaurant, refreshRestaurant } = useAuth();
  const { themeColor, setThemeColor } = useTheme();
  const [form, setForm] = useState<any>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (restaurant) {
      setForm({
        ...restaurant,
        primary_color: restaurant.primary_color || themeColor || '#F97316',
      });
    }
  }, [restaurant]);

  if (!restaurant) return null;

  const set = (k: string, v: any) => {
    setForm((p: any) => ({ ...p, [k]: v }));
    if (k === 'primary_color' && typeof v === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) {
      setThemeColor(v);
    }
  };

  const handleSelectPreset = (hex: string) => {
    set('primary_color', hex);
    setThemeColor(hex);
  };

  const save = async () => {
    try {
      await updateRestaurant(restaurant.id, {
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        card_style: form.card_style,
        corner_radius: Number(form.corner_radius),
        show_ratings: form.show_ratings,
        show_prep_time: form.show_prep_time,
        show_description: form.show_description,
        show_discount: form.show_discount,
        show_restaurant_info: form.show_restaurant_info,
      });
      await refreshRestaurant();
      setToast('Appearance settings saved');
    } catch {
      setToast('Could not save appearance');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appearance"
        description="Customize the customer QR menu and DineScan brand colors."
        actions={
          <button
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition active:scale-95"
          >
            <Save size={17} /> Save Appearance
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          {/* Brand Colors Section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={19} className="text-brand-500" />
                <h3 className="font-bold text-slate-900">Brand Colors</h3>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles size={13} className="text-brand-500" />
                Changes apply instantly
              </span>
            </div>

            {/* Quick Color Presets */}
            <div className="mb-5">
              <label className={labelClass}>Quick Color Presets</label>
              <div className="mt-2 grid grid-cols-5 sm:grid-cols-10 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const isCurrent = (form.primary_color || '').toUpperCase() === preset.hex.toUpperCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.hex)}
                      className={`group flex flex-col items-center gap-1 rounded-xl p-1 transition ${
                        isCurrent ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                      }`}
                      title={preset.name}
                    >
                      <div
                        className="relative flex h-8 w-8 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105"
                        style={{ backgroundColor: preset.hex }}
                      >
                        {isCurrent && <Check size={14} className="text-white drop-shadow-sm stroke-[3]" />}
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 truncate max-w-[40px]">
                        {preset.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Primary Brand Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.primary_color || themeColor || '#F97316'}
                    onChange={(e) => set('primary_color', e.target.value)}
                    className="h-11 w-14 rounded-xl border border-slate-200 bg-white p-1 cursor-pointer"
                  />
                  <input
                    className={inputClass}
                    value={form.primary_color || ''}
                    onChange={(e) => set('primary_color', e.target.value)}
                    placeholder="#F97316"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Secondary Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.secondary_color || '#FFEDD5'}
                    onChange={(e) => set('secondary_color', e.target.value)}
                    className="h-11 w-14 rounded-xl border border-slate-200 bg-white p-1 cursor-pointer"
                  />
                  <input
                    className={inputClass}
                    value={form.secondary_color || ''}
                    onChange={(e) => set('secondary_color', e.target.value)}
                    placeholder="#FFEDD5"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Menu Card Style */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-bold text-slate-900">Menu Card Style</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ['list', 'List'],
                ['compact', 'Compact'],
                ['image_cards', 'Image Cards'],
              ].map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('card_style', v)}
                  className={`rounded-xl border-2 p-4 text-sm font-semibold transition ${
                    form.card_style === v
                      ? 'border-brand-500 bg-brand-50/60 text-brand-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="mt-5">
              <label className={labelClass}>Corner Radius: {form.corner_radius || 16}px</label>
              <input
                type="range"
                min="8"
                max="28"
                value={form.corner_radius || 16}
                onChange={(e) => set('corner_radius', Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          </section>

          {/* Menu Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-bold text-slate-900">Menu Information</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Toggle checked={!!form.show_ratings} onChange={(v) => set('show_ratings', v)} label="Show ratings" />
              <Toggle checked={!!form.show_prep_time} onChange={(v) => set('show_prep_time', v)} label="Preparation time" />
              <Toggle checked={!!form.show_description} onChange={(v) => set('show_description', v)} label="Food description" />
              <Toggle checked={!!form.show_discount} onChange={(v) => set('show_discount', v)} label="Discount prices" />
              <Toggle checked={!!form.show_restaurant_info} onChange={(v) => set('show_restaurant_info', v)} label="Restaurant information" />
            </div>
          </section>
        </div>

        {/* Live Mobile Preview */}
        <aside className="xl:sticky xl:top-6">
          <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Smartphone size={15} /> Live Mobile Preview
          </div>
          <div className="mx-auto max-w-[350px] rounded-[36px] border-[8px] border-slate-900 bg-white p-2 shadow-2xl">
            <div className="overflow-hidden rounded-[26px] bg-white">
              <div className="h-32 bg-slate-800">
                <img
                  src={restaurant.cover_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}
                  alt=""
                  className="h-full w-full object-cover opacity-70"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-black">{restaurant.name}</h3>
                <p className="text-[10px] text-slate-400">{restaurant.cuisines}</p>
                <div className="mt-3 rounded-xl bg-slate-100 p-3 text-xs text-slate-400">Search dishes...</div>
                <div className="mt-3 flex gap-1 overflow-hidden">
                  <span
                    className="rounded-full px-3 py-1.5 text-[10px] font-bold text-white transition-colors"
                    style={{ backgroundColor: form.primary_color || themeColor }}
                  >
                    All
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px]">Starters</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px]">Main</span>
                </div>
                <div
                  className="mt-4 flex gap-3 rounded-xl border border-slate-100 p-2"
                  style={{ borderRadius: Number(form.corner_radius || 16) }}
                >
                  <div
                    className="h-20 w-20 rounded-xl"
                    style={{ backgroundColor: `${form.primary_color || themeColor}25` }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <FoodTypeIcon type="veg" size={12} />
                      <b className="text-xs">Paneer Tikka</b>
                    </div>
                    {form.show_description && (
                      <p className="mt-1 text-[9px] text-slate-400">Cottage cheese marinated in spices...</p>
                    )}
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <b className="text-xs">₹280</b>
                        {form.show_ratings && (
                          <p className="flex items-center gap-0.5 text-[9px] text-slate-400">
                            <Star size={9} className="fill-amber-400 text-amber-400" />
                            4.9
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="rounded-lg px-3 py-1.5 text-[9px] font-bold text-white transition-colors"
                        style={{ backgroundColor: form.primary_color || themeColor }}
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

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
