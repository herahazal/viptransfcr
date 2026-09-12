"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ModelViewerElement } from "@/types/model-viewer";
import { useLanguage } from "@/lib/i18n";

gsap.registerPlugin(ScrollTrigger);

const MODEL_PATH = "/models/mercedes_vito_van_2010_facelift_short_version.glb";

/**
 * Fixed bird's-eye "drone follow-cam" — no camera animation at all.
 *
 *   camera-orbit is set ONCE (180deg azimuth, 0deg polar — dead overhead,
 *   headlights pointing up the page) and never touched again: no
 *   auto-rotate, no yaw/tilt/spin, no scroll-driven orbit. The van itself
 *   never moves either. The only thing scroll drives is the road-lines
 *   layer's background-position, sliding downward beneath the van — the
 *   classic "camera follows, road flows past" illusion.
 *
 *   Azimuth is 180deg rather than 0deg purely to face the van's front (the
 *   headlights) toward the top of the screen — the model's un-rotated
 *   heading faces the opposite way. This is still a single fixed constant,
 *   never interpolated.
 */
const FIXED_AZIMUTH = 180;
const FIXED_RADIUS = 150; // % — desktop framing distance
const MOBILE_FIXED_RADIUS = 260; // % — pulled back further so the van clears
// the stacked mobile captions (see the `@media (max-width: 700px)` rule in
// globals.css for `.left-text`/`.right-text`).

/** Body paint recolour: white -> black. Only the "paint" material (the
 *  painted body panels) is touched — glass, bodyParts (trim/bumpers/
 *  mirrors), interior and tires are untouched. */
const BODY_MATERIAL_NAME = "paint";
const BODY_COLOR: [number, number, number, number] = [0, 0, 0, 1];

/** One full loop of the road-lines background pattern (see globals.css). */
const ROAD_PATTERN_HEIGHT = 208;
/** Total downward travel of the road pattern across the whole pin. */
const ROAD_TRAVEL = ROAD_PATTERN_HEIGHT * 12;

