import { z } from "zod";

export const checkoutSchema = z
  .object({
    recipientName: z
      .string()
      .trim()
      .min(2, "Nama penerima minimal 2 karakter")
      .max(100, "Nama penerima maksimal 100 karakter"),
    phone: z
      .string()
      .trim()
      .min(8, "Nomor telepon minimal 8 digit")
      .max(20, "Nomor telepon maksimal 20 karakter")
      .regex(/^[0-9+\-\s()]+$/, "Nomor telepon hanya boleh berisi angka"),
    fulfillment: z.enum(["kirim", "ambil"]),
    address: z.string().trim().max(500, "Alamat maksimal 500 karakter").optional(),
    paymentMethod: z.enum(["tunai", "transfer"]),
  })
  .refine((v) => v.fulfillment === "ambil" || (v.address && v.address.length >= 5), {
    path: ["address"],
    message: "Alamat pengiriman wajib diisi",
  });

export type CheckoutValues = z.input<typeof checkoutSchema>;
export type CheckoutField = keyof CheckoutValues;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;
