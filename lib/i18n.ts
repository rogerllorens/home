import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'es';

const messageMap: Record<AppLocale, Record<string, any>> = {
  es: esMessages,
  en: enMessages
};

export function getMessages(locale: string | undefined): Record<string, any> {
  if (locale && (SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return messageMap[locale as AppLocale];
  }
  return messageMap[DEFAULT_LOCALE];
}
