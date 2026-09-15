"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
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

    // Mobile only: the window/header "aperture" zoom (below) scales up to 4x
    // by ~30% into the pin — on a phone that was enough to push the window
    // frame's own border past the viewport edges within the first couple of
    // scroll ticks, leaving a plain full-bleed rectangle with no frame and
    // no dark margin around it for the rest of the Hero. Capping how far
    // `ap` is allowed to drive the zoom keeps the frame (and its margin)
    // visible throughout. Desktop's `ap`/`windowScale` are untouched.
    const isMobile = window.matchMedia("(max-width: 1000px)").matches;
    const MOBILE_AP_CAP = 0.02; // -> windowScale caps at 1.12x instead of 4x

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
          const rawAp = Math.min(1, progress * APERTURE_SCALE);
          const ap = isMobile ? Math.min(rawAp, MOBILE_AP_CAP) : rawAp;

          // window scale — unchanged formula, unchanged absolute rate
          const windowScale = ap <= 0.5 ? 1 + (ap / 0.5) * 3 : 4;

          gsap.set(windowContainer, { scale: windowScale });

          // The header (logo, "Premium Transfer Hizmeti" + TR/EN, tagline)
          // rides the same zoom as the window, reaching 4x scale by the
          // time the aperture finishes opening (progress ~0.3) — and then
          // STAYS at 4x for the rest of the Hero, including the whole
          // gallery-revealed section. With the logo enlarged to 240px that
          // 4x became a ~960px shape whose (huge, off-canvas) bounding box
          // still clips into a narrow phone viewport, bleeding a giant
          // blurred corner of it across the gallery cards. Fading the
          // header out just before the aperture completes removes it
          // before it ever reaches a size that can do that — it isn't
          // meant to still be there once the gallery takes over anyway.
          const headerOpacity = 1 - gsap.utils.clamp(0, 1, (progress - 0.15) / 0.15);
          gsap.set(heroHeader, {
            scale: windowScale,
            z: ap * 500,
            opacity: headerOpacity,
            visibility: headerOpacity > 0.01 ? "visible" : "hidden",
          });

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

        {/* `.sky-container` used to be a 350svh plate GSAP slid upward as the
            Hero pin scrolled — fine for the old cloud photo (a uniform
            texture), but the family+van photo is a one-off composition: the
            moment it had scrolled past its own height, the parallax exposed
            the plate's flat background colour underneath it as a hard seam.
            It's a plain 100svh photo now (see globals.css) — always fully in
            frame, never sliding away — animated instead by a slow, scroll-
            independent Ken Burns zoom (`.sky-photo img`'s CSS animation). */}
        <div className="sky-container">
          <div className="sky-photo">
            <Image
              src="/images/aile-vito-transfer.jpg"
              alt={t(
                "Bir aile bavullarıyla My VIP Transfer'in Mercedes Vito aracına doğru yürüyor",
                "A family walks with their luggage toward a My VIP Transfer Mercedes Vito",
              )}
              fill
              priority
              sizes="100vw"
              quality={85}
              style={{ objectFit: "cover", objectPosition: "center 38%" }}
            />
            {/* Bright daylight photo under light-coloured hero type — a flat
                dark overlay keeps the "Premium Transfer Hizmeti" label, the
                TR/EN toggle and the tagline readable at any scroll position. */}
            <div className="sky-photo-overlay" />
          </div>
        </div>

        {/* Overlay inside the pinned hero. Sits between the clouds and the
            hero copy, so the copy always reads on top of it. The window is
            painted after it — the glass is fully transparent, so at full
            aperture the gallery shows straight through. */}
        <HeroCircularGallery ref={galleryRef} />

        <div className="window-container">
          <img src="/window.png" alt="" />
        </div>

        {/* Grid, not flex: the logo (hero-logo-slot) and the meta block
            (hero-header-meta — "PREMIUM TRANSFER HİZMETİ" + TR/EN) are now
            two independent grid items sharing row 1, `align-items: center`
            — so they line up on their shared vertical centre no matter how
            tall the logo itself is. The tagline sits in its own row,
            pinned to the bottom. Previously the logo and the meta block
            were each the sole/first child of their own full-height flex
            column, which only ever lined up their TOPS, not their centres —
            fine while the logo was small, but once it was enlarged its
            centre drifted well below the (much shorter) meta block's. */}
        <div className="hero-header">
          <div className="hero-logo-slot">
            {/* Emblem only — the dark rounded-square card the monogram used
                to sit on (public/images/logo/logo-monogram-favicon.png) is
                matted out to transparent (logo-monogram-transparent.png),
                so it's just the gold "M" glyph now, floating directly on
                the Hero photo like the rest of this corner. Also cropped
                tight to the glyph's own bounding box (267×177, was a
                512×512 canvas with ~34% empty margin top and bottom) —
                otherwise even center-alignment would be off, centred on a
                box padded well below the glyph's own visual weight. */}
            <Link href="/" className="hero-logo-link" aria-label="My VIP Transfer">
              <Image
                src="/images/logo/logo-monogram-transparent.png"
                alt="My VIP Transfer"
                width={267}
                height={177}
                priority
                className="hero-logo-image"
              />
            </Link>
          </div>

          <div className="hero-header-meta">
            <p>{t("PREMIUM TRANSFER HİZMETİ", "PREMIUM TRANSFER SERVICE")}</p>
            <LanguageToggle />
          </div>

          <h1 className="hero-tagline">
            {t("Her Karşılama Özel", "Every Welcome Is Special")} <br />
            {t("Her Yolculuk VIP", "Every Ride Is VIP")}
          </h1>
        </div>
      </section>

    </div>
  );
}
