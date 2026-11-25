import type { Metadata } from "next";
import { TopBar } from "@/components/mobile/top-bar";

export const metadata: Metadata = { title: "Kebijakan privasi | Cadas Jaya Teknik" };

const SECTIONS = [
  {
    title: "Data yang kami simpan",
    body: "Nama, email, nomor telepon, alamat pengiriman, riwayat pesanan, dan bukti transfer yang kamu unggah. Kami hanya menyimpan data yang dibutuhkan untuk memproses pesananmu.",
  },
  {
    title: "Cara kami memakai data",
    body: "Data dipakai untuk membuat dan memantau pesanan, memeriksa pembayaran, serta menghubungimu bila ada kendala. Kami tidak menjual data pribadimu.",
  },
  {
    title: "Keamanan",
    body: "Kata sandi disimpan dalam bentuk terenkripsi. Hanya Owner dan pengelola toko yang dapat melihat pesanan dan bukti transfer.",
  },
  {
    title: "Menghubungi kami",
    body: "Untuk meminta perubahan atau penghapusan data, hubungi toko lewat halaman Kontak dan lokasi.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Kebijakan privasi" backHref="/saya" cart={false} />
      <div className="flex flex-col gap-1.5">
        {SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-1.5 bg-white p-4">
            <h2 className="text-[15px] font-bold text-ink-900">{section.title}</h2>
            <p className="text-sm leading-normal text-ink-900">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
