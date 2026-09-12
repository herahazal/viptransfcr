"use client";

import { useState } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useLanguage } from "@/lib/i18n";

/**
 * Reservation / quote request — a written brief, not a generic contact form.
 *
 * The fields sit on hairline rules and read as a sentence being filled in, so
 * it belongs to the same editorial language as the rest of the page rather than
 * looking like a form widget dropped on top of it.
 *
 * "Teklif Al" formu doldurulduğunda backend/CRM yok — form verileri düz metin
 * olarak biçimlendirilip WhatsApp'ın click-to-chat linkiyle
 * (wa.me/<numara>?text=...) doğrudan işletmenin WhatsApp'ına gönderiliyor.
 * Ziyaretçinin kendi WhatsApp'ı (uygulama veya web) açılır, mesaj hazır gelir,
 * göndermek ziyaretçinin elindedir. Mesaj, formu doldururken seçili olan dilde
 * (TR/EN) biçimlendirilir.
 */

const VEHICLE_TYPES_TR = [
  "VIP Sedan",
  "VIP Vito / V-Class",
  "VIP Minivan",
  "Sprinter",
  "Emin Değilim",
];

const VEHICLE_TYPES_EN = [
  "VIP Sedan",
  "VIP Vito / V-Class",
  "VIP Minivan",
  "Sprinter",
  "Not Sure",
];

const PASSENGER_COUNTS_TR = ["1-2 Kişi", "3-4 Kişi", "5-8 Kişi", "9+ Kişi"];
const PASSENGER_COUNTS_EN = ["1-2 People", "3-4 People", "5-8 People", "9+ People"];

const BAGGAGE_COUNTS_TR = ["1-2 Bagaj", "3-4 Bagaj", "5+ Bagaj"];
const BAGGAGE_COUNTS_EN = ["1-2 Bags", "3-4 Bags", "5+ Bags"];

/** "2026-09-12" -> "12.09.2026". Tanınmayan bir biçim gelirse olduğu gibi döner. */
function formatDate(value: string): string {
  const [y, m, d] = value.split("-");
  return y && m && d ? `${d}.${m}.${y}` : value;
}

