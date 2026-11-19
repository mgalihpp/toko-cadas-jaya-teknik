import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function pageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("gap");
    items.push(page);
  });
  return items;
}

const box =
  "flex size-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function CatalogPagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  return (
    <nav aria-label="Halaman katalog" className="flex flex-wrap items-center justify-center gap-1.5 pt-6">
      {prevDisabled ? (
        <span className={cn(box, "border-ink-200 text-ink-300")} aria-hidden>
          <ChevronLeftIcon className="size-4" />
        </span>
      ) : (
        <Link
          href={hrefFor(page - 1)}
          aria-label="Halaman sebelumnya"
          className={cn(box, "border-ink-200 bg-white text-ink-700 hover:bg-ink-100")}
        >
          <ChevronLeftIcon className="size-4" />
        </Link>
      )}
      {pageItems(page, pageCount).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-ink-500">
            ...
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              box,
              item === page
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-200 bg-white text-ink-900 hover:bg-ink-100"
            )}
          >
            {item}
          </Link>
        )
      )}
      {nextDisabled ? (
        <span className={cn(box, "border-ink-200 text-ink-300")} aria-hidden>
          <ChevronRightIcon className="size-4" />
        </span>
      ) : (
        <Link
          href={hrefFor(page + 1)}
          aria-label="Halaman berikutnya"
          className={cn(box, "border-ink-200 bg-white text-ink-700 hover:bg-ink-100")}
        >
          <ChevronRightIcon className="size-4" />
        </Link>
      )}
    </nav>
  );
}
