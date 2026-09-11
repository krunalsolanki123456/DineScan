import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { createRestaurant, updateRestaurant, createCategory, createMenuItem, createTable, saveSettings } from '@/lib/services';
import { slugify } from '@/lib/utils';
import { QrCode, Check, Store, UtensilsCrossed, Leaf, FolderTree, ArrowRight, ArrowLeft } from 'lucide-react';

const steps = [
  { label: 'Restaurant Info', icon: Store },
  { label: 'Restaurant Type', icon: UtensilsCrossed },
  { label: 'Food Preferences', icon: Leaf },
  { label: 'First Category', icon: FolderTree },
  { label: 'First Menu Item', icon: UtensilsCrossed },
  { label: 'Create Tables', icon: Store },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, restaurant, refreshRestaurant } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [restaurantInfo, setRestaurantInfo] = useState({
    name: restaurant?.name || '',
    phone: restaurant?.phone || '',
    email: restaurant?.email || user?.email || '',
    address: restaurant?.address || '',
    city: restaurant?.city || '',
    state: restaurant?.state || '',
    pincode: restaurant?.pincode || '',
    logo_url: restaurant?.logo_url || '',
    cover_url: restaurant?.cover_url || '',
  });
  const [restaurantType, setRestaurantType] = useState('restaurant');
  const [foodPreference, setFoodPreference] = useState('both');
  const [categoryName, setCategoryName] = useState('Starters');
  const [menuItem, setMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    food_type: 'veg',
  });
  const [tableCount, setTableCount] = useState('4');
  const [createdRestaurantId, setCreatedRestaurantId] = useState<string | null>(restaurant?.id || null);
  const [createdCategoryId, setCreatedCategoryId] = useState<string | null>(null);

  const handleNext = async () => {
    if (step === 0) {
      setLoading(true);
      try {
        if (createdRestaurantId) {
          await updateRestaurant(createdRestaurantId, {
            name: restaurantInfo.name,
            phone: restaurantInfo.phone,
            email: restaurantInfo.email,
            address: restaurantInfo.address,
            city: restaurantInfo.city,
            state: restaurantInfo.state,
            pincode: restaurantInfo.pincode,
            logo_url: restaurantInfo.logo_url || null,
            cover_url: restaurantInfo.cover_url || null,
            type: restaurantType,
            food_preference: foodPreference,
          });
        } else {
          const newRest = await createRestaurant({
            name: restaurantInfo.name,
            slug: slugify(restaurantInfo.name) || 'my-restaurant',
            owner_id: user?.id,
            phone: restaurantInfo.phone,
            email: restaurantInfo.email,
            address: restaurantInfo.address,
            city: restaurantInfo.city,
            state: restaurantInfo.state,
            pincode: restaurantInfo.pincode,
            logo_url: restaurantInfo.logo_url || null,
            cover_url: restaurantInfo.cover_url || null,
            type: restaurantType,
            food_preference: foodPreference,
          });
          if (newRest) setCreatedRestaurantId(newRest.id);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    } else if (step === 3 && createdRestaurantId) {
      setLoading(true);
      try {
        const category = await createCategory({
          restaurant_id: createdRestaurantId,
          name: categoryName,
          display_order: 1,
        });
        if (category) setCreatedCategoryId(category.id);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    } else if (step === 4 && createdRestaurantId) {
      setLoading(true);
      try {
        await createMenuItem({
          restaurant_id: createdRestaurantId,
          category_id: createdCategoryId,
          name: menuItem.name,
          description: menuItem.description,
          price: parseFloat(menuItem.price) || 0,
          food_type: menuItem.food_type,
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    } else if (step === 5 && createdRestaurantId) {
      setLoading(true);
      try {
        const count = parseInt(tableCount) || 4;
        for (let i = 1; i <= count; i++) {
          await createTable({
            restaurant_id: createdRestaurantId,
            table_number: String(i).padStart(2, '0'),
            seats: 4,
            area: 'Ground Floor',
          });
        }
        await saveSettings(createdRestaurantId, { accept_table_orders: true, allow_customer_notes: true, require_customer_name: false, require_phone_number: false, auto_accept_orders: false, gst_percentage: 5, service_charge_percentage: 0, currency: '₹' });
        await refreshRestaurant();
        navigate('/admin/dashboard');
        return;
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const update = (key: string, value: string) => setRestaurantInfo((p) => ({ ...p, [key]: value }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Logo & Quick Skip */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-orange-50">
              <img src="/favicon.png" alt="DineScan" className="h-9 w-9 object-contain" />
            </div>
            <span className="text-lg font-bold text-slate-900">DineScan</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Skip to Dashboard ↗
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                    i < step
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : i === step
                      ? 'border-brand-500 bg-white text-brand-600'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {i < step ? <Check size={18} /> : <s.icon size={18} />}
                </div>
                <span className={`mt-2 hidden text-xs sm:block ${i <= step ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`absolute h-0.5 ${i < step ? 'bg-brand-500' : 'bg-slate-200'}`} style={{ width: '100%', left: '50%', top: '20px' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">Restaurant Information</h2>
              <p className="mt-1 text-sm text-slate-500">Tell us about your restaurant</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Restaurant Name</label>
                  <input value={restaurantInfo.name} onChange={(e) => update('name', e.target.value)} placeholder="Royal Spice" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                    <input value={restaurantInfo.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                    <input value={restaurantInfo.email} onChange={(e) => update('email', e.target.value)} placeholder="contact@restaurant.com" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
                  <input value={restaurantInfo.address} onChange={(e) => update('address', e.target.value)} placeholder="12 MG Road" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                    <input value={restaurantInfo.city} onChange={(e) => update('city', e.target.value)} placeholder="Bengaluru" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">State</label>
                    <input value={restaurantInfo.state} onChange={(e) => update('state', e.target.value)} placeholder="Karnataka" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Pincode</label>
                    <input value={restaurantInfo.pincode} onChange={(e) => update('pincode', e.target.value)} placeholder="560001" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">Restaurant Type</h2>
              <p className="mt-1 text-sm text-slate-500">What kind of establishment is this?</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { value: 'restaurant', label: 'Restaurant' },
                  { value: 'cafe', label: 'Cafe' },
                  { value: 'hotel', label: 'Hotel' },
                  { value: 'food_court', label: 'Food Court' },
                  { value: 'cloud_kitchen', label: 'Cloud Kitchen' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setRestaurantType(t.value)}
                    className={`rounded-xl border-2 p-4 text-center transition ${
                      restaurantType === t.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">Food Preferences</h2>
              <p className="mt-1 text-sm text-slate-500">What type of food do you serve?</p>
              <div className="mt-6 space-y-3">
                {[
                  { value: 'veg', label: 'Veg Only', desc: 'Pure vegetarian restaurant' },
                  { value: 'both', label: 'Veg + Non-Veg', desc: 'Both vegetarian and non-vegetarian' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFoodPreference(f.value)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                      foodPreference === f.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{f.label}</p>
                      <p className="text-xs text-slate-500">{f.desc}</p>
                    </div>
                    {foodPreference === f.value && <Check size={20} className="text-brand-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create First Category</h2>
              <p className="mt-1 text-sm text-slate-500">Organize your menu with categories</p>
              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Category Name</label>
                <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Starters" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Starters', 'Main Course', 'Breads', 'Desserts', 'Drinks'].map((s) => (
                    <button key={s} onClick={() => setCategoryName(s)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">Add First Menu Item</h2>
              <p className="mt-1 text-sm text-slate-500">Add your first dish to the menu</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Item Name</label>
                  <input value={menuItem.name} onChange={(e) => setMenuItem({ ...menuItem, name: e.target.value })} placeholder="Paneer Tikka" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                  <textarea value={menuItem.description} onChange={(e) => setMenuItem({ ...menuItem, description: e.target.value })} placeholder="Soft paneer marinated with spices" rows={2} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Price (₹)</label>
                    <input type="number" value={menuItem.price} onChange={(e) => setMenuItem({ ...menuItem, price: e.target.value })} placeholder="249" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Food Type</label>
                    <select value={menuItem.food_type} onChange={(e) => setMenuItem({ ...menuItem, food_type: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
                      <option value="veg">Veg</option>
                      <option value="non-veg">Non-Veg</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Restaurant Tables</h2>
              <p className="mt-1 text-sm text-slate-500">Add tables for QR code generation</p>
              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Number of Tables</label>
                <input type="number" value={tableCount} onChange={(e) => setTableCount(e.target.value)} min="1" max="50" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                <p className="mt-3 text-xs text-slate-500">Each table will get its own unique QR code that customers can scan to order.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {loading ? 'Saving...' : step === steps.length - 1 ? 'Finish' : 'Continue'}
              {step < steps.length - 1 && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
