"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SpecRow } from "../schemas";

const PLACEHOLDERS = ["Contoh: Merek", "Contoh: Daya", "Contoh: Diameter mata"];

type Props = {
  rows: SpecRow[];
  onChange: (rows: SpecRow[]) => void;
};

export function SpecsField({ rows, onChange }: Props) {
  function update(index: number, patch: Partial<SpecRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            className="h-9 flex-1"
            placeholder={PLACEHOLDERS[i] ?? "Nama spesifikasi"}
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            aria-label={`Nama spesifikasi ${i + 1}`}
          />
          <Input
            className="h-9 flex-1"
            placeholder="Nilai"
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            aria-label={`Nilai spesifikasi ${i + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            aria-label={`Hapus baris ${i + 1}`}
          >
            <Trash2Icon className="text-ink-500" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="w-fit text-brand-600 hover:text-brand-700"
        onClick={() => onChange([...rows, { key: "", value: "" }])}
      >
        <PlusIcon />
        Tambah baris
      </Button>
    </div>
  );
}
