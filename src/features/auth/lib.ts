export function safeNextPath(value: unknown, fallback = "/"): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (typeof path !== "string") return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return fallback;
  }
  return path;
}

type AuthError = { code?: string; status?: number; message?: string };

export function authErrorMessage(error: AuthError): string {
  if (error.status === 429) {
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  }
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Email atau kata sandi salah.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Email ini sudah terdaftar. Silakan masuk.";
    case "INVALID_EMAIL":
      return "Format email belum lengkap.";
    case "PASSWORD_TOO_SHORT":
      return "Kata sandi minimal 8 karakter.";
    default:
      return "Terjadi kesalahan. Coba lagi beberapa saat lagi.";
  }
}
