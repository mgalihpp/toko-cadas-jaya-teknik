import { z } from "zod";

export const categoryNameSchema = z
  .string()
  .trim()
  .min(2, "Nama kategori minimal 2 karakter")
  .max(80, "Nama kategori maksimal 80 karakter");
