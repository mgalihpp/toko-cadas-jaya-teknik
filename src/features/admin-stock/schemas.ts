import { z } from "zod";

export const ADJUST_MODES = ["tambah", "kurangi", "atur"] as const;
export type AdjustMode = (typeof ADJUST_MODES)[number];

export const ADJUST_MODE_LABEL: Record<AdjustMode, string> = {
  tambah: "Tambah",
  kurangi: "Kurangi",
  atur: "Atur ulang",
};

export const REASONS = [
  "Barang masuk dari distributor",
  "Hasil stok opname",
  "Barang rusak atau hilang",
  "Retur dari pelanggan",
  "Koreksi input",
] as const;

export function computeNewPhysical(mode: AdjustMode, current: number, amount: number) {
  if (mode === "tambah") return current + amount;
  if (mode === "kurangi") return current - amount;
  return amount;
}

export function adjustStockSchema(stockPhysical: number, stockLocked: number) {
  return z
    .object({
      mode: z.enum(ADJUST_MODES),
      amount: z
        .string()
        .trim()
        .min(1, "Jumlah wajib diisi")
        .transform(Number)
        .pipe(z.number({ error: "Jumlah harus angka" }).int("Jumlah harus bilangan bulat").min(0, "Jumlah tidak boleh negatif")),
      reason: z.string().trim().min(3, "Tulis alasan penyesuaian").max(120, "Alasan terlalu panjang"),
      note: z.string().trim().max(160, "Catatan maksimal 160 karakter"),
    })
    .transform((v, ctx) => {
      const newPhysical = computeNewPhysical(v.mode, stockPhysical, v.amount);
      if (newPhysical < stockLocked) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: `Stok fisik tidak boleh di bawah stok terkunci (${stockLocked})`,
        });
        return z.NEVER;
      }
      if (newPhysical === stockPhysical) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: "Stok tidak berubah" });
        return z.NEVER;
      }
      return {
        newPhysical,
        note: v.note ? `${v.reason}. ${v.note}` : v.reason,
      };
    });
}
