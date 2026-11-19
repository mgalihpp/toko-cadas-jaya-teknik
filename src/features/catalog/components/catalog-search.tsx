"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 450;

export function CatalogSearch({
  value,
  onSearch,
  className,
}: {
  value: string;
  onSearch: (q: string | undefined) => void;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const [submitted, setSubmitted] = useState(value);
  const [synced, setSynced] = useState(value);

  if (value !== synced) {
    setSynced(value);
    if (value !== submitted) {
      setText(value);
      setSubmitted(value);
    }
  }

  function submit(next: string) {
    const q = next.trim();
    if (q === submitted) return;
    setSubmitted(q);
    onSearch(q || undefined);
  }

  useEffect(() => {
    if (text.trim() === submitted) return;
    const timer = setTimeout(() => submit(text), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });

  return (
    <form
      role="search"
      className={cn(
        "flex h-[42px] items-center gap-2.5 rounded-lg border border-ink-300 bg-white px-3.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submit(text);
      }}
    >
      <SearchIcon className="size-4 shrink-0 text-ink-500" />
      <input
        type="search"
        aria-label="Cari produk"
        placeholder="Cari nama atau spesifikasi produk"
        value={text}
        maxLength={100}
        onChange={(event) => setText(event.target.value)}
        className="w-full min-w-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {text ? (
        <button
          type="button"
          aria-label="Hapus pencarian"
          onClick={() => {
            setText("");
            submit("");
          }}
          className="rounded text-ink-500 hover:text-ink-900"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </form>
  );
}
