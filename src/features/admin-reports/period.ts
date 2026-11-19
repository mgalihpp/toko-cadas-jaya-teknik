import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { id } from "date-fns/locale";

export type ReportMode = "harian" | "bulanan" | "rentang";
export type GroupBy = "day" | "month";

export const MAX_RANGE_DAYS = 366;

export type ReportPeriod = {
  from: Date;
  to: Date;
  groupBy: GroupBy;
  caption: string;
};

export type ReportRow = { period: string; label: string; total: number; transactions: number };

function parseDay(value: string) {
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

export type PeriodInput = {
  mode: ReportMode;
  month: string;
  year: number;
  rangeFrom: string;
  rangeTo: string;
};

export function resolvePeriod(input: PeriodInput): ReportPeriod | { error: string } {
  if (input.mode === "harian") {
    const month = parse(input.month, "yyyy-MM", new Date());
    if (!isValid(month)) return { error: "Pilih bulan terlebih dahulu" };
    const from = startOfMonth(month);
    return {
      from,
      to: addMonths(from, 1),
      groupBy: "day",
      caption: format(from, "MMMM yyyy", { locale: id }),
    };
  }
  if (input.mode === "bulanan") {
    const from = startOfYear(new Date(input.year, 0, 1));
    return {
      from,
      to: addMonths(from, 12),
      groupBy: "month",
      caption: `Januari sampai Desember ${input.year}`,
    };
  }
  const start = parseDay(input.rangeFrom);
  const end = parseDay(input.rangeTo);
  if (!start || !end) return { error: "Isi tanggal awal dan akhir" };
  if (end < start) return { error: "Tanggal akhir harus sesudah tanggal awal" };
  if (differenceInCalendarDays(end, start) + 1 > MAX_RANGE_DAYS) {
    return { error: `Rentang maksimal ${MAX_RANGE_DAYS} hari` };
  }
  return {
    from: startOfDay(start),
    to: addDays(startOfDay(end), 1),
    groupBy: "day",
    caption: `${format(start, "d MMM yyyy", { locale: id })} sampai ${format(end, "d MMM yyyy", { locale: id })}`,
  };
}

export function fillRows(
  period: ReportPeriod,
  rows: { period: string; total: number; transactions: number }[]
): ReportRow[] {
  const byKey = new Map(rows.map((r) => [r.period, r]));
  const result: ReportRow[] = [];
  const step = period.groupBy === "day" ? (d: Date) => addDays(d, 1) : (d: Date) => addMonths(d, 1);
  for (let cursor = period.from; cursor < period.to; cursor = step(cursor)) {
    const key = format(cursor, "yyyy-MM-dd");
    const row = byKey.get(key);
    result.push({
      period: key,
      label:
        period.groupBy === "day"
          ? format(cursor, "d MMM", { locale: id })
          : format(cursor, "MMM", { locale: id }),
      total: row?.total ?? 0,
      transactions: row?.transactions ?? 0,
    });
  }
  return result;
}

export function longLabel(row: ReportRow, groupBy: GroupBy) {
  const date = parse(row.period, "yyyy-MM-dd", new Date());
  return groupBy === "day"
    ? format(date, "EEEE, d MMMM yyyy", { locale: id })
    : format(date, "MMMM yyyy", { locale: id });
}
