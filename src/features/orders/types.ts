import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type Outputs = inferRouterOutputs<AppRouter>;

export type OrderListItem = Outputs["orders"]["list"][number];
export type OrderDetail = Outputs["orders"]["byCode"];
export type OrderStatus = OrderDetail["status"];
