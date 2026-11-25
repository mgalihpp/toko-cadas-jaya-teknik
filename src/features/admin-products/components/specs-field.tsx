"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SpecRow } from "../schemas";
import { fieldBox } from "../styles";

const PLACEHOLDERS = ["Contoh: Merek", "Contoh: Daya", "Contoh: Diameter mata"];
const specBox = cn(fieldBox, "h-10");

type Props = {
  rows: SpecRow[];
  onChange: (rows: SpecRow[]) => void;
};

export function SpecsField({ rows, onChange }: Props) {
  function update(index: number, patch: Partial<SpecRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-3">
          <Input
            className={cn(specBox, "w-[38%] shrink-0 sm:w-[220px]")}
            placeholder={PLACEHOLDERS[i] ?? "Nama spesifikasi"}
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            aria-label={`Nama spesifikasi ${i + 1}`}
          />
          <Input
            className={cn(specBox, "min-w-0 flex-1")}
            placeholder="Nilai"
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            aria-label={`Nilai spesifikasi ${i + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            className="size-9 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            aria-label={`Hapus baris ${i + 1}`}
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="h-[37px] w-fit gap-2 rounded-md px-4 text-sm/[17px] font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-700"
        onClick={() => onChange([...rows, { key: "", value: "" }])}
      >
        <PlusIcon />
        Tambah baris
      </Button>
    </>
  );
}
