import { Languages } from 'lucide-react';
import { useState } from 'react';
import { setPrefs, usePrefs } from '../../application/prefs';
import { LANGUAGE_NAMES, LANGUAGES, type LanguageChoice, useT } from '../../i18n';
/** Native select keeps keyboard and screen-reader behavior; search filters names and locale codes. */
export function LanguagePicker({ className = '' }: { className?: string }) {
  const { language } = usePrefs();
  const [query, setQuery] = useState('');
  const t = useT();
  const search = query.trim().toLocaleLowerCase();
  const names = new Intl.DisplayNames(['en'], { type: 'language' });
  const choices = LANGUAGES.filter(l => l === language || `${l} ${LANGUAGE_NAMES[l]} ${names.of(l) ?? ''}`.toLocaleLowerCase().includes(search));
  return <div className={`lang-picker ${className}`.trim()}>
    <Languages size={15} aria-hidden="true" />
    <input type="search" className="input lang-search" value={query} onChange={e => setQuery(e.target.value)} aria-label={t('lang_search')} placeholder={t('lang_search')} />
    <select aria-label={t('lang_label')} value={language} onChange={e => { setPrefs({ language: e.target.value as LanguageChoice }); setQuery(''); }}>
      <option value="system">{t('lang_system')}</option>
      {choices.map(l => <option key={l} value={l} lang={l}>{LANGUAGE_NAMES[l]}</option>)}
    </select>
  </div>;
}
