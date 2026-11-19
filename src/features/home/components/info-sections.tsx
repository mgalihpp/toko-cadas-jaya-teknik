import {
  AlarmClockIcon,
  CameraIcon,
  LandmarkIcon,
  LockIcon,
  MapPinIcon,
  PackageCheckIcon,
  PhoneIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  StoreIcon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogHref, CONTAINER } from "@/features/catalog";
import { cn } from "@/lib/utils";
import { getCategories, getStoreSettings } from "../data";

const BANNER_IMAGE =
  "https://images.unsplash.com/photo-1563439633552-1d4b7be86090?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600";

export function NewVsUsed() {
  const columns = [
    {
      tag: "BARU",
      title: "Garansi toko, segel pabrik.",
      desc: "Cocok untuk pekerjaan rutin yang butuh alat awet dan suku cadang mudah dicari.",
      points: [
        { icon: ShieldCheckIcon, text: "Garansi resmi sesuai merek" },
        { icon: PackageCheckIcon, text: "Unit tersegel dari distributor" },
        { icon: ReceiptIcon, text: "Nota pembelian untuk klaim" },
      ],
      cta: "Lihat barang baru",
      href: "/produk?kondisi=baru",
      box: "bg-ink-900 text-white rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none",
      tagClass: "bg-white text-ink-900",
      descClass: "text-ink-300",
      button: "",
    },
    {
      tag: "BEKAS",
      title: "Sudah dicek, harga lebih ringan.",
      desc: "Setiap unit bekas biasanya hanya ada satu, jadi stok langsung dikunci begitu kamu checkout.",
      points: [
        { icon: CameraIcon, text: "Foto kondisi asli dari beberapa sisi" },
        { icon: WrenchIcon, text: "Diuji nyala sebelum dipajang" },
        { icon: LockIcon, text: "Satu unit, tidak terjual ganda" },
      ],
      cta: "Lihat barang bekas",
      href: "/produk?kondisi=bekas",
      box: "bg-accent-yellow text-ink-900 rounded-b-3xl lg:rounded-r-3xl lg:rounded-bl-none",
      tagClass: "bg-ink-900 text-white",
      descClass: "text-ink-800",
      button: "bg-ink-900 text-white hover:bg-ink-800",
    },
  ];

  return (
    <section className={cn(CONTAINER, "grid pb-16 lg:grid-cols-2 lg:pb-24")}>
      {columns.map((col) => (
        <div key={col.tag} className={cn("flex flex-col gap-6 p-8 sm:p-14 lg:gap-7", col.box)}>
          <span className={cn("w-fit rounded-full px-3 py-1.5 text-xs font-bold", col.tagClass)}>
            {col.tag}
          </span>
          <h2 className="text-3xl leading-tight font-bold tracking-tight lg:text-[40px]">{col.title}</h2>
          <p className={cn("text-base", col.descClass)}>{col.desc}</p>
          <ul className="flex flex-col gap-3.5">
            {col.points.map((point) => (
              <li key={point.text} className="flex items-center gap-3 text-[15px] font-medium">
                <point.icon className="size-5 shrink-0" />
                {point.text}
              </li>
            ))}
          </ul>
          <Button asChild className={cn("mt-1 h-11 w-fit px-5 font-semibold", col.button)}>
            <Link href={col.href}>{col.cta}</Link>
          </Button>
        </div>
      ))}
    </section>
  );
}

const STEPS = [
  { icon: SearchIcon, title: "Pilih produk", desc: "Saring berdasarkan kategori, kondisi, dan harga." },
  { icon: ShoppingCartIcon, title: "Checkout", desc: "Isi data penerima, pilih dikirim atau ambil di toko." },
  { icon: LandmarkIcon, title: "Bayar", desc: "Tunai saat serah terima, atau transfer lalu unggah bukti." },
  { icon: PackageCheckIcon, title: "Terima barang", desc: "Pantau status pesanan sampai selesai." },
];

