import { useCallback } from 'react';
import { usePrefs } from '../application/prefs';
import { resolveLanguage, type Language } from './languages';
import { CATALOGS, ENGLISH, type StringKey } from './catalog';
export { browserLanguage, LANGUAGE_NAMES, LANGUAGES, resolveLanguage, languageDirection, setSystemLanguages, type Language, type LanguageChoice } from './languages';
export { missingTranslations, localizationCoverage } from './catalog';
/** Missing keys fall back at lookup time, keeping resource completeness measurable. */
export function translate(lang: Language, key: StringKey, vars?: Record<string, string | number>): string {
  const text = CATALOGS[lang]?.[key] || ENGLISH[key];
  return vars ? text.replace(/\{(\w+)\}/g, (match, name: string) => Object.hasOwn(vars, name) ? String(vars[name]) : match) : text;
}
export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string;
export function useT(): Translate {
  const language = useLanguage();
  return useCallback((key, vars) => translate(language, key, vars), [language]);
}
export function useLanguage(): Language { return resolveLanguage(usePrefs().language); }
export type { StringKey };
