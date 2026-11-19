import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Email wajib diisi")
  .pipe(z.email("Format email belum lengkap"));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi")
    .max(100, "Nama terlalu panjang"),
  email,
  phone: z
    .string()
    .trim()
    .min(1, "Nomor telepon wajib diisi")
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(
      z
        .string()
        .regex(/^(\+62|62|0)8\d{7,12}$/, "Nomor telepon tidak valid, contoh 0813 1122 3344"),
    ),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .max(128, "Kata sandi maksimal 128 karakter"),
});

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function fieldErrorsOf<T>(error: z.ZodError<T>): FieldErrors<T> {
  const errors: FieldErrors<T> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof T | undefined;
    if (key !== undefined && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
