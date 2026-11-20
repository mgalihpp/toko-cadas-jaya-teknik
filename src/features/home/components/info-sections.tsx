import {
  AlarmClockIcon,
  MapPinIcon,
  PhoneIcon,
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
import { CONTAINER } from "@/features/catalog";
import { GoogleMapsIcon } from "@/components/shared/google-maps-icon";
import { STORE_MAPS_URL } from "@/features/contact/store-location";
import { cn } from "@/lib/utils";
import { getStoreSettings } from "../data";

const STORE_PHOTO = "/images/toko-cadas-jaya-teknik.jpg";

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
            <div
              key={row.label}
              className="flex gap-4 border-b border-ink-200 py-[18px]"
            >
              <row.icon className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <div className="flex flex-col gap-1">
                <dt className="text-[13px] text-ink-500">{row.label}</dt>
                <dd className="text-base font-medium whitespace-pre-line text-ink-900">
                  {row.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-ink-500">Info kontak toko belum tersedia.</p>
      )}
      <div className="flex flex-wrap gap-3">
        {settings.address ? (
          <Button
            asChild
            variant="outline"
            className="h-11 border-ink-300 px-4 font-semibold"
          >
            <a href={STORE_MAPS_URL} target="_blank" rel="noopener noreferrer">
              <GoogleMapsIcon className="size-4" />
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
        <div
          key={i}
          className="flex flex-col gap-2 border-b border-ink-200 pb-4"
        >
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
      className={cn(
        CONTAINER,
        "grid items-center gap-10 pb-16 lg:grid-cols-[620px_minmax(0,1fr)] lg:gap-14 lg:pb-24",
      )}
      aria-labelledby="kunjungi-toko"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STORE_PHOTO}
        alt="Etalase Cadas Jaya Teknik"
        loading="lazy"
        className="aspect-[31/22] w-full rounded-3xl bg-brand-50 object-cover object-[50%_60%]"
      />
      <div className="flex flex-col gap-7">
        <h2
          id="kunjungi-toko"
          className="-mt-4 text-3xl font-bold tracking-tight text-ink-900 lg:text-4xl"
        >
          Datang aja, pegang alatnya langsung.
        </h2>
        {children}
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "Berapa lama barang ditahan setelah saya pesan?",
    a: "Kalau bayar transfer, barangnya kami tahan 24 jam untukmu. Jika bukti transfer belum dikirim dalam waktu itu, pesanan dibatalkan dan barangnya dijual lagi.",
  },
  {
    q: "Apakah barang bekas bergaransi?",
    a: "Alat bekas kami cek dan tes dulu sebelum dijual. Kondisi dan foto aslinya ada di halaman produk, jadi kamu bisa menilai sebelum memesan.",
  },
  {
    q: "Bisa bayar di tempat saat ambil barang?",
    a: "Bisa. Pilih bayar tunai saat memesan, lalu bayar saat mengambil barang di toko.",
  },
  {
    q: "Bagaimana kalau bukti transfer saya ditolak?",
    a: "Kami akan kabari alasannya, lalu kamu bisa mengirim bukti transfer yang baru lewat halaman pesananmu.",
  },
  {
    q: "Apakah bisa dikirim ke luar kota?",
    a: "Bisa. Pilih opsi dikirim saat memesan. Ongkos kirim kami konfirmasi setelah pesanan dibuat.",
  },
];

export function Faq() {
  return (
    <section className="bg-ink-50 py-16 lg:py-[88px]" aria-labelledby="faq">
      <div
        className={cn(
          CONTAINER,
          "grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-20",
        )}
      >
        <div className="flex flex-col gap-3">
          <h2
            id="faq"
            className="text-3xl font-bold tracking-tight text-ink-900 lg:text-4xl"
          >
            Masih ada yang bikin ragu?
          </h2>
          <p className="text-[15px] text-ink-600">
            Kalau belum ketemu jawabannya, tanya langsung aja ke toko di jam
            buka.
          </p>
        </div>
        <Accordion
          type="single"
          collapsible
          defaultValue="0"
          className="border-t border-ink-300"
        >
          {FAQ.map((item, index) => (
            <AccordionItem
              key={item.q}
              value={String(index)}
              className="border-b border-ink-300"
            >
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


