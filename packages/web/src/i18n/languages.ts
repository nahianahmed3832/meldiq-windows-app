/** Bundled interface locale registry. Partial catalogs fall back to English and are audited before release. */
export const LANGUAGES = ['en', 'bn', 'zh-CN', 'zh-TW', 'hi', 'ur', 'ar', 'id', 'ja', 'ko', 'vi', 'th', 'tr', 'es', 'fr', 'de', 'it', 'pt-BR', 'ru', 'nl', 'pl'] as const;
export type Language = typeof LANGUAGES[number];
export type LanguageChoice = 'system' | Language;
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English', bn: 'বাংলা', 'zh-CN': '简体中文', 'zh-TW': '繁體中文', hi: 'हिन्दी', ur: 'اردو', ar: 'العربية', id: 'Bahasa Indonesia', ja: '日本語', ko: '한국어', vi: 'Tiếng Việt', th: 'ไทย', tr: 'Türkçe', es: 'Español', fr: 'Français', de: 'Deutsch', it: 'Italiano', 'pt-BR': 'Português (Brasil)', ru: 'Русский', nl: 'Nederlands', pl: 'Polski',
};
export function browserLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const normalized = tag.toLowerCase().replaceAll('_', '-');
    if (/^zh(?:-|$)/.test(normalized)) return /(?:^|-)(?:hant|tw|hk|mo)(?:-|$)/.test(normalized) ? 'zh-TW' : 'zh-CN';
    if (/^pt(?:-|$)/.test(normalized)) return 'pt-BR';
    const exact = LANGUAGES.find(l => l.toLowerCase() === normalized);
    if (exact) return exact;
    const base = LANGUAGES.find(l => l.toLowerCase() === normalized.split('-')[0]);
    if (base) return base;
  }
  return 'en';
}
let systemLanguages: readonly string[] | null = null;
export function setSystemLanguages(preferred: readonly string[]) { systemLanguages = [...preferred]; }
export function resolveLanguage(choice: LanguageChoice, preferred?: readonly string[]): Language {
  return choice === 'system' ? browserLanguage(preferred ?? systemLanguages ?? (typeof navigator !== 'undefined' ? navigator.languages : [])) : LANGUAGES.includes(choice) ? choice : 'en';
}
export const languageDirection = (language: Language): 'ltr' | 'rtl' => language === 'ar' || language === 'ur' ? 'rtl' : 'ltr';
