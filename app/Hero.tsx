"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import HeroCircularGallery, {
  type HeroCircularGalleryHandle,
} from "./HeroCircularGallery";

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

/** Hero copy entry, remapped so it follows the gallery instead of preceding it. */
const COPY_START = 0.78;
/** Bottom fade into the plane section, kept clear of the gallery. */
const FADE_START = 0.78;
const FADE_SPAN = 0.12;

export default function Hero() {
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
      const heroCopy = document.querySelector(".hero-copy");
      const heroHeader = document.querySelector(".hero-header");
      const hero = document.querySelector(".hero");

      if (
        !windowContainer ||
        !skyContainer ||
        !heroCopy ||
        !heroHeader ||
        !hero
      )
        return;

      const skyContainerHeight = (skyContainer as HTMLElement).offsetHeight;
      const viewportHeight = window.innerHeight;
      const skyMoveDistance = skyContainerHeight - viewportHeight;

      // ✅ İlk frame flash’ini öldür: önce görünmez, sonra GSAP kontrolüne al
      gsap.set(heroCopy, { yPercent: 100, autoAlpha: 1 });

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

          // hero copy y — now enters after the gallery has left
          let heroCopyY: number;
          if (progress <= COPY_START) {
            heroCopyY = 100;
          } else if (progress >= 1) {
            heroCopyY = 0;
          } else {
            heroCopyY = 100 * (1 - (progress - COPY_START) / (1 - COPY_START));
          }

          gsap.set(heroCopy, { yPercent: heroCopyY });

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

        <div className="hero-copy">
          <h1>
            My VIP Transfer ile havalimanı, şehir içi ve şehirler arası
            yolculuklarınızı profesyonel şoförler, konforlu araçlar ve 7/24
            destek ile güvenle planlayın.
          </h1>
        </div>

        <div className="window-container">
          <img src="/window.png" alt="" />
        </div>

        <div className="hero-header">
          <div className="col">
            <h1>
              My VIP <br />
              Transfer
            </h1>
            <p>
              Türkiye genelinde bireysel ve kurumsal müşterilere özel VIP
              transfer çözümleri. Havalimanı karşılama, şehir içi ulaşım ve
              özel şoförlü araç hizmetleriyle güvenle yol alın.
            </p>
          </div>

          <div className="col">
            <p>Premium Transfer Hizmeti</p>
            <h1>
              Her Karşılaşma Özel <br />
              Her Yolculuk VIP
            </h1>
          </div>
        </div>
      </section>

    </div>
  );
}
