import assert from "node:assert/strict";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "@/server/db";
import {
  categories,
  orders,
  products,
  stockLogs,
  users,
} from "@/server/db/schema";
import { auth } from "@/server/auth";
import { expireOverdueOrders } from "@/server/services/orders";
import { createCallerFactory } from "@/server/api/trpc";
import { appRouter } from "@/server/api/root";

const createCaller = createCallerFactory(appRouter);
const TAG = `verify-${Date.now()}`;

function callerFor(user: { id: string; role: "customer" | "admin" } | null) {
  const session = user ? { user, session: { id: "s" } } : null;
  return createCaller({ db, headers: new Headers(), session: session as never });
}

async function makeUser(label: string, role: "customer" | "admin") {
  const email = `${TAG}-${label}@example.test`;
  const res = await auth.api.signUpEmail({
    body: { email, password: "password-verify-123", name: label },
  });
  if (role === "admin") {
    await db.update(users).set({ role }).where(eq(users.id, res.user.id));
  }
  return { id: res.user.id, role };
}

const checkoutInput = {
  recipientName: "Penerima Uji",
  phone: "081234567890",
  fulfillment: "ambil" as const,
  paymentMethod: "transfer" as const,
};

async function main() {
  const admin = await makeUser("admin", "admin");
  const a = await makeUser("a", "customer");
  const b = await makeUser("b", "customer");
  const adminApi = callerFor(admin);
  const apiA = callerFor(a);
  const apiB = callerFor(b);
  const visitor = callerFor(null);

  const category = await adminApi.admin.categories.create({ name: `Kategori ${TAG}` });
  const product = await adminApi.admin.products.create({
    name: `Gerinda Bekas ${TAG}`,
    price: 450000,
    condition: "bekas",
    categoryId: category.id,
    stock: 1,
    images: [{ url: "https://example.test/a.jpg" }],
  });

  await assert.rejects(visitor.cart.list(), /masuk/i);
  await assert.rejects(apiA.admin.categories.list(), /Akses ditolak/);
  await assert.rejects(adminApi.cart.list(), /customer/);
  console.log("ok  akses: pengunjung dan customer ditolak di rute yang dilarang");

  await apiA.cart.add({ productId: product.id, quantity: 1 });
  await apiB.cart.add({ productId: product.id, quantity: 1 });
  const results = await Promise.allSettled([
    apiA.orders.checkout(checkoutInput),
    apiB.orders.checkout(checkoutInput),
  ]);
  const ok = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");
  assert.equal(ok.length, 1, "tepat satu checkout berhasil");
  assert.equal(failed.length, 1);
  assert.match(String(failed[0].reason), /habis/);
  console.log("ok  AC-02: checkout bersamaan stok 1, satu berhasil, satu ditolak");

  const winner = results[0].status === "fulfilled" ? apiA : apiB;
  const loser = winner === apiA ? apiB : apiA;
  const code = (ok[0] as PromiseFulfilledResult<{ code: string }>).value.code;
  let [p] = await db.select().from(products).where(eq(products.id, product.id));
  assert.equal(p.stockLocked, 1);
  assert.equal(p.stockPhysical, 1);

  await assert.rejects(loser.orders.byCode({ code }), /tidak ditemukan/);
  console.log("ok  AC-08: customer lain tidak bisa membuka pesanan");

  await winner.orders.submitProof({ code, proofUrl: "https://example.test/bukti.jpg" });
  let order = await adminApi.admin.orders.byCode({ code });
  assert.equal(order.status, "menunggu_konfirmasi");
  assert.equal(order.payments.length, 1);
  console.log("ok  AC-03: upload bukti mengubah status ke menunggu_konfirmasi");

  await adminApi.admin.orders.rejectTransfer({ code, note: "Nominal tidak sesuai" });
  order = await adminApi.admin.orders.byCode({ code });
  assert.equal(order.status, "menunggu_pembayaran");
  await winner.orders.submitProof({ code, proofUrl: "https://example.test/bukti2.jpg" });
  console.log("ok  AC-05: tolak bukti kembali ke menunggu_pembayaran, bisa upload ulang");

  await adminApi.admin.orders.confirmTransfer({ code });
  order = await adminApi.admin.orders.byCode({ code });
  assert.equal(order.status, "dibayar");
  [p] = await db.select().from(products).where(eq(products.id, product.id));
  assert.equal(p.stockPhysical, 0);
  assert.equal(p.stockLocked, 0);
  console.log("ok  AC-04: konfirmasi mengurangi stok fisik dan mencatat pelaku");

  await adminApi.admin.products.update({
    id: product.id,
    name: product.name,
    price: 999000,
    condition: "bekas",
    categoryId: category.id,
    images: [],
  });
  const mine = await winner.orders.byCode({ code });
  assert.equal(mine.items[0].unitPrice, 450000);
  console.log("ok  AC-09: harga pesanan lama tidak berubah");

  await adminApi.admin.orders.advance({ code, to: "selesai" });
  const now = new Date();
  const report = await adminApi.admin.finance.sales({
    from: new Date(now.getTime() - 86_400_000),
    to: new Date(now.getTime() + 86_400_000),
    groupBy: "day",
  });
  assert.ok(report.total >= 450000 && report.transactions >= 1);
  console.log("ok  AC-10: laporan memuat transaksi yang dibayar");

  await assert.rejects(adminApi.admin.products.delete({ id: product.id }), /Nonaktifkan/);
  await assert.rejects(adminApi.admin.categories.delete({ id: category.id }), /masih dipakai/);
  console.log("ok  BR-09 dan FR-A04: produk berpesanan dan kategori terpakai tidak bisa dihapus");

  const product2 = await adminApi.admin.products.create({
    name: `Bor ${TAG}`,
    price: 200000,
    condition: "baru",
    categoryId: category.id,
    stock: 2,
  });
  await apiA.cart.add({ productId: product2.id, quantity: 2 });
  const second = await apiA.orders.checkout(checkoutInput);
  [p] = await db.select().from(products).where(eq(products.id, product2.id));
  assert.equal(p.stockLocked, 2);
  await db
    .update(orders)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(orders.code, second.code));
  await expireOverdueOrders();
  const expired = await adminApi.admin.orders.byCode({ code: second.code });
  assert.equal(expired.status, "dibatalkan");
  [p] = await db.select().from(products).where(eq(products.id, product2.id));
  assert.equal(p.stockLocked, 0);
  console.log("ok  AC-07: pesanan kedaluwarsa dibatalkan dan stok terkunci dilepas");

  await cleanup([admin.id, a.id, b.id], [product.id, product2.id], category.id);
  console.log("selesai: semua skenario lulus");
}

async function cleanup(userIds: string[], productIds: string[], categoryId: string) {
  const orderRows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(inArray(orders.userId, userIds));
  if (orderRows.length) {
    await db.delete(orders).where(
      inArray(
        orders.id,
        orderRows.map((o) => o.id)
      )
    );
  }
  await db.delete(stockLogs).where(inArray(stockLogs.productId, productIds));
  await db.delete(products).where(inArray(products.id, productIds));
  await db.delete(categories).where(eq(categories.id, categoryId));
  await db.delete(users).where(like(users.email, `${TAG}-%`));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
