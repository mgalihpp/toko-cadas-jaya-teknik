"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BanknoteIcon,
  ClockIcon,
  LandmarkIcon,
  MapPinIcon,
  RefreshCwIcon,
  StoreIcon,
  TriangleAlertIcon,
  TruckIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MButton } from "@/components/mobile/m-button";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { todayHours } from "@/features/admin-settings/hours";
import { ProductThumb, type CartData } from "@/features/cart";
import { useCartSelection } from "@/features/cart/selection";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { getPreferredFulfillment } from "../preference";
import {
  checkoutSchema,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutValues,
} from "../schemas";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <section className="flex flex-col gap-2.5 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
        {children}
      </section>
      <div className="h-1.5 shrink-0" />
    </>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink-900">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
    </div>
  );
}

const inputClass = (bad?: boolean) =>
  cn(
    "h-12 w-full rounded-[10px] bg-white px-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-500",
    bad
      ? "border-2 border-error"
      : "border-[1.5px] border-ink-200 focus:border-2 focus:border-brand-600",
  );

export function CheckoutForm({
  cart,
  defaults,
  onPlaced,
}: {
  cart: CartData;
  defaults: { recipientName: string; phone: string };
  onPlaced: (code: string) => void;
}) {
  const trpc = useTRPC();
  const client = useTRPCClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const settings = useQuery(trpc.settings.get.queryOptions());
  const selection = useCartSelection(cart.items.map((i) => i.id));
  const chosen = cart.items.filter((i) => selection.isSelected(i.id));

  const [values, setValues] = useState<CheckoutValues>({
    ...defaults,
    fulfillment: "ambil",
    address: "",
    paymentMethod: "transfer",
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [conflict, setConflict] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    const preferred = getPreferredFulfillment();
    if (preferred) setValues((v) => ({ ...v, fulfillment: preferred }));
  }, []);

  useEffect(() => {
    if (chosen.length === 0) router.replace("/keranjang");
  }, [chosen.length, router]);

  const cartKey = trpc.cart.list.queryKey();
  const subtotal = chosen.reduce((s, i) => s + i.price * i.quantity, 0);
  const unavailable = chosen.filter((i) => !i.purchasable);
  const hasProblem = unavailable.length > 0 || conflict !== null;

  const checkout = useMutation(
    trpc.orders.checkout.mutationOptions({
      onSuccess: ({ code }) => {
        toast.success(`Pesanan ${code} dibuat`);
        onPlaced(code);
        router.replace(`/pesanan/${code}/bayar`);
        queryClient.invalidateQueries({ queryKey: cartKey });
      },
      onError: (error) => {
        const fieldErrors = error.data?.zodError?.fieldErrors as
          | Partial<Record<CheckoutField, string[]>>
          | undefined;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          setErrors(
            Object.fromEntries(
              Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]]),
            ) as CheckoutErrors,
          );
          return;
        }
        queryClient.invalidateQueries({ queryKey: cartKey });
        if (error.data?.code === "CONFLICT") {
          setConflict(error.message.replace(/\.$/, ""));
          return;
        }
        toast.error(error.message);
      },
    }),
  );
  const busy = checkout.isPending || checkout.isSuccess;

  function update<K extends CheckoutField>(key: K, value: CheckoutValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function submit() {
    if (busy) return;
    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      const next: CheckoutErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as CheckoutField;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    checkout.mutate({
      ...parsed.data,
      address: parsed.data.fulfillment === "kirim" ? parsed.data.address : undefined,
      cartItemIds: chosen.map((i) => i.id),
    });
  }

  async function updateCart() {
    setAdjusting(true);
    try {
      const fresh = await client.cart.list.query();
      for (const item of fresh.items) {
        if (item.purchasable) continue;
        if (item.isActive && item.available > 0) {
          await client.cart.setQuantity.mutate({ productId: item.productId, quantity: item.available });
        } else {
          await client.cart.remove.mutate({ productId: item.productId });
        }
      }
      await queryClient.invalidateQueries({ queryKey: cartKey });
      setConflict(null);
      toast.info("Keranjang diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui keranjang");
    } finally {
      setAdjusting(false);
    }
  }

  const storeAddress = settings.data?.address || "[ALAMAT TOKO]";
  const hours = settings.data?.openingHours ? todayHours(settings.data.openingHours) : null;
  const storeLine = `${storeAddress}${hours?.open ? ` · Buka ${hours.from.replace(":", ".")} – ${hours.to.replace(":", ".")}` : ""}`;
  const shippingValue = values.fulfillment === "kirim" ? "Dikonfirmasi Owner" : "Rp0";

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
        className="flex flex-1 flex-col pb-[76px]"
      >
        {hasProblem ? (
          <div className="bg-white px-3 py-2.5">
            <div className="flex gap-2.5 rounded-[10px] border border-error-border bg-error-soft p-3">
              <TriangleAlertIcon className="size-5 shrink-0 text-error" strokeWidth={2} />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold text-error">Stok tidak cukup</p>
                <p className="text-[13px] text-ink-900">
                  {conflict
                    ? `${conflict}. Perbarui keranjangmu dulu sebelum membuat pesanan.`
                    : "Satu produk habis. Perbarui keranjangmu dulu sebelum membuat pesanan."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <Section title="Pengambilan">
          <div className="flex rounded-[10px] bg-ink-50 p-[3px]" role="tablist" aria-label="Cara pengambilan">
            {(
              [
                ["kirim", "Kirim", TruckIcon],
                ["ambil", "Ambil di toko", StoreIcon],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={values.fulfillment === value}
                onClick={() => update("fulfillment", value)}
                className={cn(
                  "flex h-[42px] flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-bold",
                  values.fulfillment === value
                    ? "bg-white text-brand-700 shadow-[0_1px_4px_rgba(10,40,70,.15)]"
                    : "text-ink-500",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
          {values.fulfillment === "ambil" ? (
            <div className="flex items-center gap-2.5">
              <MapPinIcon className="size-5 shrink-0 text-brand-600" strokeWidth={1.8} />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold text-ink-900">Cadas Jaya Teknik</p>
                <p className="text-[13px] text-ink-500">{storeLine}</p>
              </div>
            </div>
          ) : (
            <Field id="address" label="Alamat pengiriman" error={errors.address}>
              <textarea
                id="address"
                rows={3}
                value={values.address ?? ""}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Alamat lengkap penerima"
                className={cn(inputClass(Boolean(errors.address)), "h-auto py-3")}
              />
            </Field>
          )}
        </Section>

        <Section title="Data penerima">
          <Field id="recipientName" label="Nama penerima" error={errors.recipientName}>
            <input
              id="recipientName"
              autoComplete="name"
              value={values.recipientName}
              onChange={(e) => update("recipientName", e.target.value)}
              className={inputClass(Boolean(errors.recipientName))}
            />
          </Field>
          <Field id="phone" label="Nomor telepon" error={errors.phone}>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0812 3456 7890"
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass(Boolean(errors.phone))}
            />
          </Field>
        </Section>

        <Section title="Ringkasan pesanan">
          <ul className="flex flex-col">
            {chosen.map((item) => {
              const bad = !item.purchasable;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2.5 py-2",
                    bad && "-mx-3 bg-error-soft px-3",
                  )}
                >
                  <ProductThumb src={item.image} alt="" className="size-14" />
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <p className="line-clamp-2 text-[13px] font-medium text-ink-900">{item.name}</p>
                    {bad ? (
                      <p className="text-xs font-bold text-error">Habis. Baru saja dipesan pelanggan lain.</p>
                    ) : (
                      <p className="text-xs text-ink-500">
                        {formatRupiah(item.price)} · x{item.quantity}
                      </p>
                    )}
                  </div>
                  {bad ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-error-soft px-2 py-[3px] text-[11px] font-bold text-error">
                      <TriangleAlertIcon className="size-3" />
                      Habis
                    </span>
                  ) : (
                    <p className="text-sm font-bold text-ink-900">{formatRupiah(item.price * item.quantity)}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Metode pembayaran">
          <div className="flex gap-2" role="radiogroup" aria-label="Metode pembayaran">
            {(
              [
                ["transfer", "Transfer", "Unggah bukti bayar", LandmarkIcon],
                ["tunai", "Tunai", values.fulfillment === "ambil" ? "Bayar saat ambil" : "Bayar saat diterima", BanknoteIcon],
              ] as const
            ).map(([value, label, hint, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={values.paymentMethod === value}
                onClick={() => update("paymentMethod", value)}
                className={cn(
                  "flex flex-1 flex-col gap-1 rounded-[10px] border-2 p-2.5 text-left",
                  values.paymentMethod === value
                    ? "border-brand-600 bg-brand-50"
                    : "border-ink-200 bg-white",
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                  <Icon className="size-[18px] text-brand-600" strokeWidth={2} />
                  {label}
                </span>
                <span className="text-[11px] text-ink-500">{hint}</span>
              </button>
            ))}
          </div>
        </Section>

        <section className="flex flex-col gap-2 bg-white p-3">
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm text-ink-500">Subtotal produk</p>
            <p className="text-sm font-medium text-ink-900">{formatRupiah(subtotal)}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm text-ink-500">Ongkir</p>
            <p className="text-sm font-medium text-ink-900">{shippingValue}</p>
          </div>
          <div className="h-px bg-ink-200" />
          <div className="flex items-center gap-2">
            <p className="flex-1 text-[15px] font-bold text-ink-900">Total pembayaran</p>
            <p className="text-lg font-bold text-brand-700">{formatRupiah(subtotal)}</p>
          </div>
        </section>
        <div className="h-2" />
        <div className="px-3 pb-3">
          <div className="flex gap-2.5 rounded-[10px] border border-info-border bg-info-soft p-3">
            <ClockIcon className="size-5 shrink-0 text-brand-700" strokeWidth={2} />
            <p className="text-[13px] text-ink-900">
              Stokmu kami kunci setelah kamu ketuk Buat pesanan.
              {values.paymentMethod === "transfer"
                ? ` Transfer dalam ${settings.data?.paymentWindowHours ?? 24} jam, kalau tidak pesanan dibatalkan otomatis.`
                : ""}
            </p>
          </div>
        </div>
      </form>

      <StickyBar>
        <div className="flex flex-1 flex-col">
          <span className="text-xs text-ink-500">Total pembayaran</span>
          <span className="text-[17px] leading-[1.3] font-bold text-brand-700">{formatRupiah(subtotal)}</span>
        </div>
        {hasProblem ? (
          <MButton size="lg" className="w-[190px]" loading={adjusting} onClick={updateCart}>
            <RefreshCwIcon className="size-[18px]" />
            Perbarui keranjang
          </MButton>
        ) : (
          <MButton size="lg" className="w-[170px]" loading={busy} onClick={submit}>
            Buat pesanan
          </MButton>
        )}
      </StickyBar>
    </>
  );
}
