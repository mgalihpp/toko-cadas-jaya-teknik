"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatRupiah } from "@/lib/format";

const config = {
  total: { label: "Penjualan", color: "var(--chart-1)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

export type SalesPoint = { key: string; label: string; total: number };

export function SalesChart({ data }: { data: SalesPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
        <YAxis
          width={44}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => compact.format(v)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.key ?? ""}
              formatter={(value) => (
                <span className="font-medium text-ink-900 tabular-nums">
                  {formatRupiah(Number(value))}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
