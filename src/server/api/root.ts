import { createTRPCRouter } from "./trpc";
import { adminRouter } from "./routers/admin";
import { cartRouter } from "./routers/cart";
import { catalogRouter } from "./routers/catalog";
import { favoritesRouter } from "./routers/favorites";
import { notificationsRouter } from "./routers/notifications";
import { ordersRouter } from "./routers/orders";
import { settingsRouter } from "./routers/settings";

export const appRouter = createTRPCRouter({
  catalog: catalogRouter,
  settings: settingsRouter,
  cart: cartRouter,
  orders: ordersRouter,
  favorites: favoritesRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
