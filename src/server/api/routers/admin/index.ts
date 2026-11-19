import { createTRPCRouter } from "../../trpc";
import { adminCategoriesRouter } from "./categories";
import { adminFinanceRouter } from "./finance";
import { adminOrdersRouter } from "./orders";
import { adminProductsRouter } from "./products";
import { adminStockRouter } from "./stock";

export const adminRouter = createTRPCRouter({
  categories: adminCategoriesRouter,
  products: adminProductsRouter,
  stock: adminStockRouter,
  orders: adminOrdersRouter,
  finance: adminFinanceRouter,
});
