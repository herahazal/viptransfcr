/**
 * Single source of truth for the business WhatsApp number — used by every
 * "message us on WhatsApp" entry point on the site (the reservation form,
 * the Services CTA, …). Change the number here and every link updates.
 *
 * International format, no "+" and no spaces — the format wa.me expects.
 */
export const WHATSAPP_NUMBER = "905327281991";

/** Builds a wa.me click-to-chat link with a pre-filled, URL-encoded message. */
export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
