import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  hex: string;
  badge: string;
}

export const DEFAULT_THEME_COLOR = '#F97316';

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'orange', name: 'Sunset Orange', hex: '#F97316', badge: 'Default' },
  { id: 'blue', name: 'Sapphire Blue', hex: '#2563EB', badge: 'Modern' },
  { id: 'emerald', name: 'Emerald Mint', hex: '#10B981', badge: 'Fresh' },
  { id: 'purple', name: 'Royal Violet', hex: '#8B5CF6', badge: 'Luxury' },
  { id: 'rose', name: 'Crimson Rose', hex: '#E11D48', badge: 'Warm' },
  { id: 'indigo', name: 'Indigo Night', hex: '#4F46E5', badge: 'Tech' },
  { id: 'amber', name: 'Golden Amber', hex: '#D97706', badge: 'Classic' },
  { id: 'teal', name: 'Pacific Teal', hex: '#0D9488', badge: 'Cool' },
  { id: 'pink', name: 'Electric Pink', hex: '#EC4899', badge: 'Vibrant' },
  { id: 'cyan', name: 'Cyan Breeze', hex: '#06B6D4', badge: 'Clean' },
];

interface ThemeContextType {
  themeColor: string;
  savedColor: string;
  setThemeColor: (color: string) => void;
  saveTheme: (color?: string) => void;
  resetTheme: () => void;
  isCustom: boolean;
  hasUnsavedChanges: boolean;
  presets: ThemePreset[];
  syncWithRestaurant: (hexColor?: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_STORAGE_KEY = 'dinescan_theme_color';

// Exact default Tailwind orange RGB triplets
const DEFAULT_ORANGE_SHADES: Record<string, string> = {
  50: '255 247 237',
  100: '255 237 213',
  200: '254 215 170',
  300: '253 186 116',
  400: '251 146 60',
  500: '249 115 22',
  600: '234 88 12',
  700: '194 65 12',
  800: '154 52 18',
  900: '124 45 18',
  950: '67 20 7',
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hNorm = (h % 360) / 360;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tAdj = t;
    if (tAdj < 0) tAdj += 1;
    if (tAdj > 1) tAdj -= 1;
    if (tAdj < 1 / 6) return p + (q - p) * 6 * tAdj;
    if (tAdj < 1 / 2) return q;
    if (tAdj < 2 / 3) return p + (q - p) * (2 / 3 - tAdj) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hNorm) * 255);
  const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255);

  return { r, g, b };
}

export function generatePalette(hex: string): Record<string, string> {
  // If exact default orange, return pristine default Tailwind values
  if (hex.toUpperCase() === '#F97316') {
    return DEFAULT_ORANGE_SHADES;
  }

  const rgb = hexToRgb(hex);
  if (!rgb) return DEFAULT_ORANGE_SHADES;

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Calibrate lightness scales relative to base lightness
  const scale = [
    { key: '50', l: 0.96, sMult: 0.8 },
    { key: '100', l: 0.91, sMult: 0.85 },
    { key: '200', l: 0.82, sMult: 0.9 },
    { key: '300', l: 0.70, sMult: 0.95 },
    { key: '400', l: 0.58, sMult: 1 },
    { key: '500', l: Math.min(Math.max(l, 0.42), 0.58), sMult: 1, exactRgb: rgb },
    { key: '600', l: Math.max(0.12, l * 0.88), sMult: 1 },
    { key: '700', l: Math.max(0.10, l * 0.74), sMult: 1 },
    { key: '800', l: Math.max(0.07, l * 0.58), sMult: 0.95 },
    { key: '900', l: Math.max(0.05, l * 0.44), sMult: 0.9 },
    { key: '950', l: Math.max(0.03, l * 0.28), sMult: 0.85 },
  ];

  const palette: Record<string, string> = {};

  scale.forEach(item => {
    if (item.exactRgb) {
      palette[item.key] = `${item.exactRgb.r} ${item.exactRgb.g} ${item.exactRgb.b}`;
    } else {
      const adjustedS = Math.min(1, Math.max(0, s * item.sMult));
      const rgbVal = hslToRgb(h, adjustedS, item.l);
      palette[item.key] = `${rgbVal.r} ${rgbVal.g} ${rgbVal.b}`;
    }
  });

  return palette;
}

export function applyThemeVariables(hex: string) {
  if (typeof document === 'undefined') return;

  const palette = generatePalette(hex);
  const root = document.documentElement;

  Object.entries(palette).forEach(([shade, rgbChannels]) => {
    root.style.setProperty(`--color-brand-${shade}`, rgbChannels);
  });

  root.style.setProperty('--primary-color', hex);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read initial saved color from localStorage
  const getInitialSaved = (): string => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved && hexToRgb(saved)) {
          return saved;
        }
      } catch {}
    }
    return DEFAULT_THEME_COLOR;
  };

  const [savedColor, setSavedColor] = useState<string>(getInitialSaved);
  const [themeColor, setThemeColorState] = useState<string>(getInitialSaved);

  // Apply CSS variables whenever themeColor changes
  useEffect(() => {
    applyThemeVariables(themeColor);
  }, [themeColor]);

  // Preview or select color
  const setThemeColor = (color: string) => {
    const clean = color.startsWith('#') ? color : `#${color}`;
    if (hexToRgb(clean)) {
      setThemeColorState(clean);
      // Also write to localStorage so even if they don't explicitly click save,
      // the chosen color is never lost on refresh!
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, clean);
          setSavedColor(clean);
        } catch {}
      }
    }
  };

  // Explicit Save function
  const saveTheme = (colorToSave?: string) => {
    const target = colorToSave || themeColor;
    const clean = target.startsWith('#') ? target : `#${target}`;
    if (hexToRgb(clean)) {
      setThemeColorState(clean);
      setSavedColor(clean);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, clean);
        } catch {}
      }
    }
  };

  const resetTheme = () => {
    setThemeColorState(DEFAULT_THEME_COLOR);
    setSavedColor(DEFAULT_THEME_COLOR);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } catch {}
    }
    applyThemeVariables(DEFAULT_THEME_COLOR);
  };

  const syncWithRestaurant = (hexColor?: string | null) => {
    if (hexColor && hexToRgb(hexColor)) {
      // Only set if not already customized in localStorage
      const currentSaved = typeof window !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
      if (!currentSaved) {
        setThemeColorState(hexColor);
        setSavedColor(hexColor);
      }
    }
  };

  const isCustom = useMemo(() => {
    return themeColor.toUpperCase() !== DEFAULT_THEME_COLOR.toUpperCase();
  }, [themeColor]);

  const hasUnsavedChanges = useMemo(() => {
    return themeColor.toUpperCase() !== savedColor.toUpperCase();
  }, [themeColor, savedColor]);

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        savedColor,
        setThemeColor,
        saveTheme,
        resetTheme,
        isCustom,
        hasUnsavedChanges,
        presets: THEME_PRESETS,
        syncWithRestaurant,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
