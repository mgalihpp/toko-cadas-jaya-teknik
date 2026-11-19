import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type Outputs = inferRouterOutputs<AppRouter>["catalog"];
type Inputs = inferRouterInputs<AppRouter>["catalog"];

export type Condition = "baru" | "bekas";
export type ProductListInput = Inputs["products"];
export type ProductList = Outputs["products"];
export type ProductSummary = ProductList["items"][number];
export type ProductDetail = Outputs["productBySlug"];
export type CategoryWithCount = Outputs["categories"][number];
