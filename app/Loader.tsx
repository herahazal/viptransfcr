"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
// Aliased: this file also does `new Image()` (the DOM constructor) below to
// preload CRITICAL — importing next/image as `Image` would shadow it.
import NextImage from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

/**
 * Layout effect on the client, plain effect on the server render. This has to
 * run before Hero's own layout effect creates Lenis, which is why it cannot be
 * a regular useEffect.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Entry loader.
 *
 * The hero opens on two large plates (`aile-vito-transfer.jpg`, `window.png`
 * ~3.3 MB). Until both are decoded the aperture cannot animate smoothly, so
 * the page is held behind a quiet cover in the site's own cold blue-white
 * palette and its own serif. It also gives the gallery's idle warm-up a
 * moment to run.
 *
 * The loader is the one place a fade is wanted — it fades itself out and then
 * unmounts, leaving nothing behind.
 */

/** Blocking assets: the two plates the first frame of the hero depends on,
 *  plus the loader's own logo (small, but it's the only thing on screen
 *  while this runs — no reason not to gate on it too). */
const CRITICAL = [
  "/images/new.png",
  "/window.png",
  "/images/logo/logo-transparent.png",
];

/** Never hold the page longer than this, however slow the network is. */
const MAX_HOLD_MS = 6000;

/** Always hold it at least this long, however fast the network is — with
 *  the hero photo now a ~220KB real JPEG (was an accidental ~1.7MB PNG),
 *  CRITICAL can finish loading within a couple of frames on localhost or a
 *  warm CDN cache, and the loader flashed and vanished almost before it
 *  painted. A floor keeps the brand moment legible even when nothing was
 *  actually worth waiting for. */
const MIN_HOLD_MS = 900;

export default function Loader() {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const doneRef = useRef(false);

  // A reload must always start the cinematic from the very beginning.
  //
  // Browsers restore the previous scroll position on refresh, which lands the
  // hero part-way through its pinned timeline — the window opens already
  // enlarged. Turning restoration off and resetting to the top has to happen
  // before Lenis is constructed in Hero's layout effect, otherwise Lenis
  // initialises at the restored offset.
  useIsomorphicLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  // Belt and braces: if anything restored the offset while assets were still
  // loading, put it back before the cover comes off.
  useEffect(() => {
    if (!done) return;
    window.scrollTo(0, 0);
  }, [done]);

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const start = Date.now();
    let minHoldTimer: number | null = null;

    const reveal = () => {
      if (doneRef.current || cancelled) return;
      doneRef.current = true;
      setProgress(1);
      setDone(true);
    };

    // Everything CRITICAL can finish loading within a frame or two (fast
    // network, warm cache) — reveal() then would fire almost immediately,
    // so wait out whatever's left of MIN_HOLD_MS first.
    const finish = () => {
      const remaining = MIN_HOLD_MS - (Date.now() - start);
      if (remaining > 0) {
        minHoldTimer = window.setTimeout(reveal, remaining);
      } else {
        reveal();
      }
    };

    const bump = () => {
      loaded += 1;
      if (cancelled) return;
      setProgress(loaded / CRITICAL.length);
      if (loaded >= CRITICAL.length) finish();
    };

    CRITICAL.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      // decode() resolves once the bitmap is ready to paint, not merely fetched
      img
        .decode()
        .then(bump)
        .catch(() => bump());
    });

    // The MAX_HOLD_MS safety net bypasses the MIN_HOLD_MS wait on purpose —
    // if assets are taking this long, get out of the way immediately rather
    // than holding the cover up any longer than necessary.
    const guard = window.setTimeout(reveal, MAX_HOLD_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(guard);
      if (minHoldTimer) window.clearTimeout(minHoldTimer);
    };
  }, []);

  // Unmount only after the fade has played, so nothing lingers in the DOM.
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setGone(true), 900);
    return () => window.clearTimeout(t);
  }, [done]);

  // No scroll lock here. Setting `overflow: hidden` on the document makes the
  // page unscrollable, which collapses ScrollTrigger's pin distance to zero and
  // leaves the hero stuck at the end of its timeline on first paint. The cover
  // is fixed and full-screen, so nothing needs locking anyway.

  if (gone) return null;

  return (
    <div className={`site-loader${done ? " is-done" : ""}`} aria-hidden={done}>
      <div className="site-loader-inner">
        {/* The logo already carries the "My VIP Transfer" wordmark and the
            "Her Karşılama Özel · Her Yolculuk VIP" line baked in as artwork
            (public/images/logo/logo-transparent.png — a light-background
            variant with dark text, background matted out to transparent
            from the original public/images/logo/logo-acik-zemin.png), so no
            separate text is needed here any more. This variant is only used
            here, where it sits on the loader's own pale background — its
            near-black text would be unreadable on Hero's dark corner, which
            keeps the old dark-card logo. */}
        <Link href="/" className="site-loader-logo-link" aria-label="My VIP Transfer">
          <NextImage
            src="/images/logo/logo-transparent.png"
            alt={t(
              "My VIP Transfer — Her Karşılama Özel, Her Yolculuk VIP",
              "My VIP Transfer — Every Welcome Is Special, Every Ride Is VIP",
            )}
            width={900}
            height={280}
            priority
            className="site-loader-logo"
          />
        </Link>

        <div
          className="site-loader-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span
            className="site-loader-bar"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>
    </div>
  );
}
