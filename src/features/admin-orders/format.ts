const time = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const dayMonth = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatWhen(value: Date | string, now = new Date()): string {
  const date = new Date(value);
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return time.format(date);
  if (diffDays === 1) return "Kemarin";
  return dayMonth.format(date);
}

export function formatDayTime(value: Date | string): string {
  const date = new Date(value);
  return `${dayMonth.format(date)}, ${time.format(date)}`;
}
