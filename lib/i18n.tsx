"use client";

/**
 * Minimal TR/EN switcher for the whole site.
 *
 * Deliberately NOT a keyed translation dictionary (locale/*.json + t("key")) —
 * for a single-page marketing site that would mean maintaining two files in
 * lockstep with every component's JSX, purely to avoid writing the English
 * string next to the Turkish one. Instead `t(tr, en)` takes both strings
 * inline, at the exact spot they're used, so a reviewer sees both languages
 * side by side and nothing can go out of sync with the markup around it.
 *
 * State lives here: current language, persisted to localStorage, and synced
 * onto <html lang> and the tab title so the switch is more than skin-deep.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "tr" | "en";

type LanguageContextValue = {
  lang: Lang;
  toggle: () => void;
  /** `t(turkish, english)` — returns whichever matches the active language. */
  t: (tr: string, en: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "myviptransfer:lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("tr");

  // Restore a saved choice after mount only — the server always renders the
  // Turkish default, so reading localStorage during render would mismatch
  // hydration. A one-frame flash to a saved "en" is an acceptable trade-off
  // for a toggle this small.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "tr" || saved === "en") setLang(saved);
    } catch {
      // localStorage can throw (private mode, blocked storage) — default stands.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === "tr"
        ? "My VIP Transfer | Türkiye Geneli VIP ve Havalimanı Transfer Hizmeti"
        : "My VIP Transfer | Nationwide VIP & Airport Transfer Service in Turkey";
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore — persistence is a nicety, not a requirement
    }
  }, [lang]);

  const toggle = useCallback(() => {
    setLang((current) => (current === "tr" ? "en" : "tr"));
  }, []);

  const t = useCallback((tr: string, en: string) => (lang === "tr" ? tr : en), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
