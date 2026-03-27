import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'es' | 'en';
export type FontFamily = 'default' | 'rounded' | 'modern' | 'classic';

export type ThemeAccent = 'carmine' | 'navy' | 'black' | 'forest';
export type XpBarTheme = 'minimalist' | 'neon' | 'gradient' | 'classic' | 'cyber';
export type TextColorScheme = 'white-black' | 'red-blue';

interface AppSettings {
  language: Language;
  fontFamily: FontFamily;
  themeAccent: ThemeAccent;
  xpBarTheme: XpBarTheme;
  xpBarFillColor: string;
  textColorScheme: TextColorScheme;
}

const SETTINGS_KEY = 'app_settings';

export const [AppSettingsProvider, useAppSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>({
    language: 'es',
    fontFamily: 'default',
    themeAccent: 'carmine',
    xpBarTheme: 'gradient',
    xpBarFillColor: '#FFD700',
    textColorScheme: 'white-black',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>;
        const safeLanguage: Language = parsed.language === 'en' ? 'es' : 'es';
        const safeFontFamily: FontFamily =
          parsed.fontFamily === 'rounded' ||
          parsed.fontFamily === 'modern' ||
          parsed.fontFamily === 'classic'
            ? parsed.fontFamily
            : 'default';

        const safeThemeAccent: ThemeAccent =
          parsed.themeAccent === 'navy' ||
          parsed.themeAccent === 'black' ||
          parsed.themeAccent === 'forest'
            ? parsed.themeAccent
            : 'carmine';

        const safeXpBarTheme: XpBarTheme =
          parsed.xpBarTheme === 'neon' ||
          parsed.xpBarTheme === 'classic' ||
          parsed.xpBarTheme === 'cyber' ||
          parsed.xpBarTheme === 'minimalist'
            ? parsed.xpBarTheme
            : 'gradient';

        const safeXpBarFillColor =
          typeof parsed.xpBarFillColor === 'string' && parsed.xpBarFillColor.trim().length > 0
            ? parsed.xpBarFillColor
            : '#FFD700';

        const safeTextColorScheme: TextColorScheme =
          parsed.textColorScheme === 'red-blue' ? 'red-blue' : 'white-black';

        setSettings({
          language: safeLanguage,
          fontFamily: safeFontFamily,
          themeAccent: safeThemeAccent,
          xpBarTheme: safeXpBarTheme,
          xpBarFillColor: safeXpBarFillColor,
          textColorScheme: safeTextColorScheme,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const setLanguage = (language: Language) => {
    const nextLanguage: Language = language === 'en' ? 'es' : 'es';
    saveSettings({ ...settings, language: nextLanguage });
  };

  const setFontFamily = (fontFamily: FontFamily) => {
    saveSettings({ ...settings, fontFamily });
  };

  const setThemeAccent = (themeAccent: ThemeAccent) => {
    console.log('[AppSettings] setThemeAccent', themeAccent);
    saveSettings({ ...settings, themeAccent });
  };

  const setXpBarTheme = (xpBarTheme: XpBarTheme) => {
    console.log('[AppSettings] setXpBarTheme', xpBarTheme);
    saveSettings({ ...settings, xpBarTheme });
  };

  const setXpBarFillColor = (xpBarFillColor: string) => {
    console.log('[AppSettings] setXpBarFillColor', xpBarFillColor);
    saveSettings({ ...settings, xpBarFillColor });
  };

  const setTextColorScheme = (textColorScheme: TextColorScheme) => {
    console.log('[AppSettings] setTextColorScheme', textColorScheme);
    saveSettings({ ...settings, textColorScheme });
  };

  const getTextColors = () => {
    return { primary: '#FFFFFF', secondary: '#FFFFFF' };
  };

  const getFontStyle = () => {
    switch (settings.fontFamily) {
      case 'rounded':
        return { fontFamily: 'System' };
      case 'modern':
        return { fontFamily: 'System' };
      case 'classic':
        return { fontFamily: 'System' };
      default:
        return { fontFamily: 'System' };
    }
  };

  return {
    settings,
    isLoading,
    setLanguage,
    setFontFamily,
    setThemeAccent,
    setXpBarTheme,
    setXpBarFillColor,
    setTextColorScheme,
    getFontStyle,
    getTextColors,
  };
});
