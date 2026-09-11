import { useState, useRef, useEffect } from 'react';
import { Palette, Check, RotateCcw, Sparkles, X, ChevronDown, Save } from 'lucide-react';
import { useTheme, THEME_PRESETS, DEFAULT_THEME_COLOR } from '@/lib/theme-context';

interface ThemeColorPickerProps {
  mode?: 'dropdown' | 'inline' | 'compact';
  className?: string;
  onColorSelect?: (hex: string) => void;
}

export function ThemeColorPicker({ mode = 'inline', className = '', onColorSelect }: ThemeColorPickerProps) {
  const {
    themeColor,
    savedColor,
    setThemeColor,
    saveTheme,
    resetTheme,
    isCustom,
    hasUnsavedChanges,
    presets,
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState(themeColor);
  const [justSaved, setJustSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomInput(themeColor);
  }, [themeColor]);

  useEffect(() => {
    if (mode !== 'dropdown') return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mode]);

  const handleSelectColor = (hex: string) => {
    setThemeColor(hex);
    setCustomInput(hex);
    setJustSaved(false);
    if (onColorSelect) onColorSelect(hex);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    setJustSaved(false);
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
      setThemeColor(val);
      if (onColorSelect) onColorSelect(val);
    }
  };

  const handleSave = () => {
    saveTheme(themeColor);
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
    }, 2500);
  };

  const handleReset = () => {
    resetTheme();
    setCustomInput(DEFAULT_THEME_COLOR);
    setJustSaved(false);
  };

  const pickerContent = (
    <div className="w-[330px] rounded-2xl border border-slate-200/90 bg-white/98 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-xs transition-colors"
            style={{ backgroundColor: themeColor }}
          >
            <Sparkles size={14} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Theme Color Picker</h4>
            <p className="text-[11px] text-slate-500">Pick any color & save permanently</p>
          </div>
        </div>
        {mode === 'dropdown' && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Preset Swatches */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Color Preset
          </label>
          <span className="text-[10px] font-semibold text-slate-400">
            {presets.length} Colors
          </span>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {presets.map((preset) => {
            const isSelected = themeColor.toUpperCase() === preset.hex.toUpperCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectColor(preset.hex)}
                className={`group relative flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all hover:bg-slate-50 ${
                  isSelected ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                }`}
                title={`${preset.name} (${preset.badge})`}
              >
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105 group-active:scale-95"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <Check size={14} className="text-white drop-shadow-sm stroke-[3]" />}
                </div>
                <span className="text-[9px] font-bold text-slate-600 truncate max-w-[48px]">
                  {preset.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Input & Native Color Picker */}
      <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Custom Color Wheel / HEX Code
        </label>
        <div className="mt-2 flex items-center gap-2">
          {/* Native Color Picker Circle */}
          <div
            className="relative h-10 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-xs cursor-pointer"
            style={{ backgroundColor: themeColor }}
          >
            <input
              type="color"
              value={themeColor}
              onChange={(e) => handleSelectColor(e.target.value)}
              className="absolute -inset-3 h-16 w-20 cursor-pointer opacity-0"
              title="Click to open full color wheel"
            />
          </div>

          {/* HEX Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={customInput}
              onChange={handleInputChange}
              placeholder="#F97316"
              maxLength={7}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-semibold uppercase text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </div>

      {/* Save Button Bar — Prominent action so user can save permanently */}
      <div className="mt-3.5 space-y-2">
        <button
          type="button"
          onClick={handleSave}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-98 hover:brightness-105"
          style={{ backgroundColor: themeColor }}
        >
          {justSaved ? (
            <>
              <Check size={16} className="stroke-[3]" />
              <span>Theme Saved Successfully! (Persisted)</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>Save Theme Color</span>
              {hasUnsavedChanges && (
                <span className="ml-1 rounded-full bg-white/30 px-1.5 py-0.2 text-[9px] uppercase tracking-wide">
                  Unsaved
                </span>
              )}
            </>
          )}
        </button>

        {/* Live Info & Reset */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-slate-300 shadow-xs"
              style={{ backgroundColor: themeColor }}
            />
            <span className="font-mono font-bold text-slate-700">
              {themeColor.toUpperCase()}
            </span>
            {isCustom && (
              <span className="rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                Custom
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={!isCustom}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-bold transition ${
              isCustom
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title="Reset theme to DineScan Orange"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (mode === 'inline') {
    return <div className={`w-full max-w-md ${className}`}>{pickerContent}</div>;
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95"
        title="Change App Theme Color"
      >
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full shadow-xs"
          style={{ backgroundColor: themeColor }}
        />
        <Palette size={14} className="text-slate-500" />
        <span className="hidden sm:inline text-xs font-bold">Theme</span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 origin-top-right">
          {pickerContent}
        </div>
      )}
    </div>
  );
}

/**
 * Floating Theme Switcher Widget
 * Floats in bottom-right corner across all pages (Customer Menu, Login, Admin, Kitchen)
 */
export function FloatingThemeSwitcher() {
  const { themeColor } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end pointer-events-auto select-none"
    >
      {/* Expanded Color Picker Card */}
      {expanded && (
        <div className="mb-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-200">
          <ThemeColorPicker mode="inline" />
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group flex items-center gap-2 rounded-full border-2 border-white bg-slate-900/90 pl-3 pr-4 py-2 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-105 hover:bg-slate-900 active:scale-95 ring-2 ring-black/10 cursor-pointer"
        title="Change Theme Color"
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-xs ring-2 ring-white/50 group-hover:rotate-45 transition-transform"
          style={{ backgroundColor: themeColor }}
        >
          <Palette size={11} className="text-white drop-shadow-xs" />
        </span>
        <span className="text-xs font-bold tracking-tight">Theme Color</span>
        {expanded ? <X size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
    </div>
  );
}
