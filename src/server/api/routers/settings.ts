import { z } from "zod";
import { storeSettings } from "@/server/db/schema";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../trpc";

const settingsInput = z.object({
  bankAccounts: z
    .array(
      z.object({
        bank: z.string().trim().min(1),
        number: z.string().trim().min(1),
        holder: z.string().trim().min(1),
        primary: z.boolean().optional(),
      })
    )
    .max(10),
  address: z.string().trim().max(500),
  phone: z.string().trim().max(30),
  email: z.union([z.literal(""), z.email().max(120)]),
  paymentWindowHours: z.number().int().min(1).max(168),
  openingHours: z.string().trim().max(300),
});

export const settingsRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db.select().from(storeSettings).limit(1);
    return (
      row ?? {
        id: 1,
        bankAccounts: [],
        address: "",
        phone: "",
        email: "",
        paymentWindowHours: 24,
        openingHours: "",
        updatedAt: new Date(0),
      }
    );
  }),

  update: adminProcedure.input(settingsInput).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .insert(storeSettings)
      .values({ id: 1, ...input })
      .onConflictDoUpdate({ target: storeSettings.id, set: input })
      .returning();
    return row;
  }),
});
