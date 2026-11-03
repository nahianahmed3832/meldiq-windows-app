import { describe, expect, it } from "vitest";
import { browserLanguage, resolveLanguage, translate } from "../src/i18n";
import { CATALOGS, ENGLISH, missingTranslations } from "../src/i18n/catalog";
import { LANGUAGES, languageDirection } from "../src/i18n/languages";
import { STRINGS } from "../src/i18n/strings";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("interface languages", () => {
  it("has every string in English, Chinese and Bengali, with the same placeholders", () => {
    for (const [key, texts] of Object.entries(STRINGS)) {
      expect(texts, key).toHaveLength(3);
      for (const t of texts) expect(t.trim(), key).not.toBe("");
      expect(placeholders(texts[1]), `${key} (zh-CN)`).toEqual(placeholders(texts[0]));
      expect(placeholders(texts[2]), `${key} (bn)`).toEqual(placeholders(texts[0]));
    }
  });

  it("follows the browser: distinguishes Chinese scripts and selects supported system languages", () => {
    expect(browserLanguage(["zh-TW", "en"])).toBe("zh-TW");
    expect(browserLanguage(["bn-IN"])).toBe("bn");
    expect(browserLanguage(["fr-FR", "bn"])).toBe("fr");
    expect(browserLanguage(["fr-FR"])).toBe("fr");
    expect(browserLanguage([])).toBe("en");
    expect(resolveLanguage("system", ["zh-CN"])).toBe("zh-CN");
    expect(resolveLanguage("bn", ["zh-CN"])).toBe("bn");
  });

  it("fills placeholders and leaves unknown ones as they are", () => {
    expect(translate("en", "verify_sent", { email: "a@b.c" })).toBe("We sent a 6-digit code to a@b.c. It's valid for 15 minutes.");
    expect(translate("zh-CN", "common_password_min", { n: 10 })).toBe("至少 10 个字符。");
    expect(translate("bn", "nav_unread", {})).toBe("{n}টি অপঠিত");
  });
});

it('bundles all requested locales and retains English fallback without changing message text', () => {
  expect(LANGUAGES).toHaveLength(21);
  expect(browserLanguage(['zh-Hant-HK'])).toBe('zh-TW');
  expect(browserLanguage(['pt-PT'])).toBe('pt-BR');
  expect(browserLanguage(['unsupported', 'ja-JP'])).toBe('ja');
  expect(languageDirection('ar')).toBe('rtl'); expect(languageDirection('ur')).toBe('rtl'); expect(languageDirection('bn')).toBe('ltr');
  expect(translate('fr', 'signin_button')).toBe('Se connecter');
  expect(translate('fr', 'verify_sent', { email: 'a@b.c' })).toBe(translate('en', 'verify_sent', { email: 'a@b.c' }));
  expect(missingTranslations('fr')).toContain('verify_sent');
  for (const locale of LANGUAGES) for (const [key, value] of Object.entries(CATALOGS[locale])) expect(placeholders(value)).toEqual(placeholders(ENGLISH[key as keyof typeof ENGLISH]));
});
