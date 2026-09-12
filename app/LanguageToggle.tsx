"use client";

import { useLanguage } from "@/lib/i18n";

/**
 * The site's only language control. Shows both options at once (rather than
 * a single button naming the *other* language) so a first-time visitor can
 * tell at a glance this is a switch, not a label.
 */
export default function LanguageToggle() {
  const { lang, toggle } = useLanguage();

  return (
    <button
      type="button"
      className="lang-toggle"
      onClick={toggle}
      aria-label={lang === "tr" ? "Switch to English" : "Türkçeye geç"}
    >
      <span className={lang === "tr" ? "is-active" : undefined}>TR</span>
      <span className="lang-toggle-sep" aria-hidden>
        /
      </span>
      <span className={lang === "en" ? "is-active" : undefined}>EN</span>
    </button>
  );
}
