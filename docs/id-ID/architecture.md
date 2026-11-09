# Arsitektur

Acuan: `origin/develop`, commit `c343698`, diperiksa 08-11-2026. Lingkungan dapat memakai revisi berbeda; merge tidak membuktikan deployment.

React 19/TypeScript/Vite menyajikan data; NestJS/TypeORM/PostgreSQL 18 mengintegrasikan/menyimpan. Hanya backend mengakses sumber tambahan. Controller: transport; service: kasus penggunaan; adapter: validasi; repository: persistensi. Guard global dan pengecualian `PublicRoute`. Preferensi per pengguna; audit di `backend/src/shared/audit/`, ikut transaksi mutasi sukses.

Katalog/detail menyimpan identitas, lokasi, metrik dan waktu. Pencarian nama/ID/wilayah, status dan halaman disimpan di URL. Polling 60 detik setelah tiap percobaan independen dari pengumpulan backend. Kegagalan setelah sukses mempertahankan data/waktu lama. `AVAILABLE`, `UNAVAILABLE`, `NO_METRICS`, `REMOVED` bukan konsumsi; hilang/error/stale bukan nol. Kota boleh null. Insiden pulih setelah tiga observasi valid berturut-turut; kegagalan sumber tidak mengonfirmasi penghapusan.

Model `simplified-energy`, versi `1`: CPU 100% = 100 W, memori 0,375 W/GB, disk 0,01 W/GB, jaringan 0,02 W/GB. Parameter sederhana, bukan pengukuran listrik atau faktor wilayah resmi. Daya dijumlahkan; energi = W × jam / 1000; CO₂e[g] = kWh × gCO₂e/kWh. Snapshot menyimpan metode/faktor; pratinjau faktor saat ini tidak menulis ulang aslinya.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[Visi dan cakupan](./product/vision) · [Panduan penggunaan](./guide/monitoring) · [Metodologi dan data](./product/methodology) · [Kualitas dan penerimaan](./product/quality) · [Keputusan dan dependensi](./product/decisions) · [Referensi API](./reference/api) · [Operasi dan diagnosis](./operations) · [Memulai](./getting-started) · [Arsitektur](./architecture) · [Kontribusi](./contributing) · [Backlog produk](./roadmap)
