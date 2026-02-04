import { useAppSettings } from '@/contexts/AppSettingsContext';
import { translations } from '@/translations';

export function useTranslation() {
  const { settings } = useAppSettings();
  const t = translations.es;

  return { t, language: settings.language };
}
