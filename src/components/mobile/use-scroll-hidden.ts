"use client";

import { useEffect, useState } from "react";

const MIN_Y = 80;
const DELTA = 6;

/** True while the user scrolls down past MIN_Y; false again on any upward scroll. */
export function useScrollHidden() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (y <= MIN_Y) setHidden(false);
        else if (y - last > DELTA) setHidden(true);
        else if (last - y > DELTA) setHidden(false);
        if (Math.abs(y - last) > DELTA) last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return hidden;
}
