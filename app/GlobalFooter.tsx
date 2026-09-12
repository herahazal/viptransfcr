"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Globe } from "@/components/ui/globe";
import { useLanguage } from "@/lib/i18n";

gsap.registerPlugin(ScrollTrigger);

const PLANE_BG = "#cfe6ea";
const FOOTER_BG = "#0b0b0c";

export default function GlobalFooter() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pageBg = typeof document !== "undefined" ? document.getElementById("page-bg") : null;

    if (!section) return;

    // Arka plan: footer yaklaşırken mavi → siyah (yazı rengi PlaneOutro pin progress'ten)
    const stConfig = {
      trigger: section,
      start: "top 80%",
      end: "top 20%",
      scrub: true,
    };

    const ctx = gsap.context(() => {
      if (pageBg) {
        gsap.fromTo(
          pageBg,
          { backgroundColor: PLANE_BG },
          { backgroundColor: FOOTER_BG, ease: "none", scrollTrigger: { ...stConfig } }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="global"
      className="relative min-h-[100svh] w-full overflow-hidden bg-[#0b0b0c] text-white"
    >
      {/* vignette + soft gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 [background:radial-gradient(55%_60%_at_50%_30%,rgba(255,255,255,0.12)_0%,rgba(0,0,0,0)_55%),radial-gradient(70%_70%_at_50%_80%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.92)_72%)]" />
        {/* subtle horizontal fog */}
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(70%_40%_at_50%_45%,rgba(255,255,255,0.10)_0%,rgba(0,0,0,0)_60%)]" />
      </div>

      {/* huge background word — desktop/tablet only. On a phone the section
          is barely taller than its own text, so this always landed on top
          of either the headline or "İLETİŞİM İÇİN" / the contact lines no
          matter where it sat vertically; hiding it below `sm` was the only
          placement that never collides with real content. */}
      <div className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 -translate-y-[160px] hidden select-none whitespace-nowrap font-[600] tracking-tight text-white/10 blur-[0.2px] [font-size:clamp(160px,28vw,440px)] sm:block">
        Transfer
      </div>

      {/* Blur halka – tıklamayı geçir.
          Sized off `vh` alone, which ignores viewport WIDTH — on a tall,
          narrow phone that made the halo (and the globe below) balloon to
          ~2x the screen's own width, and, at z-[11], sit directly on top of
          the headline/contact text with nowhere on a phone screen it could
          go without overlapping one or the other. The middle grid column
          reserved for it is already `hidden` below `sm` for the same reason
          (see the grid below) — the globe itself now matches that and only
          renders from `sm` up, where the reserved column gives it real room. */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden items-center justify-center sm:flex">
        <div className="mx-auto aspect-square w-[min(94vh,1020px)] rounded-full bg-white/10 blur-3xl translate-y-[-280px]" />
      </div>
      {/* Globe – kendi boyutunda, z-[11] ile içeriğin üstünde; desktop’ta tıklanabilir */}
      <div className="absolute left-1/2 top-1/2 z-[11] hidden -translate-x-1/2 -translate-y-1/2 translate-y-[-280px] sm:block">
        <div className="aspect-square w-[min(92vh,1000px)]">
          <Globe className="!inset-0" />
        </div>
      </div>

      {/* Tüm yazılar kürenin önünde; pointer-events-none ile küre tıklanabilir kalır */}
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[1400px] flex-col px-8">
        {/* footer text – en üstte */}
        <div className="pointer-events-auto border-b border-white/5 pb-6 pt-6">
          <div className="flex flex-col gap-4 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
            <div>{t("©2026 MY VIP TRANSFER. TÜM HAKLARI SAKLIDIR", "©2026 MY VIP TRANSFER. ALL RIGHTS RESERVED")}</div>
            <div className="flex flex-wrap gap-6">
              <a className="hover:text-white" href="#privacy">
                {t("GİZLİLİK", "PRIVACY")}
              </a>
              <a className="hover:text-white" href="#colophon">
                {t("SSS", "FAQ")}
              </a>
              <a className="hover:text-white" href="#github">
                WHATSAPP
              </a>
            </div>
          </div>
        </div>

        {/* nav + brand */}
        <div className="pointer-events-auto flex flex-col items-start justify-between gap-6 pt-4 sm:flex-row sm:gap-10">
          <nav className="flex flex-wrap gap-8 text-sm text-white/80">
            <a className="hover:text-white" href="#work">
              {t("Anasayfa", "Home")}
            </a>
            <a className="hover:text-white" href="#services">
              {t("Hizmetler", "Services")}
            </a>
            <a className="hover:text-white" href="#community">
              {t("Kurumsal", "Corporate")}
            </a>
            <a className="hover:text-white" href="#global">
              {t("İletişim", "Contact")}
            </a>
          </nav>
          <div className="text-left text-sm text-white/80 sm:text-right">
            <div className="font-medium text-white">My VIP Transfer</div>
            <div className="mt-1">{t("VIP Transfer Hizmetleri", "VIP Transfer Services")}</div>
            <a className="hover:text-white" href="#start">
              {t("Teklif Al", "Get a Quote")}
            </a>
          </div>
        </div>

        {/* main layout: sol yazı, sağ iletişim – bottom 0 */}
        <div className="pointer-events-auto grid min-h-0 flex-1 grid-cols-1 items-start gap-8 pb-10 pt-10 sm:min-h-[calc(100svh-280px)] sm:grid-cols-[1fr_1.6fr_1fr] sm:items-end sm:gap-10">
          <div>
            <h3 className="max-w-[22ch] text-[clamp(28px,2.4vw,44px)] font-semibold leading-[0.95] tracking-tight sm:max-w-[18ch]">
              {t("Türkiye'nin her", "Safe and comfortable")} <br />
              {t("noktasında güvenli ve", "transport, everywhere")} <br />
              {t("konforlu ulaşım", "in Turkey")}
            </h3>
          </div>
          <div className="pointer-events-none hidden items-center justify-center sm:flex">
            {/* ortada küre – tıklamalar geçsin, mouse ile döndürülebilsin */}
          </div>
          <div className="text-sm text-white/80 lg:mt-0 lg:text-right">
            <div className="font-medium text-white">{t("İLETİŞİM İÇİN", "GET IN TOUCH")}</div>
            <div className="mt-3 space-y-1">
              <div>info@myviptransfer.com</div>
              <div>{t("Rezervasyon · Kurumsal Teklif", "Reservation · Corporate Quote")}</div>
            </div>
            <div className="mt-7 flex items-center gap-3 lg:justify-end">
              <span className="h-px w-10 bg-white/30" />
              <span className="text-white/70">—</span>
            </div>
          </div>
        </div>

        {/* Mobile globe — the desktop globe is absolutely centred over the
            whole section (fine there: a reserved grid column keeps the text
            clear of it), but on a phone every position that big overlay could
            take collided with either the headline or the contact lines. This
            is a second, independent instance that sits in NORMAL FLOW instead
            — after the text, sized off the viewport's own width so it can
            never outgrow the screen — so it can never overlap anything. */}
        <div className="pointer-events-auto flex justify-center pb-12 sm:hidden">
          <div className="relative aspect-square w-[58vw] max-w-[240px]">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-white/10 blur-2xl" />
            <Globe className="!inset-0" />
          </div>
        </div>
      </div>

      {/* MOBILE tweaks */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/40 lg:hidden" />
    </section>
  );
}
