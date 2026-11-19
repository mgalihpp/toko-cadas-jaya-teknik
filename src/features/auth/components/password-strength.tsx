import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Terlalu pendek, minimal 8 karakter", color: "bg-error", text: "text-error" },
  { label: "Lemah. Tambah huruf besar dan angka", color: "bg-error", text: "text-error" },
  { label: "Sedang. Tambah angka atau simbol", color: "bg-warning", text: "text-warning" },
  { label: "Kuat. Tambah simbol agar lebih aman", color: "bg-success", text: "text-success" },
  { label: "Sangat kuat", color: "bg-success", text: "text-success" },
] as const;

function scorePassword(password: string): number {
  if (password.length < 8) return 0;
  return [
    true,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = scorePassword(password);
  const level = LEVELS[score];

  return (
    <div className="-mt-3 flex flex-col gap-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={cn("h-1 flex-1 rounded-full", bar <= Math.max(score, 1) ? level.color : "bg-ink-200")}
          />
        ))}
      </div>
      <p className={cn("text-xs", level.text)}>{level.label}</p>
    </div>
  );
}
