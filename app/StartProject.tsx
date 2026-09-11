"use client";

import { useState } from "react";

/**
 * Reservation / quote request — a written brief, not a generic contact form.
 *
 * The fields sit on hairline rules and read as a sentence being filled in, so
 * it belongs to the same editorial language as the rest of the page rather than
 * looking like a form widget dropped on top of it.
 *
 * FRONTEND ONLY. Nothing is sent anywhere yet. When a CRM/backend exists,
 * replace the body of `handleSubmit` — no markup changes needed.
 */

const VEHICLE_TYPES = [
  "VIP Sedan",
  "VIP Vito / V-Class",
  "VIP Minivan",
  "Sprinter",
  "Emin Değilim",
];

const PASSENGER_COUNTS = ["1-2 Kişi", "3-4 Kişi", "5-8 Kişi", "9+ Kişi"];

const BAGGAGE_COUNTS = ["1-2 Bagaj", "3-4 Bagaj", "5+ Bagaj"];

export default function StartProject() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // No transport wired up yet — see the note in the component header.
    setSubmitted(true);
  };

  return (
    <section className="editorial start" id="start">
      <div className="editorial-inner">
        <header className="editorial-head">
          <p className="editorial-label">Rezervasyon</p>
          <h2 className="editorial-title">
            Transfer Planınızı <br />
            Bize İletin
          </h2>
          <p className="editorial-lede">
            Birkaç bilgi transfer talebinizi başlatmak için yeterli. Uçuş ve
            yolculuk detayları ne kadar net olursa, teklifimiz o kadar hızlı
            hazırlanır.
          </p>
        </header>

        <form className="brief" onSubmit={handleSubmit}>
          <div className="brief-grid">
            <label className="brief-field">
              <span className="brief-label">Ad Soyad</span>
              <input
                className="brief-input"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Adınız Soyadınız"
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">Telefon</span>
              <input
                className="brief-input"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="05XX XXX XX XX"
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">E-posta</span>
              <input
                className="brief-input"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ornek@eposta.com"
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">Uçuş Numarası</span>
              <input
                className="brief-input"
                name="flight"
                type="text"
                placeholder="Opsiyonel"
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">Alış Noktası</span>
              <input
                className="brief-input"
                name="pickup"
                type="text"
                placeholder="Örn. İstanbul Havalimanı"
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">Varış Noktası</span>
              <input
                className="brief-input"
                name="dropoff"
                type="text"
                placeholder="Örn. Taksim"
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">Tarih</span>
              <input className="brief-input" name="date" type="date" required />
            </label>

            <label className="brief-field">
              <span className="brief-label">Saat</span>
              <input className="brief-input" name="time" type="time" required />
            </label>

            <label className="brief-field">
              <span className="brief-label">Yolcu Sayısı</span>
              <select
                className="brief-input brief-select"
                name="passengers"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Seçiniz
                </option>
                {PASSENGER_COUNTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="brief-field">
              <span className="brief-label">Bagaj Sayısı</span>
              <select
                className="brief-input brief-select"
                name="baggage"
                defaultValue=""
              >
                <option value="" disabled>
                  Seçiniz
                </option>
                {BAGGAGE_COUNTS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>

            <label className="brief-field brief-field-wide">
              <span className="brief-label">Araç Tercihi</span>
              <select
                className="brief-input brief-select"
                name="vehicle"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Seçiniz
                </option>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="brief-field brief-field-wide">
              <span className="brief-label">Notunuz</span>
              <textarea
                className="brief-input brief-textarea"
                name="message"
                rows={3}
                placeholder="Karşılama tabelası, çocuk koltuğu, özel istekleriniz vb."
              />
            </label>
          </div>

          <div className="brief-foot">
            <button className="brief-submit" type="submit">
              Teklif Al
            </button>

            <p className="brief-note" role="status">
              {submitted
                ? "Teşekkürler! Transfer talebiniz alınmıştır, ekibimiz en kısa sürede sizinle iletişime geçecektir."
                : "7/24 destek ekibimiz kısa sürede sizinle iletişime geçer."}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
