import colors from '@/constants/colors';
import type { ThemeAccent } from '@/contexts/AppSettingsContext';

export const THEME_ACCENTS = {
  carmine: {
    label: 'Carmine Red',
    color: '#960018',
    gradientStart: '#960018',
    gradientEnd: '#5e000f',
  },
  navy: {
    label: 'Dark Blue',
    color: '#001F3F',
    gradientStart: '#001F3F',
    gradientEnd: '#001122',
  },
  black: {
    label: 'Pure Black',
    color: '#000000',
    gradientStart: '#000000',
    gradientEnd: '#1a1a1a',
  },
  forest: {
    label: 'Dark Green',
    color: '#013220',
    gradientStart: '#013220',
    gradientEnd: '#001a11',
  },
} as const satisfies Record<ThemeAccent, { label: string; color: string; gradientStart: string; gradientEnd: string }>;

export type AppTheme = {
  dark: {
    background: string;
    surface: string;
    surfaceSecondary: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentDark: string;
    accentLight: string;
    success: string;
    warning: string;
    error: string;
    border: string;
    gold: string;
    silver: string;
    bronze: string;
    gradientStart: string;
    gradientEnd: string;
  };
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace('#', '').trim();
  if (!(raw.length === 6 || raw.length === 3)) return null;
  const normalized = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  const toHex = (v: number) => Math.round(clamp01(v / 255) * 255).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixHex(base: string, withColor: string, t: number) {
  const a = hexToRgb(base);
  const b = hexToRgb(withColor);
  if (!a || !b) return base;
  return rgbToHex({
    r: mix(a.r, b.r, t),
    g: mix(a.g, b.g, t),
    b: mix(a.b, b.b, t),
  });
}

export function getTheme(accent: ThemeAccent): AppTheme {
  const accentColor = THEME_ACCENTS[accent]?.color ?? THEME_ACCENTS.carmine.color;
  const base = colors.dark;

  const accentDark = mixHex(accentColor, '#000000', 0.22);
  const accentLight = mixHex(accentColor, '#FFFFFF', 0.18);

  const themeData = THEME_ACCENTS[accent] ?? THEME_ACCENTS.carmine;

  return {
    dark: {
      ...base,
      accent: accentColor,
      accentDark,
      accentLight,
      gradientStart: themeData.gradientStart,
      gradientEnd: themeData.gradientEnd,
    },
  };
}