export default function PlaneOutro() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement | null>(null);
  const modelViewerRef = useRef<ModelViewerElement | null>(null);
  const roadRef = useRef<HTMLDivElement | null>(null);
  const leftTextRef = useRef<HTMLDivElement | null>(null);
  const rightTextRef = useRef<HTMLDivElement | null>(null);
  const bgFadeRef = useRef<HTMLDivElement | null>(null);

  // <model-viewer> registers itself as a custom element on import, which
  // touches window/customElements — it must only ever load in the browser,
  // never during Next's server render.
  const [modelViewerReady, setModelViewerReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").then(() => {
      if (!cancelled) setModelViewerReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Camera is set once (and again if the mobile breakpoint flips) and never
  // touched by scroll — no orbit tween, no auto-rotate.
  useLayoutEffect(() => {
    if (!modelViewerReady) return;
    const mv = modelViewerRef.current;
    if (!mv) return;
    const radius = isMobile ? MOBILE_FIXED_RADIUS : FIXED_RADIUS;
    mv.cameraOrbit = `${FIXED_AZIMUTH}deg 0deg ${radius}%`;
  }, [modelViewerReady, isMobile]);

  // Body paint -> black, applied once the GLB has actually loaded (the
  // scene-graph Model API is only populated after model-viewer's `load`
  // event). Untouched on re-render; only the "paint" material is recoloured.
  useEffect(() => {
    if (!modelViewerReady) return;
    const mv = modelViewerRef.current;
    if (!mv) return;

    const applyBodyColor = () => {
      const materials = mv.model?.materials ?? [];
      const paint = materials.find((m) =>
        m.name.toLowerCase().includes(BODY_MATERIAL_NAME),
      );
      paint?.pbrMetallicRoughness.setBaseColorFactor(BODY_COLOR);
    };

    if (mv.loaded) applyBodyColor();
    mv.addEventListener("load", applyBodyColor);
    return () => mv.removeEventListener("load", applyBodyColor);
  }, [modelViewerReady]);

  useLayoutEffect(() => {
    if (!sectionRef.current) return;
    if (!modelViewerReady) return;

    const ctx = gsap.context(() => {
      const road = { offset: 0 };
      const syncRoad = () => {
        if (roadRef.current)
          roadRef.current.style.backgroundPositionY = `${road.offset.toFixed(1)}px`;
      };

      if (leftTextRef.current)
        gsap.set(leftTextRef.current, { y: 80, opacity: 0 });
      if (rightTextRef.current)
        gsap.set(rightTextRef.current, { y: 80, opacity: 0 });
      syncRoad();

      const toRoadOffset = gsap.quickTo(road, "offset", {
        duration: 0.4,
        ease: "power2.out",
        onUpdate: syncRoad,
      });

      const toLeftY = leftTextRef.current
        ? gsap.quickTo(leftTextRef.current, "y", {
            duration: 0.6,
            ease: "power3.out",
            overwrite: true,
          })
        : null;

      const toLeftOpacity = leftTextRef.current
        ? gsap.quickTo(leftTextRef.current, "opacity", {
            duration: 0.6,
            ease: "power2.out",
            overwrite: true,
          })
        : null;

      const toRightY = rightTextRef.current
        ? gsap.quickTo(rightTextRef.current, "y", {
            duration: 0.6,
            ease: "power3.out",
            overwrite: true,
          })
        : null;

      const toRightOpacity = rightTextRef.current
        ? gsap.quickTo(rightTextRef.current, "opacity", {
            duration: 0.6,
            ease: "power2.out",
            overwrite: true,
          })
        : null;

      const toBg = bgFadeRef.current
        ? gsap.quickTo(bgFadeRef.current, "opacity", {
            duration: 0.35,
            ease: "power2.out",
            overwrite: true,
          })
        : null;

      const st = ScrollTrigger.create({
        trigger: sectionRef.current!,
        start: "top top",
        end: "+=90%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,

        onUpdate: (self) => {
          const p = self.progress; // 0..1

          // The van stays put; the road slides down beneath it the whole
          // way through the pin, in step with scroll.
          toRoadOffset(gsap.utils.interpolate(0, ROAD_TRAVEL, p));

          const leftP = gsap.utils.clamp(0, 1, (p - 0.08) / 0.2);
          if (toLeftY) toLeftY(gsap.utils.interpolate(80, 0, leftP));
          if (toLeftOpacity) toLeftOpacity(leftP);

          const rightP = gsap.utils.clamp(0, 1, (p - 0.12) / 0.2);
          if (toRightY) toRightY(gsap.utils.interpolate(80, 0, rightP));
          if (toRightOpacity) toRightOpacity(rightP);

          const bgP = gsap.utils.clamp(0, 1, (p - 0.72) / 0.28);
          if (toBg) toBg(bgP);

          const textP = gsap.utils.clamp(0, 1, (p - 0.78) / 0.22);
          const rr = Math.round(15 + (255 - 15) * textP);
          const gg = Math.round(15 + (255 - 15) * textP);
          const bb = Math.round(15 + (255 - 15) * textP);

          document.documentElement.style.setProperty(
            "--plane-text-color",
            `rgb(${rr},${gg},${bb})`,
          );
        },
      });

      return () => st.kill();
    }, sectionRef);

    return () => ctx.revert();
  }, [modelViewerReady]);

  return (
    <section
      ref={sectionRef}
      className="plane-section relative z-10"
      style={{ boxShadow: "0 160px 140px -80px rgba(0,0,0,0.95)" }}
    >
      <div className="plane-wrapper">
        <div
          ref={bgFadeRef}
          className="pointer-events-none absolute inset-0 z-[1] bg-[#0b0b0c] opacity-0"
          aria-hidden
        />

        <div className="left-text" ref={leftTextRef}>
          <h2>VIP Transfer</h2>
          <p>{t("Her Karşılama Özel, Her Yolculuk VIP", "Every Welcome Is Special, Every Ride Is VIP")}</p>
        </div>

        <div className="right-text" ref={rightTextRef}>
          <h2>{t("Havalimanı", "Airport")}</h2>
        </div>

        <div className="road-lines" ref={roadRef} aria-hidden />

        <div className="model-viewer-wrap">
          {modelViewerReady && (
            <model-viewer
              ref={modelViewerRef as React.RefObject<HTMLElement>}
              src={MODEL_PATH}
              alt={t("Mercedes Vito VIP transfer aracı", "Mercedes Vito VIP transfer vehicle")}
              camera-orbit={`${FIXED_AZIMUTH}deg 0deg ${isMobile ? MOBILE_FIXED_RADIUS : FIXED_RADIUS}%`}
              field-of-view="28deg"
              interaction-prompt="none"
              loading="eager"
              reveal="auto"
            />
          )}
        </div>
      </div>
    </section>
  );
}
