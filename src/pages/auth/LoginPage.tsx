import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError, restaurantsCount, role, isPlatformOwner } = await signIn(email, password);

    setLoading(false);
    if (signInError) {
      setError(signInError);
      return;
    }

    if (isPlatformOwner || role === 'super_admin') {
      navigate('/super-admin/dashboard');
      return;
    }

    if (restaurantsCount === 0) {
      setError('No restaurant is linked to this account. Please ask your administrator to invite you.');
      return;
    }

    if (role === 'kitchen') {
      navigate('/kitchen');
    } else if (role === 'cashier') {
      navigate('/admin/orders');
    } else if (restaurantsCount && restaurantsCount > 1) {
      navigate('/select-restaurant');
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] lg:grid lg:grid-cols-[55.5%_44.5%]">
      {/* Approved DineScan visual — hidden on small screens so login stays quick and focused. */}
      <section
        className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 lg:block"
        aria-label="DineScan restaurant ordering preview"
      >
        {/*
          Keep the complete artwork visible. The approved hero image is almost square,
          while this panel is wider on desktop. `object-cover` was cropping the top logo
          and the Scan / Order / Enjoy artwork at the bottom. The soft background copy
          fills the extra width, while the foreground uses `object-contain` so nothing is cut.
        */}
        <img
          src="/login-left-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-35 blur-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/20 via-transparent to-brand-950/30" />
        <img
          src="/login-left-hero.png"
          alt="DineScan QR ordering, live orders and menu management"
          className="relative z-10 w-full object-contain object-center"
        />
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfcfe] px-5 py-10 sm:px-8 lg:px-10 xl:px-14">
        {/* very soft background glow, matching the theme */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-100/60 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-slate-100/70 blur-3xl" />
        </div>

        <div className="absolute right-7 top-7 hidden text-right lg:block xl:right-10 xl:top-9">
          <p className="rotate-[-4deg] text-[13px] font-semibold italic leading-4 text-slate-400 xl:text-sm">
            Better Restaurants<br />Brighter Tomorrows
          </p>
          <span className="mt-2 ml-auto block h-[2px] w-12 rotate-[-9deg] rounded-full bg-brand-500" />
        </div>

        <div className="relative z-10 w-full max-w-[500px]">
          <div className="rounded-[18px] border border-slate-200/90 bg-white px-6 py-8 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:px-9 sm:py-9 xl:px-11 xl:py-10">
            <div className="mb-8 flex justify-center sm:mb-9">
              <img
                src="/dinescan-logo-horizontal.png"
                alt="DineScan"
                className="h-auto w-[190px] object-contain sm:w-[205px]"
              />
            </div>

            <header className="mb-8 text-center">
              <h1 className="text-[31px] font-extrabold tracking-[-0.035em] text-slate-950 sm:text-[34px]">
                Welcome back
              </h1>
              <p className="mt-1.5 text-[14px] font-medium text-slate-500 sm:text-[15px]">
                Sign in to your restaurant dashboard
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
                  Email
                </label>
                <div className="group relative">
                  <Mail
                    size={19}
                    strokeWidth={2}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-brand-500"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="owner@restaurant.com"
                    className="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-12 pr-4 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100/70"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                  Password
                </label>
                <div className="group relative">
                  <Lock
                    size={19}
                    strokeWidth={2}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-brand-500"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-12 pr-12 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100/70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-0.5">
                <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-[18px] w-[18px] cursor-pointer rounded border-slate-300 accent-brand-500"
                  />
                  Remember me
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-brand-600 transition hover:text-brand-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-[15px] font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                style={{
                  boxShadow: '0 8px 20px -4px rgb(var(--color-brand-500) / 0.35)',
                }}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/45 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">or continue with</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
            >
              <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.4 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.7-3.3-11.3-8H6.3C9.6 35.6 16.3 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.2l6.2 5.2C41 35 44 30 44 24c0-1.3-.1-2.7-.4-4z" />
              </svg>
              Sign in with Google
            </button>

            <p className="mt-7 text-center text-sm font-medium text-slate-500">
              New to DineScan?{' '}
              <Link to="/register" className="font-bold text-brand-600 transition hover:text-brand-700 hover:underline">
                Create account
              </Link>
            </p>

            {/* Quick Demo Accounts for Verification & Testing */}
            {/* <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Demo Account
                </span>
                <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  1-Click Fill
                </span>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setEmail('owner@dinescan.com'); setPassword('password123'); }}
                  className="rounded-xl border border-orange-200 bg-orange-50/60 p-3 text-left hover:bg-orange-100/60 hover:border-orange-300 transition shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-sm">DineScan Restaurant Owner</p>
                    <span className="text-[11px] font-semibold text-orange-600 bg-white px-2 py-0.5 rounded-md border border-orange-200">PRO Plan</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">owner@dinescan.com • password123</p>
                </button>
              </div>
            </div> */}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs font-medium text-slate-400">
            <ShieldCheck size={15} strokeWidth={1.8} />
            Secure multi-tenant restaurant access powered by DineScan
          </div>
        </div>
      </section>
    </main>
  );
}
