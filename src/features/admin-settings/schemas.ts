import { z } from "zod";

export const MAX_BANK_ACCOUNTS = 10;

export const storeSettingsSchema = z.object({
  bankAccounts: z
    .array(
      z.object({
        bank: z.string().trim().min(1, "Nama bank wajib diisi"),
        number: z
          .string()
          .trim()
          .min(1, "Nomor rekening wajib diisi")
          .regex(/^[0-9 .-]+$/, "Nomor rekening hanya berisi angka"),
        holder: z.string().trim().min(1, "Nama pemilik wajib diisi"),
        primary: z.boolean().optional(),
      })
    )
    .max(MAX_BANK_ACCOUNTS, `Maksimal ${MAX_BANK_ACCOUNTS} rekening`),
  address: z.string().trim().max(500, "Alamat maksimal 500 karakter"),
  phone: z.string().trim().max(30, "Nomor telepon maksimal 30 karakter"),
  email: z.union([z.literal(""), z.email("Format email tidak valid").max(120)]),
  paymentWindowHours: z
    .number("Batas waktu wajib diisi")
    .int("Batas waktu harus bilangan bulat")
    .min(1, "Minimal 1 jam")
    .max(168, "Maksimal 168 jam (7 hari)"),
  openingHours: z.string().trim().max(300, "Jam operasional maksimal 300 karakter"),
});

export type StoreSettingsValues = z.infer<typeof storeSettingsSchema>;
