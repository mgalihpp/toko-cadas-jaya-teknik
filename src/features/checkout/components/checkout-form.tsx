"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CircleAlert,
  Copy,
  Landmark,
  Lock,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ProductThumb, summarize, type CartData } from "@/features/cart";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import {
  checkoutSchema,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutValues,
} from "../schemas";
import { OptionCard } from "./option-card";
import { StockConflictDialog } from "./stock-conflict-dialog";

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

  const [values, setValues] = useState<CheckoutValues>({
    ...defaults,
    fulfillment: "kirim",
    address: "",
    paymentMethod: "transfer",
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [conflict, setConflict] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  const cartKey = trpc.cart.list.queryKey();
  const summary = summarize(cart.items);

  const checkout = useMutation(
    trpc.orders.checkout.mutationOptions({
      onSuccess: ({ code }) => {
        toast.success(`Pesanan ${code} dibuat`, {
          description: "Stok sudah dikunci untukmu.",
        });
        onPlaced(code);
        router.replace(`/pesanan/${code}`);
        queryClient.invalidateQueries({ queryKey: cartKey });
      },
      onError: (error) => {
        const fieldErrors = error.data?.zodError?.fieldErrors as
          | Partial<Record<CheckoutField, string[]>>
          | undefined;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          setErrors(
            Object.fromEntries(
              Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])
            ) as CheckoutErrors
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
    })
  );

  const busy = checkout.isPending || checkout.isSuccess;

  function update<K extends CheckoutField>(key: K, value: CheckoutValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function submit(event?: React.FormEvent) {
    event?.preventDefault();
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
    });
  }

  async function continueWithoutUnavailable() {
    setAdjusting(true);
    try {
      const fresh = await client.cart.list.query();
      const keep = fresh.items.filter((i) => i.purchasable || (i.isActive && i.available > 0));
      if (keep.length === 0) {
        router.push("/keranjang");
        return;
      }
      for (const item of fresh.items) {
        if (item.purchasable) continue;
        if (item.isActive && item.available > 0) {
          await client.cart.setQuantity.mutate({
            productId: item.productId,
            quantity: item.available,
          });
        } else {
          await client.cart.remove.mutate({ productId: item.productId });
        }
      }
      await queryClient.invalidateQueries({ queryKey: cartKey });
      setConflict(null);
      toast.info("Keranjang diperbarui", {
        description: "Periksa kembali ringkasan pesanan sebelum membuat pesanan.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui keranjang");
    } finally {
      setAdjusting(false);
    }
  }

  const banks = settings.data?.bankAccounts ?? [];
  const storeAddress = settings.data?.address || "Alamat toko dikonfirmasi Owner";
  const shippingLabel = values.fulfillment === "kirim" ? "Menunggu konfirmasi" : "Tidak ada";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14"
    >
      <div className="flex flex-col gap-10 lg:gap-11">
        <h1 className="font-heading text-3xl font-bold text-ink-900 lg:text-[40px]">Checkout</h1>

        <Section step={1} title="Data penerima">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="recipientName"
              label="Nama penerima"
              autoComplete="name"
              value={values.recipientName}
              error={errors.recipientName}
              onChange={(v) => update("recipientName", v)}
            />
            <TextField
              id="phone"
              label="Nomor telepon"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0812 3456 7890"
              value={values.phone}
              error={errors.phone}
              onChange={(v) => update("phone", v)}
            />
          </div>
        </Section>

        <Section step={2} title="Pengambilan">
          <RadioGroup
            value={values.fulfillment}
            onValueChange={(v) => update("fulfillment", v as CheckoutValues["fulfillment"])}
            className="grid gap-3 sm:grid-cols-2 sm:gap-4"
            aria-label="Cara pengambilan"
          >
            <OptionCard
              value="ambil"
              title="Ambil di toko"
              description={storeAddress}
              icon={Store}
              checked={values.fulfillment === "ambil"}
            />
            <OptionCard
              value="kirim"
              title="Dikirim ke alamat"
              description="Ongkir dikonfirmasi Owner"
              icon={Truck}
              checked={values.fulfillment === "kirim"}
            />
          </RadioGroup>
          {values.fulfillment === "kirim" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="address" className="text-sm font-medium text-ink-900">
                Alamat lengkap
              </Label>
              <Textarea
                id="address"
                rows={3}
                autoComplete="street-address"
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota"
                value={values.address ?? ""}
                aria-invalid={Boolean(errors.address)}
                onChange={(e) => update("address", e.target.value)}
                className="min-h-22 bg-background px-3 py-3 leading-relaxed"
              />
              {errors.address ? (
                <p className="text-[13px] text-error">{errors.address}</p>
              ) : (
                <p className="text-[13px] text-ink-500">
                  Sertakan patokan agar mudah ditemukan kurir.
                </p>
              )}
            </div>
          ) : null}
        </Section>

        <Section step={3} title="Pembayaran">
          <RadioGroup
            value={values.paymentMethod}
            onValueChange={(v) => update("paymentMethod", v as CheckoutValues["paymentMethod"])}
            className="grid gap-3 sm:grid-cols-2 sm:gap-4"
            aria-label="Metode pembayaran"
          >
            <OptionCard
              value="transfer"
              title="Transfer bank"
              description="Unggah bukti maksimal 24 jam"
              icon={Landmark}
              checked={values.paymentMethod === "transfer"}
            />
            <OptionCard
              value="tunai"
              title="Tunai"
              description="Bayar saat serah terima barang"
              icon={Banknote}
              checked={values.paymentMethod === "tunai"}
            />
          </RadioGroup>
          {values.paymentMethod === "transfer" ? (
            <BankAccounts loading={settings.isPending} banks={banks} />
          ) : null}
        </Section>
      </div>

      <aside className="flex flex-col gap-5 rounded-2xl border border-border p-6 lg:sticky lg:top-24 lg:p-7">
        <h2 className="font-heading text-xl font-semibold text-ink-900">Pesananmu</h2>

        {summary.unavailableCount > 0 ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-error-border bg-error-soft p-3.5 text-[13px] font-medium text-error"
          >
            <CircleAlert className="mt-px size-4 shrink-0" />
            <p>
              {summary.unavailableCount} produk stoknya habis atau berubah.{" "}
              <Link href="/keranjang" className="underline underline-offset-2">
                Perbarui keranjang
              </Link>{" "}
              untuk melanjutkan.
            </p>
          </div>
        ) : null}

        <ul className="flex flex-col gap-3.5">
          {cart.items.map((item) => (
            <li
              key={item.id}
              className={cn("flex items-center gap-3.5", !item.purchasable && "opacity-50")}
            >
              <ProductThumb src={item.image} alt={item.name} className="size-14 rounded-[10px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="line-clamp-2 text-sm font-semibold text-ink-900">{item.name}</p>
                <p className="text-xs text-ink-500">
                  {item.purchasable
                    ? `${item.quantity} x ${formatRupiah(item.price)}`
                    : "Stok tidak mencukupi"}
                </p>
              </div>
              <p className="text-sm font-semibold text-ink-900">
                {formatRupiah(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-2.5 border-y border-border py-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-600">Subtotal</dt>
            <dd className="font-medium text-ink-900">{formatRupiah(summary.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-600">Ongkos kirim</dt>
            <dd className="font-medium text-ink-900">{shippingLabel}</dd>
          </div>
        </dl>

        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold text-ink-900">Total bayar</span>
          <span className="font-heading text-2xl font-bold text-ink-900 lg:text-[26px]">
            {formatRupiah(summary.subtotal)}
          </span>
        </div>

        <p className="flex items-start gap-2.5 rounded-[10px] bg-info-soft p-3.5 text-[13px] font-medium text-info">
          <Lock className="mt-px size-4 shrink-0" />
          Stok dikunci untukmu setelah pesanan dibuat
        </p>

        <Button
          type="submit"
          size="lg"
          className="h-12 text-[15px]"
          disabled={busy || !cart.canCheckout}
        >
          {busy ? (
            <>
              <Spinner />
              Membuat pesanan
            </>
          ) : (
            "Buat Pesanan"
          )}
        </Button>
        {busy ? (
          <p className="-mt-2 text-center text-xs text-ink-500">
            Tombol dinonaktifkan selama proses agar pesanan tidak terkirim dua kali
          </p>
        ) : null}
      </aside>

      <StockConflictDialog
        message={conflict}
        onOpenChange={(open) => !open && !adjusting && setConflict(null)}
        onContinue={continueWithoutUnavailable}
        continuing={adjusting}
        canContinue={cart.items.length > 1}
      />
    </form>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="flex items-center gap-3 text-xl font-semibold text-ink-900">
        <span className="flex size-7 items-center justify-center rounded-full bg-ink-900 text-[13px] font-bold text-white">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TextField({
  id,
  label,
  error,
  onChange,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "onChange" | "id">) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium text-ink-900">
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 bg-background px-3"
        {...props}
      />
      {error ? <p className="text-[13px] text-error">{error}</p> : null}
    </div>
  );
}

function BankAccounts({
  loading,
  banks,
}: {
  loading: boolean;
  banks: { bank: string; number: string; holder: string }[];
}) {
  if (loading) return <Skeleton className="h-24 rounded-xl" />;
  if (banks.length === 0) {
    return (
      <p className="rounded-xl bg-surface p-5 text-sm text-ink-600">
        Nomor rekening toko akan ditampilkan di halaman pesanan setelah dikonfirmasi Owner.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {banks.map((b) => (
        <li
          key={`${b.bank}-${b.number}`}
          className="flex flex-wrap items-center gap-4 rounded-xl bg-surface p-4 sm:flex-nowrap sm:gap-5 sm:p-5"
        >
          <span className="flex h-10 min-w-14 max-w-28 shrink-0 items-center justify-center truncate rounded-lg bg-info px-2 text-center text-[13px] font-extrabold text-white">
            {b.bank}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-lg font-semibold tracking-wide text-ink-900">{b.number}</p>
            <p className="text-[13px] text-ink-600">
              a.n. {b.holder} · {b.bank}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-10"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(b.number.replace(/\s/g, ""));
                toast.success("Nomor rekening disalin");
              } catch {
                toast.error("Gagal menyalin, salin manual ya");
              }
            }}
          >
            <Copy />
            Salin
          </Button>
        </li>
      ))}
    </ul>
  );
}
