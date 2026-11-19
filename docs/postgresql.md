# PostgreSQL (versi 18)

Sumber: Context7 `/websites/postgresql` versi 18 (postgresql.org/docs/18). Dipakai untuk penguncian stok dan perubahan status pesanan secara transaksional (PRD bagian 11).

## Penguncian baris: `SELECT ... FOR UPDATE`

`FOR UPDATE` mengunci baris hasil `SELECT` seolah-olah akan di-update. Transaksi lain yang mencoba `UPDATE`, `DELETE`, atau `SELECT FOR UPDATE/SHARE/...` pada baris itu **menunggu** sampai transaksi pemegang kunci selesai.

Pola untuk mengurangi stok:

```sql
BEGIN;
SELECT stok FROM produk WHERE id = $1 FOR UPDATE;
-- cek stok cukup di aplikasi, lalu:
UPDATE produk SET stok = stok - $2 WHERE id = $1;
COMMIT;
```

Peringatan penting dari dokumentasi (13.4.2): `SELECT FOR UPDATE` hanya memblokir sementara. Begitu pemegang kunci commit atau rollback, transaksi yang menunggu akan lanjut. Karena itu, perubahan stok harus benar-benar di-`UPDATE` selagi kunci dipegang.

Sumber: https://www.postgresql.org/docs/18/explicit-locking.html , https://www.postgresql.org/docs/18/applevel-consistency.html

## Isolation level

- **Read Committed** (default): `UPDATE`/`DELETE`/`SELECT FOR UPDATE` yang menemukan baris sudah diubah transaksi lain akan menunggu. Jika yang pertama commit, kondisi `WHERE` dievaluasi ulang terhadap versi baris terbaru.
- **Repeatable Read / Serializable**: jika baris yang akan dikunci sudah berubah sejak transaksi mulai, terjadi error serialisasi. Aplikasi harus membatalkan dan **mengulang seluruh transaksi**. Hanya transaksi yang menulis yang mungkin perlu diulang.

```sql
START TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

Untuk toko ini, Read Committed ditambah `FOR UPDATE` pada baris produk sudah cukup. Isolation lebih tinggi hanya diperlukan bila ada logika yang membaca banyak baris sekaligus.

Sumber: https://www.postgresql.org/docs/18/transaction-iso.html , https://www.postgresql.org/docs/18/sql-start-transaction.html

## Constraint

```sql
CREATE TABLE produk (
    id      integer PRIMARY KEY,
    sku     text UNIQUE,
    nama    text,
    harga   numeric CHECK (harga > 0),
    stok    integer CHECK (stok >= 0)
);

ALTER TABLE produk ADD CHECK (nama <> '');
ALTER TABLE produk ADD CONSTRAINT sku_unik UNIQUE (sku);
ALTER TABLE pesanan_item ADD FOREIGN KEY (produk_id) REFERENCES produk;
```

`CHECK (stok >= 0)` adalah jaring pengaman terakhir agar stok tidak pernah negatif, walau ada bug di aplikasi. Gunakan `numeric` (bukan `float`) untuk harga.

Sumber: https://www.postgresql.org/docs/18/ddl-constraints.html , https://www.postgresql.org/docs/18/ddl-alter.html
