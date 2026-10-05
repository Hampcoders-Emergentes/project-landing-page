import { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from "astro:i18n";
import en from "./en.json";
import es from "./es.json";

export const languages = {
  es: "Español",
  en: "English",
} as const;

export type Lang = keyof typeof languages;
export type Dictionary = typeof es;

export const defaultLang: Lang = "es";
export const locales = Object.keys(languages) as Lang[];

// Typed against the Spanish source so a missing English key fails type-checking.
const dictionaries: Record<Lang, Dictionary> = { es, en };

/** BCP 47 tags used for `<html lang>` and number formatting. */
const intlLocales: Record<Lang, string> = {
  es: "es-PE",
  en: "en-US",
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && Object.hasOwn(languages, value);
}

export function getLangFromUrl(url: URL): Lang {
  const [, segment] = url.pathname.split("/");
  return isLang(segment) ? segment : defaultLang;
}

/** Returns the localized string dictionary for a language. */
export function useTranslations(lang: Lang): Dictionary {
  return dictionaries[lang];
}

export function getIntlLocale(lang: Lang): string {
  return intlLocales[lang];
}

/** `/` for Spanish, `/en/` for English (see `i18n` in astro.config.mjs). */
export function getLocalizedPath(lang: Lang, path = ""): string {
  return getRelativeLocaleUrl(lang, path);
}

/** Localized slugs of each page; files live at src/pages/<slug>.astro and src/pages/en/<slug>.astro. */
export const routes = {
  home: { es: "", en: "" },
  segments: { es: "segmentos", en: "segments" },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteId = keyof typeof routes;

export function getRoutePath(route: RouteId, lang: Lang): string {
  return getRelativeLocaleUrl(lang, routes[route][lang]);
}

export function getRouteUrl(route: RouteId, lang: Lang): string {
  return getAbsoluteLocaleUrl(lang, routes[route][lang]);
}

/** Link to a landing-page section from the current page. */
export function sectionHref(current: RouteId, lang: Lang, sectionId: string): string {
  return current === "home" ? `#${sectionId}` : `${getRoutePath("home", lang)}#${sectionId}`;
}

export function formatNumber(lang: Lang, value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(intlLocales[lang], {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatSoles(lang: Lang, value: number): string {
  return `S/ ${formatNumber(lang, value)}`;
}