export default function StartProject() {
  const { lang, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const vehicleTypes = lang === "tr" ? VEHICLE_TYPES_TR : VEHICLE_TYPES_EN;
  const passengerCounts = lang === "tr" ? PASSENGER_COUNTS_TR : PASSENGER_COUNTS_EN;
  const baggageCounts = lang === "tr" ? BAGGAGE_COUNTS_TR : BAGGAGE_COUNTS_EN;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const get = (name: string) => (data.get(name) as string | null)?.trim() ?? "";

    const lines = [
      t("*Yeni Transfer Talebi — My VIP Transfer*", "*New Transfer Request — My VIP Transfer*"),
      "",
      `${t("Ad Soyad", "Full Name")}: ${get("name")}`,
      `${t("Telefon", "Phone")}: ${get("phone")}`,
      `${t("E-posta", "Email")}: ${get("email")}`,
      get("flight") && `${t("Uçuş Numarası", "Flight Number")}: ${get("flight")}`,
      `${t("Alış Noktası", "Pickup Location")}: ${get("pickup")}`,
      `${t("Varış Noktası", "Drop-off Location")}: ${get("dropoff")}`,
      `${t("Tarih", "Date")}: ${formatDate(get("date"))}`,
      `${t("Saat", "Time")}: ${get("time")}`,
      `${t("Yolcu Sayısı", "Passengers")}: ${get("passengers")}`,
      get("baggage") && `${t("Bagaj Sayısı", "Baggage")}: ${get("baggage")}`,
      `${t("Araç Tercihi", "Vehicle Preference")}: ${get("vehicle")}`,
      get("message") && `${t("Not", "Note")}: ${get("message")}`,
    ].filter((line): line is string => Boolean(line));

    window.open(buildWhatsAppLink(lines.join("\n")), "_blank", "noopener,noreferrer");

    setSubmitted(true);
    form.reset();
  };

  return (
    <section className="editorial start" id="start">
      <div className="editorial-inner">
        <header className="editorial-head">
          <p className="editorial-label">{t("Rezervasyon", "Reservation")}</p>
          <h2 className="editorial-title">
            {t("Transfer Planınızı", "Send Us Your")} <br />
            {t("Bize İletin", "Transfer Plan")}
          </h2>
          <p className="editorial-lede">
            {t(
              "Birkaç bilgi transfer talebinizi başlatmak için yeterli. Uçuş ve yolculuk detayları ne kadar net olursa, teklifimiz o kadar hızlı hazırlanır.",
              "A few details are enough to start your transfer request. The clearer your flight and trip details, the faster we prepare your quote.",
            )}
          </p>
        </header>

        <form className="brief" onSubmit={handleSubmit}>
          <div className="brief-grid">
            <label className="brief-field">
              <span className="brief-label">{t("Ad Soyad", "Full Name")}</span>
              <input
                className="brief-input"
                name="name"
                type="text"
                autoComplete="name"
                placeholder={t("Adınız Soyadınız", "Your full name")}
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">{t("Telefon", "Phone")}</span>
              <input
                className="brief-input"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder={t("05XX XXX XX XX", "+90 5XX XXX XX XX")}
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">{t("E-posta", "Email")}</span>
              <input
                className="brief-input"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t("ornek@eposta.com", "you@example.com")}
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">{t("Uçuş Numarası", "Flight Number")}</span>
              <input
                className="brief-input"
                name="flight"
                type="text"
                placeholder={t("Opsiyonel", "Optional")}
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">{t("Alış Noktası", "Pickup Location")}</span>
              <input
                className="brief-input"
                name="pickup"
                type="text"
                placeholder={t("Örn. İstanbul Havalimanı", "e.g. Istanbul Airport")}
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">{t("Varış Noktası", "Drop-off Location")}</span>
              <input
                className="brief-input"
                name="dropoff"
                type="text"
                placeholder={t("Örn. Taksim", "e.g. Taksim")}
                required
              />
            </label>

            <label className="brief-field">
              <span className="brief-label">{t("Tarih", "Date")}</span>
              <input className="brief-input" name="date" type="date" required />
            </label>

            <label className="brief-field">
              <span className="brief-label">{t("Saat", "Time")}</span>
              <input className="brief-input" name="time" type="time" required />
            </label>

            <label className="brief-field">
              <span className="brief-label">{t("Yolcu Sayısı", "Passengers")}</span>
              <select
                className="brief-input brief-select"
                name="passengers"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  {t("Seçiniz", "Select")}
                </option>
                {passengerCounts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="brief-field">
              <span className="brief-label">{t("Bagaj Sayısı", "Baggage")}</span>
              <select
                className="brief-input brief-select"
                name="baggage"
                defaultValue=""
              >
                <option value="" disabled>
                  {t("Seçiniz", "Select")}
                </option>
                {baggageCounts.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>

            <label className="brief-field brief-field-wide">
              <span className="brief-label">{t("Araç Tercihi", "Vehicle Preference")}</span>
              <select
                className="brief-input brief-select"
                name="vehicle"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  {t("Seçiniz", "Select")}
                </option>
                {vehicleTypes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="brief-field brief-field-wide">
              <span className="brief-label">{t("Notunuz", "Your Note")}</span>
              <textarea
                className="brief-input brief-textarea"
                name="message"
                rows={3}
                placeholder={t(
                  "Karşılama tabelası, çocuk koltuğu, özel istekleriniz vb.",
                  "Meet-and-greet sign, child seat, special requests, etc.",
                )}
              />
            </label>
          </div>

          <div className="brief-foot">
            <button className="brief-submit" type="submit">
              {t("Teklif Al", "Get a Quote")}
            </button>

            <p className="brief-note" role="status">
              {submitted
                ? t(
                    "Talebiniz WhatsApp'ta hazır — açılan sohbette göndermeniz yeterli. Ekibimiz en kısa sürede size dönecektir.",
                    "Your request is ready in WhatsApp — just send it from the chat that opened. Our team will get back to you shortly.",
                  )
                : t(
                    "Teklif Al'a bastığınızda talebiniz WhatsApp üzerinden bize iletilir.",
                    "When you press Get a Quote, your request is sent to us via WhatsApp.",
                  )}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
