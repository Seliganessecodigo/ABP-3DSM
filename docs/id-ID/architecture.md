# Arsitektur

Bagian ini untuk pengembangan dan operasi: lingkungan lokal, kontrak dan pemeriksaan. Untuk penggunaan produk, baca panduan penggunaan.

## Dokumentasi teknis {#components}

React 19/TypeScript/Vite menyajikan data; NestJS/TypeORM/PostgreSQL 18 mengintegrasikan/menyimpan. Hanya backend mengakses sumber tambahan. Controller: transport; service: kasus penggunaan; adapter: validasi; repository: persistensi. Guard global dan pengecualian `PublicRoute`. Preferensi per pengguna; audit di `backend/src/shared/audit/`, ikut transaksi mutasi sukses.

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## Masuk {#security}

Dashboard dan kueri lingkungan bersifat publik. `/login` menerima email/kata sandi atau Google yang diaktifkan. Admin harus menyiapkan/mengonfirmasi TOTP enam digit, termasuk setelah Google; Analyst/Visitor tidak mendapat izin administratif. Sesi frontend hanya di memori; reload memerlukan login ulang. Backend memeriksa JWT, sesi, peran dan status terkini; 401 untuk kredensial hilang/tidak valid, 403 untuk peran tidak cukup. Rute baru terlindungi secara default.

Admin organisasi yang sama mengubah akun antara `ACTIVE`, `BLOCKED`, `DEACTIVATED`, dengan `expectedStatus` dan alasan. Blokir/nonaktif mencabut semua sesi; aktif ulang memerlukan login baru. Akun sendiri dan Admin aktif terakhir dilindungi. Konflik status harapan: 409; target sudah tercapai: sukses idempoten. Audit bersama menulis sukses dalam transaksi mutasi dan penolakan di luar rollback, dengan aktor eksplisit tanpa rahasia. Rute ini tidak menyediakan pengelolaan peran lengkap atau pemulihan kata sandi.

## Periode dan riwayat {#data}

`from`, `to` memerlukan RFC 3339 dengan zona eksplisit; `[from,to)` dinormalisasi UTC. `hour`, `day`, `month`, `year`, maksimum 10.000 titik; kelebihan ditolak. Nilai tersimpan dibagi sesuai irisan. `collectedAt` terbaru menang, lalu ID leksikal naik; tanpa kembali ke observasi lama jika pemenang tidak mendukung metrik.

Metrik sumber tidak memiliki waktu pengukuran; interval dari penerimaan dikurangi `collection_interval_seconds`. Waktu kueri faktor bukan masa berlaku; sumber/validitas tidak diterbitkan tetap tak diketahui. Energi/faktor/emisi 8 desimal, cakupan4; tanpa pembulatan antara. Cakupan terpisah dan snapshot asli dipertahankan.

## Bacaan terkait {#related}

[Referensi API](./reference/api) · [Memulai](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
