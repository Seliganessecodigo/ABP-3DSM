# Kualitas dan penerimaan

Acuan: `origin/develop`, commit `c343698`, diperiksa 08-11-2026. Lingkungan dapat memakai revisi berbeda; merge tidak membuktikan deployment.

CI memeriksa build dokumentasi, lint/test/build frontend, lint/typecheck/test PostgreSQL/cakupan/build/migration backend dan alur browser terintegrasi nyata. `TEST_DATABASE_URL` harus PostgreSQL terisolasi; tanpa variabel, Jest melewati suite database dan browser integrasi gagal. SonarQube wajib untuk PR ke `develop`: cakupan baru ≥80%, duplikasi ≤3%, rating A, seluruh hotspot ditinjau. Otomatisasi tidak mengganti evaluasi kegunaan/penerimaan produk.

Katalog/detail menyimpan identitas, lokasi, metrik dan waktu. Pencarian nama/ID/wilayah, status dan halaman disimpan di URL. Polling 60 detik setelah tiap percobaan independen dari pengumpulan backend. Kegagalan setelah sukses mempertahankan data/waktu lama. `AVAILABLE`, `UNAVAILABLE`, `NO_METRICS`, `REMOVED` bukan konsumsi; hilang/error/stale bukan nol. Kota boleh null. Insiden pulih setelah tiga observasi valid berturut-turut; kegagalan sumber tidak mengonfirmasi penghapusan.

Admin organisasi yang sama mengubah akun antara `ACTIVE`, `BLOCKED`, `DEACTIVATED`, dengan `expectedStatus` dan alasan. Blokir/nonaktif mencabut semua sesi; aktif ulang memerlukan login baru. Akun sendiri dan Admin aktif terakhir dilindungi. Konflik status harapan: 409; target sudah tercapai: sukses idempoten. Audit bersama menulis sukses dalam transaksi mutasi dan penolakan di luar rollback, dengan aktor eksplisit tanpa rahasia. Rute ini tidak menyediakan pengelolaan peran lengkap atau pemulihan kata sandi.

Belum tersedia: perbandingan khusus dua aplikasi, simulasi wilayah, pengelolaan umum pengguna/peran, pemulihan kata sandi mandiri, konfigurasi global/jeda pemantauan dan CSV. Urutan berdasarkan dampak tersedia. Kuota eksternal, retensi, backup/pemulihan dan target operasi perlu keputusan; tidak ada SLA. Pemulihan TOTP oleh dukungan bukan reset kata sandi.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[Visi dan cakupan](../product/vision) · [Panduan penggunaan](../guide/monitoring) · [Metodologi dan data](../product/methodology) · [Kualitas dan penerimaan](../product/quality) · [Keputusan dan dependensi](../product/decisions) · [Referensi API](../reference/api) · [Operasi dan diagnosis](../operations) · [Memulai](../getting-started) · [Arsitektur](../architecture) · [Kontribusi](../contributing) · [Backlog produk](../roadmap)
