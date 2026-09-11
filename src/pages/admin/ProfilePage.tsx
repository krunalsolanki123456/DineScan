import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  Building2, Clock3, Image as ImageIcon, MapPin, Save,
  Upload, Trash2, Link2, Camera, Loader2, Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { updateRestaurant } from '@/lib/services';
import { compressImageFile } from '@/lib/image-upload';
import { PageHeader, inputClass, labelClass } from '@/components/admin/PageBits';
import { Toast } from '@/components/ui';

export default function ProfilePage() {
  const { restaurant, refreshRestaurant } = useAuth();
  const [form, setForm] = useState<Record<string, any>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (restaurant) setForm({ ...restaurant });
  }, [restaurant?.id, restaurant?.updated_at]);

  if (!restaurant) return null;

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Handle Logo file processing
  const handleLogoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please upload a valid image file (PNG, JPG, WebP)', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Logo file size must be less than 5MB', type: 'error' });
      return;
    }
    setUploadingLogo(true);
    try {
      // Compress to max 500x500 for crisp logo
      const dataUrl = await compressImageFile(file, 500, 500, 0.88);
      update('logo_url', dataUrl);
      setToast({ message: 'Brand logo uploaded. Remember to Save Changes!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to process logo image', type: 'error' });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle Cover file processing
  const handleCoverFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please upload a valid image file (PNG, JPG, WebP)', type: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'Cover file size must be less than 10MB', type: 'error' });
      return;
    }
    setUploadingCover(true);
    try {
      // Compress to max 1400x700 for banner
      const dataUrl = await compressImageFile(file, 1400, 700, 0.82);
      update('cover_url', dataUrl);
      setToast({ message: 'Cover image uploaded. Remember to Save Changes!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to process cover image', type: 'error' });
    } finally {
      setUploadingCover(false);
    }
  };

  const onLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleLogoFile(file);
  };

  const onCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleCoverFile(file);
  };

  // Drag and drop handlers
  const handleDrop = (e: DragEvent<HTMLDivElement>, type: 'logo' | 'cover') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setLogoDragOver(false);
    else setCoverDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (type === 'logo') void handleLogoFile(file);
      else void handleCoverFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, type: 'logo' | 'cover') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setLogoDragOver(true);
    else setCoverDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>, type: 'logo' | 'cover') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setLogoDragOver(false);
    else setCoverDragOver(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateRestaurant(restaurant.id, {
        name: form.name,
        description: form.description,
        type: form.type,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        gst_number: form.gst_number,
        opening_time: form.opening_time,
        closing_time: form.closing_time,
        cuisines: form.cuisines,
        logo_url: form.logo_url,
        cover_url: form.cover_url,
      });
      if (updated) {
        setForm({ ...updated });
      }
      await refreshRestaurant();
      setToast({ message: 'Restaurant profile updated successfully!', type: 'success' });
    } catch {
      setToast({ message: 'Could not update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Profile"
        description="Manage your brand logo, cover banner, and the information customers see on your QR menu."
        actions={
          <button
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left Column: Forms */}
        <div className="space-y-6">
          {/* Brand Media (Logo & Cover Upload) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <ImageIcon size={19} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Brand Images & Media</h3>
                  <p className="text-xs text-slate-500">Upload your logo and cover banner for customer menus</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* 1. Brand Logo Upload */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800">Brand Logo / Profile Image</label>
                  <button
                    type="button"
                    onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Link2 size={13} />
                    {showLogoUrlInput ? 'Hide URL input' : 'Paste Image URL instead'}
                  </button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Logo Preview box */}
                  <div
                    onDragOver={(e) => handleDragOver(e, 'logo')}
                    onDragLeave={(e) => handleDragLeave(e, 'logo')}
                    onDrop={(e) => handleDrop(e, 'logo')}
                    className={`relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 transition ${
                      logoDragOver
                        ? 'border-brand-500 bg-orange-50'
                        : 'border-dashed border-slate-300 bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    {uploadingLogo ? (
                      <div className="flex flex-col items-center gap-1 text-xs text-brand-600">
                        <Loader2 size={22} className="animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    ) : form.logo_url ? (
                      <div className="group relative h-full w-full">
                        <img
                          src={form.logo_url}
                          alt="Brand Logo"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="rounded-full bg-white/90 p-1.5 text-slate-700 shadow hover:bg-white"
                            title="Change Logo"
                          >
                            <Camera size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-2 text-center text-slate-400">
                        <Camera size={24} />
                        <span className="text-[11px] font-medium leading-tight">No Logo</span>
                      </div>
                    )}
                  </div>

                  {/* Logo Controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onLogoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingLogo}
                        onClick={() => logoInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                      >
                        <Upload size={14} className="text-brand-500" />
                        {form.logo_url ? 'Change Logo' : 'Upload Logo'}
                      </button>

                      {form.logo_url && (
                        <button
                          type="button"
                          onClick={() => update('logo_url', '')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">
                      Recommended: Square image (1:1 ratio), 500×500px. Supports PNG, JPG, WebP up to 5MB.
                    </p>

                    {showLogoUrlInput && (
                      <div className="pt-2">
                        <input
                          className={inputClass}
                          value={form.logo_url || ''}
                          onChange={(e) => update('logo_url', e.target.value)}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Cover Image Upload */}
              <div className="border-t border-slate-100 pt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800">Cover Banner Image</label>
                  <button
                    type="button"
                    onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Link2 size={13} />
                    {showCoverUrlInput ? 'Hide URL input' : 'Paste Image URL instead'}
                  </button>
                </div>

                {/* Cover dropzone / preview */}
                <div
                  onDragOver={(e) => handleDragOver(e, 'cover')}
                  onDragLeave={(e) => handleDragLeave(e, 'cover')}
                  onDrop={(e) => handleDrop(e, 'cover')}
                  className={`group relative flex h-44 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 transition ${
                    coverDragOver
                      ? 'border-brand-500 bg-orange-50'
                      : 'border-dashed border-slate-300 bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onCoverChange}
                    className="hidden"
                  />

                  {uploadingCover ? (
                    <div className="flex flex-col items-center gap-2 text-sm text-brand-600">
                      <Loader2 size={28} className="animate-spin" />
                      <span className="font-medium">Uploading cover image...</span>
                    </div>
                  ) : form.cover_url ? (
                    <>
                      <img
                        src={form.cover_url}
                        alt="Cover Banner"
                        className="h-full w-full object-cover"
                      />
                      {/* Overlay actions on hover */}
                      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md transition hover:bg-slate-100"
                        >
                          <Camera size={15} className="text-brand-500" />
                          Change Banner
                        </button>
                        <button
                          type="button"
                          onClick={() => update('cover_url', '')}
                          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-red-700"
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                        <Upload size={22} className="text-brand-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Drag and drop your cover image here, or{' '}
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="text-brand-600 hover:underline"
                          >
                            browse files
                          </button>
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Recommended size: 1200×500px (16:9 or 3:1 ratio). PNG, JPG, WebP up to 10MB.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {showCoverUrlInput && (
                  <div className="mt-3">
                    <input
                      className={inputClass}
                      value={form.cover_url || ''}
                      onChange={(e) => update('cover_url', e.target.value)}
                      placeholder="https://example.com/cover-banner.jpg"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Basic Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Building2 size={19} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Basic Information</h3>
                <p className="text-xs text-slate-500">General business details</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Restaurant Name</label>
                <input
                  className={inputClass}
                  value={form.name || ''}
                  onChange={(e) => update('name', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Restaurant Type</label>
                <select
                  className={inputClass}
                  value={form.type || 'restaurant'}
                  onChange={(e) => update('type', e.target.value)}
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="hotel">Hotel</option>
                  <option value="food_court">Food Court</option>
                  <option value="cloud_kitchen">Cloud Kitchen</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Cuisines</label>
                <input
                  className={inputClass}
                  value={form.cuisines || ''}
                  onChange={(e) => update('cuisines', e.target.value)}
                  placeholder="North Indian • Chinese • Fast Food"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.description || ''}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Short description of your dining experience..."
                />
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  className={inputClass}
                  value={form.phone || ''}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  className={inputClass}
                  value={form.email || ''}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="contact@restaurant.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>GST Number (Optional)</label>
                <input
                  className={inputClass}
                  value={form.gst_number || ''}
                  onChange={(e) => update('gst_number', e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>
          </section>

          {/* Location & Hours */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MapPin size={19} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Location & Operating Hours</h3>
                <p className="text-xs text-slate-500">Address and working schedule</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Address</label>
                <input
                  className={inputClass}
                  value={form.address || ''}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Street address, landmark"
                />
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input
                  className={inputClass}
                  value={form.city || ''}
                  onChange={(e) => update('city', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>State</label>
                <input
                  className={inputClass}
                  value={form.state || ''}
                  onChange={(e) => update('state', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Pincode</label>
                <input
                  className={inputClass}
                  value={form.pincode || ''}
                  onChange={(e) => update('pincode', e.target.value)}
                />
              </div>

              <div></div>

              <div>
                <label className={labelClass}>Opening Time</label>
                <input
                  type="time"
                  className={inputClass}
                  value={form.opening_time || '09:00'}
                  onChange={(e) => update('opening_time', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Closing Time</label>
                <input
                  type="time"
                  className={inputClass}
                  value={form.closing_time || '23:00'}
                  onChange={(e) => update('closing_time', e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Live Card Preview & Quick Status */}
        <aside className="h-fit space-y-5 xl:sticky xl:top-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">Customer View Preview</h3>
            <p className="mt-0.5 text-xs text-slate-500">How diners see your brand on their phone</p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Cover */}
              <div className="relative h-36 w-full overflow-hidden bg-gradient-to-r from-orange-400 to-orange-600">
                {form.cover_url ? (
                  <img src={form.cover_url} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                    No Cover Image Uploaded
                  </div>
                )}
                {/* Live Open tag */}
                <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                  OPEN
                </div>
              </div>

              {/* Card Body */}
              <div className="relative z-10 p-4">
                {/* Logo Badge - elevated above banner */}
                <div className="relative z-20 -mt-12 mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-orange-50 shadow-md">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <img src="/favicon.png" alt="DineScan" className="h-10 w-10 object-contain" />
                  )}
                </div>

                <h4 className="truncate text-base font-black text-slate-900">
                  {form.name || 'Restaurant Name'}
                </h4>
                <p className="truncate text-xs text-slate-500">
                  {form.cuisines || 'Cuisines list'}
                </p>

                <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <Clock3 size={13} className="text-orange-500" />
                  <span>
                    {form.opening_time || '09:00'} – {form.closing_time || '23:00'}
                  </span>
                </div>

                {form.address && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-400">
                    <MapPin size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{form.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-orange-50 p-3 text-xs text-orange-800">
              <p className="font-semibold">💡 Pro Tip:</p>
              <p className="mt-0.5 text-[11px] text-orange-700">
                High resolution brand images significantly improve diner engagement and order conversion rates!
              </p>
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
