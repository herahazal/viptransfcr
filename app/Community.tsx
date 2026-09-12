"use client";

import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useLanguage } from "@/lib/i18n";

/**
 * Corporate & individual plans + popular routes — frontend presentation only.
 *
 * No auth, no database, no payments. Tiers are ruled rows rather than pricing
 * cards, and the route preview is deliberately quiet: it shows what exists
 * without pretending anything is unlocked.
 */

type Tier = {
  name: string;
  price: string;
  note: string;
  includes: string[];
};

/** Editable. */
const TIERS_TR: Tier[] = [
  {
    name: "Bireysel",
    price: "Standart",
    note: "Anlık ihtiyaçlarınız için hızlı ve konforlu çözüm.",
    includes: [
      "7/24 Transfer Desteği",
      "Profesyonel Şoförler",
      "Zamanında Karşılama",
    ],
  },
  {
    name: "Kurumsal",
    price: "Öncelikli",
    note: "Şirketler ve düzenli müşteriler için önceliklendirilmiş hizmet.",
    includes: [
      "Şeffaf Teklif Süreci",
      "Türkiye Genelinde Hizmet",
      "Ekip ve Organizasyon Transferleri",
      "Özel Hesap Yöneticisi",
    ],
  },
];

const TIERS_EN: Tier[] = [
  {
    name: "Individual",
    price: "Standard",
    note: "A fast and comfortable solution for your immediate needs.",
    includes: [
      "24/7 Transfer Support",
      "Professional Drivers",
      "Punctual Meet & Greet",
    ],
  },
  {
    name: "Corporate",
    price: "Priority",
    note: "Prioritised service for companies and regular clients.",
    includes: [
      "Transparent Quote Process",
      "Nationwide Service",
      "Team & Organisation Transfers",
      "Dedicated Account Manager",
    ],
  },
];

/** Editable. Popular routes — not a real-time availability list. */
const PREVIEW_TR = [
  { kind: "Havalimanı", title: "İstanbul Havalimanı → Taksim" },
  { kind: "Havalimanı", title: "Sabiha Gökçen → Kadıköy" },
  { kind: "Şehir Dışı", title: "Antalya Havalimanı → Belek" },
];

const PREVIEW_EN = [
  { kind: "Airport", title: "Istanbul Airport → Taksim" },
  { kind: "Airport", title: "Sabiha Gökçen → Kadıköy" },
  { kind: "Out of Town", title: "Antalya Airport → Belek" },
];

export default function Community() {
  const { lang, t } = useLanguage();
  const tiers = lang === "tr" ? TIERS_TR : TIERS_EN;
  const preview = lang === "tr" ? PREVIEW_TR : PREVIEW_EN;
  const whatsappPrefill = t(
    "Kurumsal transfer anlaşması için bilgi almak istiyorum.",
    "I'd like some information about a corporate transfer agreement.",
  );

  return (
    <section className="editorial community" id="community">
      <div className="editorial-inner">
        <header className="editorial-head">
          <p className="editorial-label">{t("Kurumsal Çözümler", "Corporate Solutions")}</p>
          <h2 className="editorial-title">
            {t("Bireysel ve", "Individual &")} <br />
            {t("Kurumsal Çözümler", "Corporate Solutions")}
          </h2>
          <p className="editorial-lede">
            {t(
              "My VIP Transfer, yolculuğunuzun her adımında güven, konfor ve profesyonellik sunar. Havalimanı karşılamadan şehirler arası transfere kadar tüm ulaşım ihtiyaçlarınız için planlı, dakik ve özel çözümler üretir.",
              "My VIP Transfer offers trust, comfort and professionalism at every step of your journey. From airport meet-and-greet to intercity transfer, we build planned, punctual and private solutions for all your transport needs.",
            )}
          </p>
        </header>

        <div className="community-grid">
          <div className="tiers">
            {tiers.map((tier) => (
              <div className="tier" key={tier.name}>
                <div className="tier-head">
                  <h3 className="tier-name">{tier.name}</h3>
                  <span className="tier-price">{tier.price}</span>
                </div>
                <p className="tier-note">{tier.note}</p>
                <ul className="tier-list">
                  {tier.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="preview">
            <p className="editorial-label">{t("Popüler Rotalar", "Popular Routes")}</p>
            <ul className="preview-list">
              {preview.map((item) => (
                <li className="preview-row" key={item.title}>
                  <span className="preview-kind">{item.kind}</span>
                  <span className="preview-title">{item.title}</span>
                  <span
                    className="preview-lock"
                    aria-label={t("Popüler rota", "Popular route")}
                  >
                    ·
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="community-actions">
          <a className="editorial-button" href="#start">
            {t("Kurumsal Teklif Al", "Get a Corporate Quote")}
          </a>
          <a
            className="editorial-button editorial-button-quiet"
            href={buildWhatsAppLink(whatsappPrefill)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("WhatsApp ile İletişime Geç", "Contact Us on WhatsApp")}
          </a>
          <p className="community-note">
            {t(
              "Kurumsal anlaşmalar ve özel teklifler için bizimle iletişime geçin.",
              "Get in touch with us for corporate agreements and private quotes.",
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
