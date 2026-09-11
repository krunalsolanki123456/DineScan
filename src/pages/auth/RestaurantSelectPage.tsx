import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import { getUserRoleForRestaurant } from '@/lib/roles';
import { Building2, ChevronRight, Plus, Clock, Star, CheckCircle2, LogOut } from 'lucide-react';

export default function RestaurantSelectPage() {
  const { restaurants, user, switchRestaurant, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (restaurantId: string) => {
    switchRestaurant(restaurantId);
    const role = user ? getUserRoleForRestaurant(user.id, restaurantId, user.email) : 'owner';
    if (role === 'kitchen') {
      navigate('/kitchen');
    } else if (role === 'cashier') {
      navigate('/admin/orders');
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <img src="/dinescan-logo-horizontal.png" alt="DineScan" className="h-10 w-auto object-contain" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.email}</span>
            <button
              onClick={() => void handleSignOut()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
            <Building2 size={28} className="text-orange-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Select Restaurant</h1>
          <p className="mt-2 text-slate-500">Choose a restaurant to manage</p>
        </div>

        {/* Restaurant Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map(r => {
            const role = user ? getUserRoleForRestaurant(user.id, r.id) : 'owner';
            return (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
              >
                {/* Cover image */}
                <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600">
                  {r.cover_url && (
                    <img src={r.cover_url} alt={r.name} className="h-full w-full object-cover opacity-80" />
                  )}
                  {/* Open/Closed badge */}
                  <div className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${r.is_open ? 'bg-green-500 text-white' : 'bg-slate-800/70 text-white'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${r.is_open ? 'bg-white' : 'bg-slate-400'}`} />
                    {r.is_open ? 'Open' : 'Closed'}
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-black text-slate-900">{r.name}</h3>
                      <p className="truncate text-xs text-slate-500">{r.cuisines || r.type}</p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-500" />
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-400" />{r.rating}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{r.opening_time}–{r.closing_time}</span>
                  </div>

                  {/* Role badge */}
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${ROLE_COLORS[role]}`}>
                      <CheckCircle2 size={9} />
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Create New Restaurant card */}
          <button
            onClick={() => navigate('/onboarding')}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-orange-400 hover:bg-orange-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Plus size={22} className="text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-slate-700">Add New Restaurant</p>
              <p className="mt-1 text-xs text-slate-400">Create another restaurant</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="mt-10 text-center text-xs text-slate-400">
          Powered by DineScan · Smarter dining management
        </p>
      </div>
    </div>
  );
}
