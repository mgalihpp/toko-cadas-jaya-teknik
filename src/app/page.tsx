import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">Cadas Jaya Teknik</h1>
      <p className="text-muted-foreground">Alat teknik siap kerja</p>
      <Button>Tambah ke Keranjang</Button>
    </main>
  );
}
