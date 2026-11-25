export const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;
export type Day = (typeof DAYS)[number];

export type DayHours = { open: boolean; from: string; to: string };
export type WeekHours = Record<Day, DayHours>;

export function defaultWeek(): WeekHours {
  const base = { open: true, from: "08:00", to: "17:00" };
  return Object.fromEntries(
    DAYS.map((d) => [d, d === "Minggu" ? { ...base, open: false } : { ...base }])
  ) as WeekHours;
}

const RANGE = /(\d{1,2})[.:](\d{2})\s*(?:-|–|sampai|s\/d)\s*(\d{1,2})[.:](\d{2})/i;
const pad = (n: string) => n.padStart(2, "0");

export function parseWeek(text: string): WeekHours {
  const week = defaultWeek();
  for (const line of text.split(/\r?\n/)) {
    const sep = line.indexOf(":");
    if (sep < 1) continue;
    const day = DAYS.find((d) => d.toLowerCase() === line.slice(0, sep).trim().toLowerCase());
    if (!day) continue;
    const value = line.slice(sep + 1).trim();
    const m = RANGE.exec(value);
    week[day] = m
      ? { open: true, from: `${pad(m[1])}:${m[2]}`, to: `${pad(m[3])}:${m[4]}` }
      : { ...week[day], open: !/tutup/i.test(value) };
  }
  return week;
}

export function serializeWeek(week: WeekHours): string {
  return DAYS.map((d) => {
    const h = week[d];
    return `${d}: ${h.open ? `${h.from.replace(":", ".")} - ${h.to.replace(":", ".")}` : "Tutup"}`;
  }).join("\n");
}
