"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
} from "react";
import CircularGallery, {
  type CircularGalleryApi,
} from "@/components/CircularGallery";
import { useLanguage } from "@/lib/i18n";

/**
 * The gallery layer inside the Hero aperture sequence.
 *
 * This is NOT a page section. It is an overlay rendered inside the pinned
 * `.hero`, above the cloud background and below the existing hero copy.
 *
 * Lifecycle:
 *  - mounted and fully warmed (canvas, shaders, decoded textures) during idle
 *    time right after the page settles, while still invisible
 *  - revealed in a single step once the aperture is nearly complete — no fade,
 *    no scale, no transform animation of the wrapper
 *  - stays visible and interactive for the rest of the Hero, leaving only when
 *    the Hero itself unpins into PlaneOutro
 *
 * Hero calls `update()` every scroll frame. That path touches inline styles and
 * the imperative gallery API only — it never sets React state.
 */

/* ---------------------------------------------------------------------------
 * Gallery items — edit freely.
 *
 * PLACEHOLDERS: these reuse the site's existing sky/atmosphere stills so the
 * curve has enough distinct cards to read as a gallery. Swap the `image`
 * paths for real vehicle/route photography from My VIP Transfer before
 * launch — the captions below already reflect the real service names.
 *
 * Note: images must be fully opaque. The gallery shader samples the texture
 * directly, so a PNG with transparency (e.g. /window.png) renders as a black
 * rectangle rather than compositing over the clouds.
 * ------------------------------------------------------------------------- */
const GALLERY_ITEMS_TR = [
  { image: "/media/asteroid/still-desktop.webp", text: "İstanbul Havalimanı Transfer" },
  { image: "/sky.jpg", text: "Sabiha Gökçen Havalimanı Transfer" },
  { image: "/media/asteroid/poster-desktop.webp", text: "Türkiye Geneli VIP Transfer" },
  { image: "/sky2.jpg", text: "Şehirler Arası Transfer" },
  { image: "/media/asteroid/still-desktop.webp", text: "Özel Şoförlü Araç" },
  { image: "/sky.jpg", text: "Kurumsal Transfer" },
];

const GALLERY_ITEMS_EN = [
  { image: "/media/asteroid/still-desktop.webp", text: "Istanbul Airport Transfer" },
  { image: "/sky.jpg", text: "Sabiha Gökçen Airport Transfer" },
  { image: "/media/asteroid/poster-desktop.webp", text: "Nationwide VIP Transfer" },
  { image: "/sky2.jpg", text: "Intercity Transfer" },
  { image: "/media/asteroid/still-desktop.webp", text: "Chauffeured Car" },
  { image: "/sky.jpg", text: "Corporate Transfer" },
];

/*
 * Entrance. The gallery rises into place exactly the way the hero copy does —
 * it starts fully below the viewport and slides up as the visitor scrolls,
 * so it is never "popped" into an empty cloud scene.
 *
 *   0.30  the aperture has finished (window scale 4); the gallery is still
 *         entirely off-screen below, so nothing appears out of nowhere
 *   0.48  fully in place
 *   then  it stays there for the rest of the Hero — no fade, no exit
 *
 * Opacity is 1 the whole time. The only thing that moves is position.
 */
const ENTER_START = 0.3;
const ENTER_END = 0.48;

/** How many item-widths the vertical scroll advances once it is in place. */
const ITEMS_TRAVELLED = 5;

/** Conservative caps — this page already runs a second WebGL context. */
const DPR_DESKTOP = 1.5;
const DPR_MOBILE = 1;

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export type HeroCircularGalleryHandle = {
  /** Called from Hero's existing ScrollTrigger onUpdate. */
  update: (progress: number) => void;
};

const HeroCircularGallery = forwardRef<HeroCircularGalleryHandle>(
  function HeroCircularGallery(_props, ref) {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const apiRef = useRef<CircularGalleryApi | null>(null);
    /** Mirrors the current visibility so we only touch the DOM on a change. */
    const shownRef = useRef(false);

    const isMobile = useMediaQuery("(max-width: 900px)");
    const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
    const { lang } = useLanguage();
    const galleryItems = lang === "tr" ? GALLERY_ITEMS_TR : GALLERY_ITEMS_EN;

    // Images are requested on the very first client render, alongside the
    // renderer below. Everything therefore loads behind the entry loader, and
    // nothing at all is created once the visitor starts scrolling.
    useEffect(() => {
      if (reducedMotion) return;
      galleryItems.forEach((item) => {
        const img = new Image();
        img.decoding = "async";
        img.src = item.image;
        void img.decode().catch(() => undefined);
      });
    }, [reducedMotion, galleryItems]);

    useImperativeHandle(
      ref,
      () => ({
        update(progress: number) {
          const wrap = wrapRef.current;
          if (!wrap) return;

          const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
          const slide = clamp01(
            (progress - ENTER_START) / (ENTER_END - ENTER_START),
          );

          // Position only — opacity stays at 1 and is never animated.
          wrap.style.transform = `translateY(${((1 - slide) * 100).toFixed(2)}svh)`;

          // Visibility is the only binary, and it flips while the gallery is
          // still completely off-screen, so it can never appear abruptly.
          const shouldShow = progress >= ENTER_START;
          if (shouldShow !== shownRef.current) {
            shownRef.current = shouldShow;
            wrap.style.visibility = shouldShow ? "visible" : "hidden";
          }

          // Dragging is live once it has settled into place.
          const interactive = slide >= 1;
          wrap.style.pointerEvents = interactive ? "auto" : "none";

          if (!shouldShow || reducedMotion) return;

          const api = apiRef.current;
          if (!api) return;

          // Items advance from the moment it lands to the end of the Hero. The
          // user's drag offset lives inside the gallery and is added on top, so
          // scrolling never cancels a drag.
          const span = Math.max(0.0001, 1 - ENTER_END);
          const travel = clamp01((progress - ENTER_END) / span);
          const width = api.getItemWidth();
          if (width > 0) api.setScrollBase(travel * ITEMS_TRAVELLED * width);
        },
      }),
      [reducedMotion],
    );

    return (
      <div className="hero-gallery" ref={wrapRef}>
        <div className="hero-gallery-stage">
          {reducedMotion && (
            <div className="hero-gallery-static">
              {galleryItems.slice(0, 3).map((item) => (
                <figure key={item.text}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" decoding="async" />
                  <figcaption>{item.text}</figcaption>
                </figure>
              ))}
            </div>
          )}

          {!reducedMotion && (
            <CircularGallery
              items={galleryItems}
              // Flatter on mobile (a higher bend number = a shallower curve,
              // not a tighter one — see CircularGallery's `update()`, where a
              // smaller bend shrinks the radius and so steepens the dip/tilt
              // per unit of scroll offset). Bend 2 was tighter than desktop's
              // 3, which is backwards for a phone: the two visible side cards
              // rotated so hard their captions crossed and overlapped each
              // other illegibly. 6 keeps them close to flat and readable.
              bend={isMobile ? 6 : 3}
              textColor="#12212a"
              borderRadius={0.03}
              scrollEase={0.06}
              dpr={isMobile ? DPR_MOBILE : DPR_DESKTOP}
              // Wheel capture stays off — upstream listens on window and would
              // spin the gallery on every scroll anywhere on the page while
              // fighting Lenis. Pointer dragging stays on, scoped to the
              // container, so the original click-and-drag interaction works.
              captureWheel={false}
              capturePointer
              apiRef={apiRef}
            />
          )}
        </div>
      </div>
    );
  },
);

export default HeroCircularGallery;