export function HowToOrder() {
  return (
    <section className="bg-ink-50 py-16 lg:py-[88px]" aria-labelledby="cara-pesan">
      <div className={cn(CONTAINER, "flex flex-col gap-10 lg:gap-12")}>
        <div className="flex flex-col gap-2.5">
          <h2 id="cara-pesan" className="text-3xl font-bold tracking-tight text-ink-900 lg:text-4xl">
            Cara pesan, empat langkah
          </h2>
          <p className="text-base text-ink-600">Tanpa perlu datang dulu untuk tanya harga dan stok</p>
        </div>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-full",
                    index === 0 ? "bg-brand-600 text-white" : "border border-ink-300 bg-white text-ink-900"
                  )}
                >
                  <step.icon className="size-5" />
                </span>
                {index < STEPS.length - 1 ? (
                  <span className="hidden h-px flex-1 bg-ink-300 lg:block" aria-hidden />
                ) : null}
              </div>
              <span className="font-mono text-xs text-ink-500">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="text-xl font-semibold text-ink-900">{step.title}</h3>
              <p className="text-sm text-ink-600">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function PromoBanner() {
  const categories = await getCategories();
  const weld = categories.find((c) => c.slug.includes("las") && Number(c.productCount) > 0);
  const content = weld
    ? {
        title: "Ada proyek las minggu depan?",
        desc: `${Number(weld.productCount)} ${weld.name.toLowerCase()} tersedia, siap diambil atau dikirim.`,
        cta: `Lihat ${weld.name}`,
        href: catalogHref({ categorySlug: weld.slug }),
      }
    : {
        title: "Butuh alat untuk proyek berikutnya?",
        desc: "Cek stok dan harga terbaru tanpa harus datang ke toko.",
        cta: "Lihat Katalog",
        href: "/produk",
      };

  return (
    <section className={cn(CONTAINER, "py-16 lg:py-24")}>
      <div className="relative isolate flex min-h-[320px] flex-col justify-end gap-5 overflow-hidden rounded-[28px] p-8 sm:p-14 lg:min-h-[380px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BANNER_IMAGE}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-20 size-full bg-ink-800 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/90 via-ink-900/55 to-ink-900/20" />
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[44px]">
          {content.title}
        </h2>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-ink-200 lg:text-[17px]">{content.desc}</p>
          <Button asChild className="h-12 w-fit px-[22px] font-semibold">
            <Link href={content.href}>{content.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export async function VisitStoreDetails() {
  const settings = await getStoreSettings();
  const rows = [
    { icon: MapPinIcon, label: "Alamat", value: settings.address },
    { icon: AlarmClockIcon, label: "Jam buka", value: settings.openingHours },
    { icon: PhoneIcon, label: "Telepon", value: settings.phone },
  ].filter((row) => row.value);

  return (
    <>
      {rows.length > 0 ? (
        <dl className="flex flex-col">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-4 border-b border-ink-200 py-[18px]">
              <row.icon className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <div className="flex flex-col gap-1">
                <dt className="text-[13px] text-ink-500">{row.label}</dt>
                <dd className="text-base font-medium whitespace-pre-line text-ink-900">{row.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-ink-500">Informasi kontak toko belum diisi.</p>
      )}
      <div className="flex flex-wrap gap-3">
        {settings.address ? (
          <Button asChild variant="outline" className="h-11 border-ink-300 px-4 font-semibold">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buka di Google Maps
            </a>
          </Button>
        ) : null}
        <Button asChild variant="ghost" className="h-11 px-4 font-semibold">
          <Link href="/kontak">Info kontak lengkap</Link>
        </Button>
      </div>
    </>
  );
}

export function VisitStoreSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2 border-b border-ink-200 pb-4">
          <Skeleton className="h-3 w-16 bg-ink-100" />
          <Skeleton className="h-4 w-64 max-w-full bg-ink-200" />
        </div>
      ))}
    </div>
  );
}

export function VisitStore({ children }: { children: React.ReactNode }) {
  return (
    <section
      className={cn(CONTAINER, "grid items-center gap-10 pb-16 lg:grid-cols-[620px_minmax(0,1fr)] lg:gap-14 lg:pb-24")}
      aria-labelledby="kunjungi-toko"
    >
      <div className="relative flex aspect-[31/22] items-center justify-center overflow-hidden rounded-3xl bg-brand-50">
        <div
          className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--color-brand-100)_1px,transparent_1px),linear-gradient(90deg,var(--color-brand-100)_1px,transparent_1px)] [background-size:40px_40px]"
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <StoreIcon className="size-9" />
          </span>
          <span className="font-heading text-xl font-bold text-brand-900">Cadas Jaya Teknik</span>
        </div>
      </div>
      <div className="flex flex-col gap-7">
        <span className="text-xs font-bold tracking-wider text-brand-600">KUNJUNGI TOKO</span>
        <h2 id="kunjungi-toko" className="-mt-4 text-3xl font-bold tracking-tight text-ink-900 lg:text-4xl">
          Mau lihat dan coba langsung? Mampir saja.
        </h2>
        {children}
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "Berapa lama stok dikunci setelah checkout?",
    a: "Untuk pembayaran transfer, unit dikunci 24 jam. Jika bukti belum diunggah, pesanan otomatis batal dan stok dilepas.",
  },
  {
    q: "Apakah barang bekas bergaransi?",
    a: "Unit bekas sudah dicek dan diuji nyala sebelum dipajang. Detail kondisi dan foto unit asli ada di halaman produk, jadi kamu bisa menilai sebelum memesan.",
  },
  {
    q: "Bisa bayar di tempat saat ambil barang?",
    a: "Bisa. Pilih metode tunai saat checkout, lalu bayar saat serah terima di toko. Owner mencatat pembayaran saat itu juga.",
  },
  {
    q: "Bagaimana jika bukti transfer saya ditolak?",
    a: "Pesanan kembali ke status menunggu pembayaran beserta catatan dari Owner. Kamu bisa mengunggah bukti baru dari halaman detail pesanan.",
  },
  {
    q: "Apakah bisa dikirim ke luar kota?",
    a: "Bisa. Pilih opsi dikirim saat checkout. Ongkos kirim dikonfirmasi Owner setelah pesanan dibuat.",
  },
];

export function Faq() {
  return (
    <section className="bg-ink-50 py-16 lg:py-[88px]" aria-labelledby="faq">
      <div className={cn(CONTAINER, "grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-20")}>
        <div className="flex flex-col gap-3">
          <h2 id="faq" className="text-3xl font-bold tracking-tight text-ink-900 lg:text-4xl">
            Pertanyaan yang sering masuk
          </h2>
          <p className="text-[15px] text-ink-600">Belum terjawab? Hubungi toko di jam operasional.</p>
        </div>
        <Accordion type="single" collapsible defaultValue="0" className="border-t border-ink-300">
          {FAQ.map((item, index) => (
            <AccordionItem key={item.q} value={String(index)} className="border-b border-ink-300">
              <AccordionTrigger className="py-[22px] text-base font-semibold text-ink-900 hover:no-underline sm:text-[17px]">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="max-w-[640px] pb-[22px] text-[15px] leading-relaxed text-ink-600">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
