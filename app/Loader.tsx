"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
 * The hero opens on two large plates (`sky.jpg` ~3 MB, `window.png` ~3.3 MB).
 * Until both are decoded the aperture cannot animate smoothly, so the page is
 * held behind a quiet cover in the site's own cold blue-white palette and its
 * own serif. It also gives the gallery's idle warm-up a moment to run.
 *
 * The loader is the one place a fade is wanted — it fades itself out and then
 * unmounts, leaving nothing behind.
 */

/** Blocking assets: the two plates the first frame of the hero depends on. */
const CRITICAL = ["/sky.jpg", "/window.png"];

/** Never hold the page longer than this, however slow the network is. */
const MAX_HOLD_MS = 6000;

export default function Loader() {
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

    const finish = () => {
      if (doneRef.current || cancelled) return;
      doneRef.current = true;
      setProgress(1);
      setDone(true);
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

    const guard = window.setTimeout(finish, MAX_HOLD_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(guard);
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
        <p className="site-loader-name">My VIP Transfer</p>
        <p className="site-loader-role">Premium Transfer Hizmeti</p>

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
