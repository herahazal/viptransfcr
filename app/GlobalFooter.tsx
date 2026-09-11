"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Globe } from "@/components/ui/globe";

gsap.registerPlugin(ScrollTrigger);

const PLANE_BG = "#cfe6ea";
const FOOTER_BG = "#0b0b0c";

export default function GlobalFooter() {
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

      {/* huge background word */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-[600] tracking-tight text-white/10 blur-[0.2px] [font-size:clamp(160px,28vw,440px)] max-md:top-1/2 max-md:-translate-y-[calc(50%-10px)] md:top-14 md:-translate-y-[160px]">
        Transfer
      </div>

      {/* Blur halka – tıklamayı geçir */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div className="mx-auto aspect-square w-[min(94vh,1020px)] rounded-full bg-white/10 blur-3xl translate-y-[-280px]" />
      </div>
      {/* Globe – kendi boyutunda, z-[11] ile içeriğin üstünde; desktop’ta tıklanabilir */}
      <div className="absolute left-1/2 top-1/2 z-[11] -translate-x-1/2 -translate-y-1/2 translate-y-[-280px]">
        <div className="aspect-square w-[min(92vh,1000px)]">
          <Globe className="!inset-0" />
        </div>
      </div>

      {/* Tüm yazılar kürenin önünde; pointer-events-none ile küre tıklanabilir kalır */}
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[1400px] flex-col px-8">
        {/* footer text – en üstte */}
        <div className="pointer-events-auto border-b border-white/5 pb-6 pt-6">
          <div className="flex flex-col gap-4 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
            <div>©2026 MY VIP TRANSFER. TÜM HAKLARI SAKLIDIR</div>
            <div className="flex flex-wrap gap-6">
              <a className="hover:text-white" href="#privacy">
                GİZLİLİK
              </a>
              <a className="hover:text-white" href="#colophon">
                SSS
              </a>
              <a className="hover:text-white" href="#github">
                WHATSAPP
              </a>
            </div>
          </div>
        </div>

        {/* nav + brand */}
        <div className="pointer-events-auto flex items-start justify-between gap-10 pt-4">
          <nav className="flex flex-wrap gap-8 text-sm text-white/80">
            <a className="hover:text-white" href="#work">
              Anasayfa
            </a>
            <a className="hover:text-white" href="#services">
              Hizmetler
            </a>
            <a className="hover:text-white" href="#community">
              Kurumsal
            </a>
            <a className="hover:text-white" href="#global">
              İletişim
            </a>
          </nav>
          <div className="text-right text-sm text-white/80">
            <div className="font-medium text-white">My VIP Transfer</div>
            <div className="mt-1">VIP Transfer Hizmetleri</div>
            <a className="hover:text-white" href="/booking">
              Teklif Al
            </a>
          </div>
        </div>

        {/* main layout: sol yazı, sağ iletişim – bottom 0 */}
        <div className="pointer-events-auto grid min-h-[calc(100svh-280px)] flex-1 grid-cols-[1fr_1.6fr_1fr] items-end gap-10 pb-10 pt-10">
          <div>
            <h3 className="max-w-[18ch] text-[clamp(30px,2.4vw,44px)] font-semibold leading-[0.95] tracking-tight">
              Türkiye&apos;nin her <br />
              noktasında güvenli ve <br />
              konforlu ulaşım
            </h3>
          </div>
          <div className="pointer-events-none flex items-center justify-center">
            {/* ortada küre – tıklamalar geçsin, mouse ile döndürülebilsin */}
          </div>
          <div className="mt-10 text-sm text-white/80 lg:mt-0 lg:text-right">
            <div className="font-medium text-white">İLETİŞİM İÇİN</div>
            <div className="mt-3 space-y-1">
              <div>info@myviptransfer.com</div>
              <div>Rezervasyon · Kurumsal Teklif</div>
            </div>
            <div className="mt-7 flex items-center gap-3 lg:justify-end">
              <span className="h-px w-10 bg-white/30" />
              <span className="text-white/70">—</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE tweaks */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/40 lg:hidden" />
    </section>
  );
}
