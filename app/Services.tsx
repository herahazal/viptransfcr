"use client";

import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useLanguage } from "@/lib/i18n";

/**
 * Services — an editorial index, not a card grid.
 *
 * Reads as a numbered table of contents in the site's own display serif, on the
 * dark surface PlaneOutro already fades into. No new colours, no panels, no
 * shadows: the only structure is the hairline rule the footer already uses.
 */

type Service = {
  title: string;
  summary: string;
  categories: string[];
};

/** Editable. Order here is the order on the page. */
const SERVICES_TR: Service[] = [
  {
    title: "İstanbul Havalimanı Transfer",
    summary:
      "İstanbul Havalimanı'ndan otelinize, evinize veya iş adresinize konforlu ve güvenli ulaşım sağlayın. Profesyonel şoförlerimiz uçuş saatinize göre transfer sürecinizi planlar.",
    categories: ["Havalimanı", "Karşılama", "VIP"],
  },
  {
    title: "Sabiha Gökçen Havalimanı Transfer",
    summary:
      "Anadolu Yakası ve çevre illere hızlı, güvenilir ve konforlu transfer hizmeti sunuyoruz. Uçuş bilgilerinize göre zamanında karşılama yapılır.",
    categories: ["Havalimanı", "Karşılama", "Anadolu Yakası"],
  },
  {
    title: "Türkiye Geneli VIP Transfer",
    summary:
      "İstanbul, Antalya, Bodrum, İzmir, Ankara, Bursa ve Türkiye'nin birçok noktasında özel VIP transfer hizmeti alabilirsiniz.",
    categories: ["İstanbul", "Antalya", "Bodrum"],
  },
  {
    title: "Şehirler Arası Transfer",
    summary:
      "Şehirler arası yolculuklarınızda konforlu araçlar ve deneyimli şoförlerle güvenli ulaşım deneyimi yaşayın.",
    categories: ["Şehirler Arası", "Konfor", "Güven"],
  },
  {
    title: "Özel Şoförlü Araç",
    summary:
      "İş toplantıları, özel davetler, şehir içi programlar ve günlük ulaşım ihtiyaçları için şoförlü araç hizmeti sunuyoruz.",
    categories: ["Şoförlü Araç", "Günlük", "Özel"],
  },
  {
    title: "Kurumsal Transfer",
    summary:
      "Şirket misafirleri, yöneticiler, ekip transferleri ve organizasyonlar için profesyonel kurumsal ulaşım çözümleri sağlıyoruz.",
    categories: ["Kurumsal", "Ekip", "Organizasyon"],
  },
];

const SERVICES_EN: Service[] = [
  {
    title: "Istanbul Airport Transfer",
    summary:
      "Comfortable, secure transport from Istanbul Airport to your hotel, home or business address. Our professional drivers plan the transfer around your flight time.",
    categories: ["Airport", "Meet & Greet", "VIP"],
  },
  {
    title: "Sabiha Gökçen Airport Transfer",
    summary:
      "Fast, reliable and comfortable transfers to the Anatolian side and surrounding provinces. Punctual meet-and-greet based on your flight details.",
    categories: ["Airport", "Meet & Greet", "Anatolian Side"],
  },
  {
    title: "Nationwide VIP Transfer",
    summary:
      "Private VIP transfer available in Istanbul, Antalya, Bodrum, Izmir, Ankara, Bursa and many more locations across Turkey.",
    categories: ["Istanbul", "Antalya", "Bodrum"],
  },
  {
    title: "Intercity Transfer",
    summary:
      "Enjoy a safe travel experience between cities with comfortable vehicles and experienced drivers.",
    categories: ["Intercity", "Comfort", "Safety"],
  },
  {
    title: "Chauffeured Car",
    summary:
      "Chauffeured car service for business meetings, private events, city programs and everyday transport needs.",
    categories: ["Chauffeured Car", "Daily", "Private"],
  },
  {
    title: "Corporate Transfer",
    summary:
      "Professional corporate transport solutions for company guests, executives, team transfers and organisations.",
    categories: ["Corporate", "Team", "Organisation"],
  },
];

export default function Services() {
  const { lang, t } = useLanguage();
  const services = lang === "tr" ? SERVICES_TR : SERVICES_EN;
  const whatsappPrefill = t(
    "VIP araçlarınızla ilgili bilgi alabilir miyim?",
    "Could I get some information about your VIP vehicles?",
  );

  return (
    <section className="editorial services" id="services">
      <div className="editorial-inner">
        <header className="editorial-head">
          <p className="editorial-label">{t("Hizmetler", "Services")}</p>
          <h2 className="editorial-title">
            {t("Sunduğumuz", "Our Transfer")} <br />
            {t("Transfer Hizmetleri", "Services")}
          </h2>
          <p className="editorial-lede">
            {t(
              "My VIP Transfer, Türkiye genelinde bireysel ve kurumsal müşterilere özel VIP transfer çözümleri sunar. Havalimanı karşılama, şehir içi ulaşım, şehirler arası transfer ve özel şoförlü araç hizmetleriyle yolculuğunuzu konforlu, güvenli ve zamanında tamamlamanıza yardımcı olur.",
              "My VIP Transfer offers private VIP transfer solutions for individual and corporate clients across Turkey. Airport meet-and-greet, city transport, intercity transfer and chauffeured car services help make your journey comfortable, safe and on time.",
            )}
          </p>
        </header>

        <ol className="service-list">
          {services.map((service, i) => (
            <li className="service-row" key={service.title}>
              <span className="service-index" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="service-body">
                <h3 className="service-title">{service.title}</h3>
                <p className="service-summary">{service.summary}</p>
              </div>

              <ul className="service-tags">
                {service.categories.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <p className="editorial-foot">
          <a
            className="whatsapp-cta"
            href={buildWhatsAppLink(whatsappPrefill)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden focusable="false">
              <path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.46-.15-.65.15-.2.29-.75.93-.92 1.12-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.6-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.48.1-.2.05-.37-.02-.51-.08-.15-.65-1.58-.9-2.16-.23-.56-.47-.48-.65-.49-.17-.01-.36-.01-.56-.01a1.08 1.08 0 0 0-.78.36c-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.2 3.03c.15.2 2.06 3.15 5 4.42.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.37.24-.68.24-1.26.17-1.38-.07-.13-.26-.2-.55-.35Z" />
              <path d="M12.02 2C6.5 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.08-1.33A9.96 9.96 0 0 0 12.02 22C17.53 22 22 17.52 22 12S17.53 2 12.02 2Zm0 18.2a8.16 8.16 0 0 1-4.17-1.14l-.3-.18-3.02.79.8-2.94-.2-.31A8.18 8.18 0 1 1 20.18 12a8.17 8.17 0 0 1-8.16 8.2Z" />
            </svg>
            {t("WhatsApp'tan Bilgi Al", "Ask on WhatsApp")}
          </a>
        </p>
      </div>
    </section>
  );
}
