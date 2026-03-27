import { useMemo } from 'react';
import { getTheme } from '@/constants/theme';
import { useAppSettings } from '@/contexts/AppSettingsContext';

export function useTheme() {
  const { settings } = useAppSettings();

  const theme = useMemo(() => {
    console.log('[useTheme] computing theme for accent', settings.themeAccent);
    return getTheme(settings.themeAccent);
  }, [settings.themeAccent]);

  return theme;
}
