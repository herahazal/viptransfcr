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
const SERVICES: Service[] = [
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

export default function Services() {
  return (
    <section className="editorial services" id="services">
      <div className="editorial-inner">
        <header className="editorial-head">
          <p className="editorial-label">Hizmetler</p>
          <h2 className="editorial-title">
            Sunduğumuz <br />
            Transfer Hizmetleri
          </h2>
          <p className="editorial-lede">
            My VIP Transfer, Türkiye genelinde bireysel ve kurumsal
            müşterilere özel VIP transfer çözümleri sunar. Havalimanı
            karşılama, şehir içi ulaşım, şehirler arası transfer ve özel
            şoförlü araç hizmetleriyle yolculuğunuzu konforlu, güvenli ve
            zamanında tamamlamanıza yardımcı olur.
          </p>
        </header>

        <ol className="service-list">
          {SERVICES.map((service, i) => (
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
          <a className="editorial-link" href="#start">
            Hemen Teklif Al
          </a>
        </p>
      </div>
    </section>
  );
}
