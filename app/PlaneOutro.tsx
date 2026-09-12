"use client";

import React, {
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { useLanguage } from "@/lib/i18n";

gsap.registerPlugin(ScrollTrigger);

const BASE_Y = 6.2;

type PlaneModelProps = {
  planeRef: React.MutableRefObject<THREE.Group | null>;
  onReady: () => void;
  isMobile: boolean;
};

function PlaneModel({ planeRef, onReady, isMobile }: PlaneModelProps) {
  const { scene } = useGLTF("/models/business-jet.glb");

  const prepared = useMemo(() => {
    if (!scene) return null;

    const clone = scene.clone(true);

    // rotation önce (bounding box doğru ölçülsün)
    clone.rotation.set(-Math.PI / 2, 0, Math.PI);

    // ✅ Prod/dev farkını bitiren normalize
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);

    // ✅ Desktopta şu anki görünümüne yakın bir hedef seçtik.
    // Eğer hala çok büyük/küçük gelirse sadece TARGET ile oynarsın.
    const TARGET = 10;

    const normalizeScale = maxDim > 0 ? TARGET / maxDim : 1;

    // ✅ Desktop/mobil oranını BOZMADAN koru
    const DESKTOP_FACTOR = 0.9;
    const MOBILE_FACTOR = 0.75;

    clone.scale.setScalar(
      normalizeScale * (isMobile ? MOBILE_FACTOR : DESKTOP_FACTOR),
    );

    return clone;
  }, [scene, isMobile]);

  useLayoutEffect(() => {
    if (!prepared) return;
    onReady();
  }, [prepared, onReady]);

  if (!prepared) return null;
  return <primitive ref={planeRef} object={prepared} />;
}

export default function PlaneOutro() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement | null>(null);
  const planeRef = useRef<THREE.Group | null>(null);
  const leftTextRef = useRef<HTMLDivElement | null>(null);
  const rightTextRef = useRef<HTMLDivElement | null>(null);
  const bgFadeRef = useRef<HTMLDivElement | null>(null);

  const [isPlaneReady, setIsPlaneReady] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useLayoutEffect(() => {
    if (!sectionRef.current) return;
    if (!isPlaneReady) return;
    if (!planeRef.current) return;

    const START_OFFSET = -18;
    const END_OFFSET = 12;

    const ctx = gsap.context(() => {
      // start pose
      planeRef.current!.position.y = BASE_Y + START_OFFSET;

      if (leftTextRef.current)
        gsap.set(leftTextRef.current, { y: 80, opacity: 0 });
      if (rightTextRef.current)
        gsap.set(rightTextRef.current, { y: 80, opacity: 0 });

      const toPlaneY = gsap.quickTo(planeRef.current!.position, "y", {
        duration: 0.9,
        ease: "power3.out",
        overwrite: true,
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
        end: "+=180%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,

        onUpdate: (self) => {
          const p = self.progress; // 0..1

          const targetY = gsap.utils.interpolate(
            BASE_Y + START_OFFSET,
            BASE_Y + END_OFFSET,
            p,
          );
          toPlaneY(targetY);

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
  }, [isPlaneReady]);

  // Kamera: aynen korunuyor
  const cameraPosition = isMobile
    ? ([0, 5.2, 26] as const)
    : ([0, 4.4, 15] as const);
  const cameraFov = isMobile ? 42 : 28;

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

        <Canvas
          className="plane-canvas"
          dpr={[1, 1.5]}
          camera={{ position: cameraPosition, fov: cameraFov }}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[6, 10, 8]} intensity={2.2} />
          <directionalLight position={[-6, 8, 6]} intensity={1.0} />
          <Suspense fallback={null}>
            <PlaneModel
              planeRef={planeRef}
              onReady={() => setIsPlaneReady(true)}
              isMobile={isMobile}
            />
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
}

useGLTF.preload("/models/business-jet.glb");
