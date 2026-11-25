import { eq, inArray } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { orderItems, orders, payments, products, users } from "@/server/db/schema";
import {
  generateOrderCode,
  getOrderForUpdate,
  lockStockForItems,
  logStatus,
  markPaidInTx,
} from "@/server/services/orders";

const CUSTOMER_EMAIL = "pelanggan@cadasjaya.test";
const CUSTOMER_PASSWORD = "pelanggan123";

type Spec = {
  recipientName: string;
  phone: string;
  fulfillment: "kirim" | "ambil";
  address: string | null;
  paymentMethod: "tunai" | "transfer";
  lines: { name: string; quantity: number }[];
  finalStatus: "menunggu_pembayaran" | "menunggu_konfirmasi" | "dibayar";
};

const SPECS: Spec[] = [
  {
    recipientName: "Budi Santoso",
    phone: "081234567801",
    fulfillment: "kirim",
    address: "Jl. Cadas Pangeran No. 12, Sumedang",
    paymentMethod: "transfer",
    lines: [{ name: "Bor Listrik 13mm", quantity: 2 }],
    finalStatus: "menunggu_konfirmasi",
  },
  {
    recipientName: "Siti Aminah",
    phone: "081234567802",
    fulfillment: "ambil",
    address: null,
    paymentMethod: "tunai",
    lines: [
      { name: "Gerinda Tangan 4 Inci", quantity: 1 },
      { name: "Mesin Sirkel 7 Inci", quantity: 1 },
    ],
    finalStatus: "menunggu_pembayaran",
  },
  {
    recipientName: "Agus Wijaya",
    phone: "081234567803",
    fulfillment: "kirim",
    address: "Jl. Raya Bandung-Garut KM 5, Cileunyi",
    paymentMethod: "transfer",
    lines: [{ name: "Trafo Las 450 Ampere", quantity: 1 }],
    finalStatus: "dibayar",
  },
];

async function ensureCustomer() {
  const [existing] = await db.select().from(users).where(eq(users.email, CUSTOMER_EMAIL));
  if (existing) return existing;
  await auth.api.signUpEmail({
    body: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD, name: "Pelanggan Contoh" },
  });
  const [created] = await db.select().from(users).where(eq(users.email, CUSTOMER_EMAIL));
  return created;
}

async function main() {
  const customer = await ensureCustomer();
  const [owner] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);

  const already = await db.select().from(orders).where(eq(orders.userId, customer.id));
  if (already.length > 0) {
    console.log(`Pelanggan sudah punya ${already.length} pesanan, seed dilewati`);
    process.exit(0);
  }

  const names = SPECS.flatMap((s) => s.lines.map((l) => l.name));
  const found = await db.select().from(products).where(inArray(products.name, names));
  const byName = new Map(found.map((p) => [p.name, p]));
  const missing = names.filter((n) => !byName.has(n));
  if (missing.length > 0) {
    throw new Error(`Produk belum ada: ${missing.join(", ")}. Jalankan db:seed:mock dulu`);
  }

  for (const spec of SPECS) {
    await db.transaction(async (tx) => {
      const lines = spec.lines.map((l) => {
        const p = byName.get(l.name)!;
        return { productId: p.id, productName: p.name, unitPrice: p.price, quantity: l.quantity };
      });
      const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const [order] = await tx
        .insert(orders)
        .values({
          code: generateOrderCode(),
          userId: customer.id,
          recipientName: spec.recipientName,
          phone: spec.phone,
          fulfillment: spec.fulfillment,
          address: spec.address,
          paymentMethod: spec.paymentMethod,
          total,
          expiresAt:
            spec.paymentMethod === "transfer" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
        })
        .returning();
      await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order.id })));
      await lockStockForItems(tx, lines, order.id, customer.id);
      await logStatus(tx, order.id, null, "menunggu_pembayaran", customer.id, "Pesanan dibuat");

      if (spec.paymentMethod === "transfer" && spec.finalStatus !== "menunggu_pembayaran") {
        const proofUrl = `https://placehold.co/600x800/f5f5f4/78716c/png?text=Bukti+${order.code}`;
        await tx.insert(payments).values({
          orderId: order.id,
          method: "transfer",
          amount: total,
          proofUrl,
          status: spec.finalStatus === "dibayar" ? "diterima" : "menunggu",
          confirmedBy: spec.finalStatus === "dibayar" ? (owner?.id ?? null) : null,
          confirmedAt: spec.finalStatus === "dibayar" ? new Date() : null,
        });
        await logStatus(
          tx,
          order.id,
          "menunggu_pembayaran",
          "menunggu_konfirmasi",
          customer.id,
          "Bukti pembayaran diunggah"
        );
      }
      if (spec.finalStatus === "dibayar") {
        const fresh = await getOrderForUpdate(tx, order.code);
        await markPaidInTx(tx, fresh, owner?.id ?? null, "Pembayaran diterima");
      }
      console.log(`${order.code}  ${spec.finalStatus}  ${spec.recipientName}`);
    });
  }
  console.log(`Selesai. Login pelanggan: ${CUSTOMER_EMAIL} / ${CUSTOMER_PASSWORD}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
