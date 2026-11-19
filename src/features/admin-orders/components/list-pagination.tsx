"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ListPaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function ListPagination({ page, pageCount, total, onPageChange }: ListPaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-ink-500">
      <span>
        Halaman {page} dari {pageCount}, {total} data
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
