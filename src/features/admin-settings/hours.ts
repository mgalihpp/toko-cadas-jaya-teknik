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

export function todayHours(text: string, now = new Date()): DayHours & { day: Day } {
  const day = DAYS[(now.getDay() + 6) % 7];
  return { day, ...parseWeek(text)[day] };
}

export function summarizeWeek(week: WeekHours): { open: string; closed: string | null } {
  const groups: { from: Day; to: Day; hours: string }[] = [];
  const closed: Day[] = [];
  for (const day of DAYS) {
    const h = week[day];
    if (!h.open) {
      closed.push(day);
      continue;
    }
    const hours = `${h.from.replace(":", ".")} – ${h.to.replace(":", ".")}`;
    const prev = groups.at(-1);
    if (prev && prev.hours === hours && DAYS.indexOf(prev.to) === DAYS.indexOf(day) - 1) prev.to = day;
    else groups.push({ from: day, to: day, hours });
  }
  const open = groups
    .map((g) => `${g.from === g.to ? g.from : `${g.from} – ${g.to}`} · ${g.hours}`)
    .join("; ");
  return { open, closed: closed.length ? closed.join(", ") : null };
}
