import { createTRPCRouter } from "./trpc";
import { adminRouter } from "./routers/admin";
import { cartRouter } from "./routers/cart";
import { catalogRouter } from "./routers/catalog";
import { ordersRouter } from "./routers/orders";
import { settingsRouter } from "./routers/settings";

export const appRouter = createTRPCRouter({
  catalog: catalogRouter,
  settings: settingsRouter,
  cart: cartRouter,
  orders: ordersRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
