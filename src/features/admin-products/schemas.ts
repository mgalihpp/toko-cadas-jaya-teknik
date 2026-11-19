import { z } from "zod";

export const MAX_IMAGES = 10;
export const MAX_DESCRIPTION = 5000;

export type ProductImage = { url: string; fileKey?: string };
export type SpecRow = { key: string; value: string };

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama produk minimal 2 karakter")
      .max(150, "Nama produk maksimal 150 karakter"),
    description: z
      .string()
      .trim()
      .max(MAX_DESCRIPTION, `Deskripsi maksimal ${MAX_DESCRIPTION} karakter`),
    price: z
      .string()
      .transform((v) => Number(v.replace(/\D/g, "")))
      .pipe(z.number().int().positive("Harga harus lebih dari 0")),
    condition: z.enum(["baru", "bekas"]),
    categoryId: z.string().min(1, "Pilih kategori"),
    isActive: z.boolean(),
    stock: z
      .string()
      .transform((v) => Number(v.replace(/\D/g, "") || "0"))
      .pipe(z.number().int().min(0, "Stok tidak boleh negatif")),
    specs: z.array(z.object({ key: z.string(), value: z.string() })),
    images: z
      .array(z.object({ url: z.string(), fileKey: z.string().optional() }))
      .max(MAX_IMAGES, `Maksimal ${MAX_IMAGES} foto`),
  })
  .transform((data, ctx) => {
    const specs: Record<string, string> = {};
    for (const row of data.specs) {
      const key = row.key.trim();
      const value = row.value.trim();
      if (!key && !value) continue;
      if (!key) {
        ctx.addIssue({ code: "custom", path: ["specs"], message: "Nama spesifikasi wajib diisi" });
        return z.NEVER;
      }
      if (key in specs) {
        ctx.addIssue({ code: "custom", path: ["specs"], message: `Spesifikasi "${key}" ditulis dua kali` });
        return z.NEVER;
      }
      specs[key] = value;
    }
    return { ...data, specs };
  });

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;
