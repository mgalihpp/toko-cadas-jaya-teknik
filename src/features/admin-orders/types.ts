import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type Inputs = inferRouterInputs<AppRouter>;
type Outputs = inferRouterOutputs<AppRouter>;

export type AdminOrderListItem = Outputs["admin"]["orders"]["list"]["items"][number];
export type AdminOrderDetail = Outputs["admin"]["orders"]["byCode"];
export type AdminOrderPayment = AdminOrderDetail["payments"][number];
export type PaymentMethod = AdminOrderDetail["paymentMethod"];
export type Fulfillment = AdminOrderDetail["fulfillment"];
export type PaymentStatus = AdminOrderPayment["status"];
export type OrderStatusFilter = NonNullable<Inputs["admin"]["orders"]["list"]["status"]>;
