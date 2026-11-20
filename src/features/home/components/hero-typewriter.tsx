"use client";

import { useEffect, useState } from "react";

const WORDS = [
  "bengkelmu",
  "proyek rumah",
  "kontraktor",
  "tukang",
  "pekerjaan berat",
];
const TYPE_MS = 90;
const DELETE_MS = 45;
const HOLD_MS = 1600;

export function HeroTypewriter() {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(WORDS[0].length);
  const [deleting, setDeleting] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const word = WORDS[index];
    let delay = deleting ? DELETE_MS : TYPE_MS;
    if (!deleting && length === word.length) delay = HOLD_MS;
    const id = setTimeout(() => {
      if (!deleting && length === word.length) {
        setDeleting(true);
      } else if (deleting && length === 0) {
        setIndex((i) => (i + 1) % WORDS.length);
        setDeleting(false);
      } else {
        setLength((l) => l + (deleting ? -1 : 1));
      }
    }, delay);
    return () => clearTimeout(id);
  }, [index, length, deleting]);

  const shown = WORDS[index].slice(0, length);

  return (
    <span className="text-brand-600">
      <span className="sr-only">{WORDS.join(", ")}</span>
      <span aria-hidden>
        {shown}
        <span className="ml-0.5 inline-block w-[3px] translate-y-[0.08em] animate-pulse rounded-full bg-brand-600 align-baseline">
          &nbsp;
        </span>
      </span>
    </span>
  );
}
