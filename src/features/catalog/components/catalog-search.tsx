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
        "flex h-11 items-center gap-2 rounded-[10px] bg-ink-50 px-3 focus-within:ring-2 focus-within:ring-brand-500/40",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submit(text);
      }}
    >
      <SearchIcon className="size-5 shrink-0 text-brand-600" strokeWidth={2} />
      <input
        type="search"
        aria-label="Cari produk"
        placeholder="Cari bor, gerinda, kompresor"
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
          className="rounded text-ink-500"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </form>
  );
}
