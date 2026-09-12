"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import HeroCircularGallery, {
  type HeroCircularGalleryHandle,
} from "./HeroCircularGallery";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "@/lib/i18n";

gsap.registerPlugin(ScrollTrigger);

/**
 * The hero pin was 3 viewports; the gallery needs room to be explored, so it is
 * now 5. To keep the aperture looking exactly as it did, the window/header
 * motion is driven by `apertureProgress`, which replays the original 3-viewport
 * curve over the first 3 viewports of the longer pin — same scale, same
 * perspective, same rate of travel — and then holds.
 */
const PIN_VIEWPORTS = 5;
const APERTURE_VIEWPORTS = 3;
const APERTURE_SCALE = PIN_VIEWPORTS / APERTURE_VIEWPORTS;

/** Bottom fade into the plane section, kept clear of the gallery. */
const FADE_START = 0.78;
const FADE_SPAN = 0.12;

export default function Hero() {
  const { t } = useLanguage();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fadeRef = useRef<HTMLDivElement | null>(null);
  const galleryRef = useRef<HeroCircularGalleryHandle | null>(null);

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    const lenis = new Lenis();

    /**
     * A reload must always start the cinematic from the very beginning.
     *
     * The browser can restore the previous scroll offset, and once Lenis is
     * running it writes its own position back to the document every frame — so
     * a plain `window.scrollTo(0, 0)` is overwritten on the next tick and the
     * aperture opens already enlarged. The reset therefore has to go through
     * Lenis itself. Repeated once on the next frame in case the browser
     * restores the offset immediately after mount.
     */
    const resetToStart = () =>
      lenis.scrollTo(0, { immediate: true, force: true });

    resetToStart();
    const resetRaf = requestAnimationFrame(resetToStart);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const windowContainer = document.querySelector(".window-container");
      const skyContainer = document.querySelector(".sky-container");
      const heroHeader = document.querySelector(".hero-header");
      const hero = document.querySelector(".hero");

      if (!windowContainer || !skyContainer || !heroHeader || !hero) return;

      const skyContainerHeight = (skyContainer as HTMLElement).offsetHeight;
      const viewportHeight = window.innerHeight;
      const skyMoveDistance = skyContainerHeight - viewportHeight;

      ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: () => `+=${window.innerHeight * PIN_VIEWPORTS}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;

          // Original 3-viewport aperture curve, replayed over the first 3 of 5.
          const ap = Math.min(1, progress * APERTURE_SCALE);

          // window scale — unchanged formula, unchanged absolute rate
          const windowScale = ap <= 0.5 ? 1 + (ap / 0.5) * 3 : 4;

          gsap.set(windowContainer, { scale: windowScale });
          gsap.set(heroHeader, { scale: windowScale, z: ap * 500 });

          // sky move — spread across the full pin so the clouds keep drifting
          // gently behind the gallery instead of freezing partway through
          gsap.set(skyContainer, { y: -progress * skyMoveDistance });

          // fade overlay
          if (fadeRef.current) {
            const fade = gsap.utils.clamp(
              0,
              1,
              (progress - FADE_START) / FADE_SPAN,
            );
            gsap.set(fadeRef.current, { opacity: fade });
          }

          // Gallery overlay — revealed off the aperture's own scale, then
          // visible for the rest of the Hero. Imperative: no React state.
          galleryRef.current?.update(progress);
        },
      });

      ScrollTrigger.refresh();
    }, rootRef);

    return () => {
      cancelAnimationFrame(resetRaf);
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={rootRef}>
      <section className="hero">
        <div className="hero-fade" ref={fadeRef} />

        <div className="sky-container">
          <img src="/sky.jpg" alt="" />
        </div>

        {/* Overlay inside the pinned hero. Sits between the clouds and the
            hero copy, so the copy always reads on top of it. The window is
            painted after it — the glass is fully transparent, so at full
            aperture the gallery shows straight through. */}
        <HeroCircularGallery ref={galleryRef} />

        <div className="window-container">
          <img src="/window.png" alt="" />
        </div>

        <div className="hero-header">
          {/* Logo buraya gelecek — kolon boşluğu bilerek korunuyor, sağ
              taraftaki metin bloğunun hizası bozulmasın diye. */}
          <div className="col hero-logo-slot" />

          <div className="col">
            {/* Grouped in one wrapper, not two loose siblings: the column is
                `justify-content: space-between`, and a bare 3rd child would
                get pushed to the vertical middle instead of sitting right
                under the label. */}
            <div>
              <p>{t("PREMIUM TRANSFER HİZMETİ", "PREMIUM TRANSFER SERVICE")}</p>
              <LanguageToggle />
            </div>
            <h1 className="hero-tagline">
              {t("Her Karşılama Özel", "Every Welcome Is Special")} <br />
              {t("Her Yolculuk VIP", "Every Ride Is VIP")}
            </h1>
          </div>
        </div>
      </section>

    </div>
  );
}
