import { STRINGS } from './strings';
import desktop from './desktop-strings.json';
import { LANGUAGES, type Language } from './languages';
import locale0 from './locales/bn.json';
import locale1 from './locales/zh-CN.json';
import locale2 from './locales/zh-TW.json';
import locale3 from './locales/hi.json';
import locale4 from './locales/ur.json';
import locale5 from './locales/ar.json';
import locale6 from './locales/id.json';
import locale7 from './locales/ja.json';
import locale8 from './locales/ko.json';
import locale9 from './locales/vi.json';
import locale10 from './locales/th.json';
import locale11 from './locales/tr.json';
import locale12 from './locales/es.json';
import locale13 from './locales/fr.json';
import locale14 from './locales/de.json';
import locale15 from './locales/it.json';
import locale16 from './locales/pt-BR.json';
import locale17 from './locales/ru.json';
import locale18 from './locales/nl.json';
import locale19 from './locales/pl.json';
export const ENGLISH = {
  ...Object.fromEntries(Object.entries(STRINGS).map(([key, texts]) => [key, texts[0]])) as { [K in keyof typeof STRINGS]: typeof STRINGS[K][0] },
  ...desktop,
  lang_search: 'Search languages',
  lang_partial: 'Some interface text is still in English. Messages are never translated by this setting.',
  lang_system: 'System language',
} as const;
export type StringKey = keyof typeof ENGLISH;
export type Catalog = Partial<Record<StringKey, string>>;
export const CATALOGS: Record<Language, Catalog> = {
  en: ENGLISH,
  'bn': { ...Object.fromEntries(Object.entries(STRINGS).map(([key, texts]) => [key, texts[2]])), ...locale0 },
  'zh-CN': { ...Object.fromEntries(Object.entries(STRINGS).map(([key, texts]) => [key, texts[1]])), ...locale1 },
  'zh-TW': { ...locale2 },
  'hi': { ...locale3 },
  'ur': { ...locale4 },
  'ar': { ...locale5 },
  'id': { ...locale6 },
  'ja': { ...locale7 },
  'ko': { ...locale8 },
  'vi': { ...locale9 },
  'th': { ...locale10 },
  'tr': { ...locale11 },
  'es': { ...locale12 },
  'fr': { ...locale13 },
  'de': { ...locale14 },
  'it': { ...locale15 },
  'pt-BR': { ...locale16 },
  'ru': { ...locale17 },
  'nl': { ...locale18 },
  'pl': { ...locale19 },
};
export function missingTranslations(language: Language): StringKey[] {
  return (Object.keys(ENGLISH) as StringKey[]).filter(key => !CATALOGS[language][key]?.trim());
}
export function localizationCoverage() {
  return LANGUAGES.map(language => ({ language, keys: Object.keys(ENGLISH).length, translated: Object.keys(ENGLISH).length - missingTranslations(language).length, missing: missingTranslations(language) }));
}
