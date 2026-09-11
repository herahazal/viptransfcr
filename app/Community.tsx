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
const TIERS: Tier[] = [
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

/** Editable. Popular routes — not a real-time availability list. */
const PREVIEW = [
  { kind: "Havalimanı", title: "İstanbul Havalimanı → Taksim" },
  { kind: "Havalimanı", title: "Sabiha Gökçen → Kadıköy" },
  { kind: "Şehir Dışı", title: "Antalya Havalimanı → Belek" },
];

export default function Community() {
  return (
    <section className="editorial community" id="community">
      <div className="editorial-inner">
        <header className="editorial-head">
          <p className="editorial-label">Kurumsal Çözümler</p>
          <h2 className="editorial-title">
            Bireysel ve <br />
            Kurumsal Çözümler
          </h2>
          <p className="editorial-lede">
            My VIP Transfer, yolculuğunuzun her adımında güven, konfor ve
            profesyonellik sunar. Havalimanı karşılamadan şehirler arası
            transfere kadar tüm ulaşım ihtiyaçlarınız için planlı, dakik ve
            özel çözümler üretir.
          </p>
        </header>

        <div className="community-grid">
          <div className="tiers">
            {TIERS.map((tier) => (
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
            <p className="editorial-label">Popüler Rotalar</p>
            <ul className="preview-list">
              {PREVIEW.map((item) => (
                <li className="preview-row" key={item.title}>
                  <span className="preview-kind">{item.kind}</span>
                  <span className="preview-title">{item.title}</span>
                  <span className="preview-lock" aria-label="Popüler rota">
                    ·
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="community-actions">
          <button className="editorial-button" type="button">
            Kurumsal Teklif Al
          </button>
          <button className="editorial-button editorial-button-quiet" type="button">
            WhatsApp ile İletişime Geç
          </button>
          <p className="community-note">
            Kurumsal anlaşmalar ve özel teklifler için bizimle iletişime geçin.
          </p>
        </div>
      </div>
    </section>
  );
}
