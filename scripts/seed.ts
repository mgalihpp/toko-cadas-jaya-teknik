import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { slugify } from "@/lib/slug";
import { db } from "@/server/db";
import { categories, storeSettings, users } from "@/server/db/schema";

const CATEGORIES = [
  "Bor",
  "Gerinda",
  "Mesin Sirkel",
  "Mesin Serut",
  "Trafo Las",
  "Kompresor",
  "Mesin Cutting",
  "Hammer Drill",
];

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD wajib diisi di .env");
  }
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (!existing) {
    await auth.api.signUpEmail({
      body: { email, password, name: "Owner Cadas Jaya Teknik" },
    });
  }
  await db.update(users).set({ role: "admin" }).where(eq(users.email, email));
  console.log(`Admin siap: ${email}`);
}

async function main() {
  await seedAdmin();
  await db
    .insert(categories)
    .values(CATEGORIES.map((name) => ({ name, slug: slugify(name) })))
    .onConflictDoNothing();
  await db.insert(storeSettings).values({ id: 1 }).onConflictDoNothing();
  console.log("Seed selesai");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
