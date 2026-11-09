# Keputusan dan dependensi

Acuan: `origin/develop`, commit `c343698`, diperiksa 08-11-2026. Lingkungan dapat memakai revisi berbeda; merge tidak membuktikan deployment.

Di `/administration/calculations`, pilih aplikasi/tanggal untuk membandingkan asli/pratinjau. Tanggal akhir mencakup seluruh hari UTC; API menerima `[from,to)`. Pratinjau publik menggunakan model saat ini dan faktor saat ini untuk wilayah historis, tanpa menyimpan. Batas: 30 hari, 10.000 observasi. Respons: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Kegagalan faktor mempertahankan energi yang dapat dihitung, CO₂e tidak tersedia. Persentase memerlukan satuan/cakupan sama dan acuan positif.

Dashboard dan kueri lingkungan bersifat publik. `/login` menerima email/kata sandi atau Google yang diaktifkan. Admin harus menyiapkan/mengonfirmasi TOTP enam digit, termasuk setelah Google; Analyst/Visitor tidak mendapat izin administratif. Sesi frontend hanya di memori; reload memerlukan login ulang. Backend memeriksa JWT, sesi, peran dan status terkini; 401 untuk kredensial hilang/tidak valid, 403 untuk peran tidak cukup. Rute baru terlindungi secara default.

Admin organisasi yang sama mengubah akun antara `ACTIVE`, `BLOCKED`, `DEACTIVATED`, dengan `expectedStatus` dan alasan. Blokir/nonaktif mencabut semua sesi; aktif ulang memerlukan login baru. Akun sendiri dan Admin aktif terakhir dilindungi. Konflik status harapan: 409; target sudah tercapai: sukses idempoten. Audit bersama menulis sukses dalam transaksi mutasi dan penolakan di luar rollback, dengan aktor eksplisit tanpa rahasia. Rute ini tidak menyediakan pengelolaan peran lengkap atau pemulihan kata sandi.

Kueri memerlukan `from`, `to` RFC 3339 dengan zona eksplisit; `[from,to)` dinormalisasi UTC. Granularitas `hour`, `day`, `month`, `year`, maksimum 10.000 titik. Nilai tersimpan dibagi proporsional terhadap irisan tanpa hitung ulang: `collectedAt` terbaru menang, seri memakai ID leksikal naik. Pemenang tidak valid tidak diganti data lama. Cakupan energi/CO₂e terpisah. `null` berarti hilang; nol dapat valid. Metrik sumber tidak memiliki waktu pengukuran: interval berasal dari penerimaan dikurangi `collection_interval_seconds`. Waktu kueri faktor bukan masa berlaku. Energi/faktor/emisi disimpan 8 desimal, cakupan 4.

Belum tersedia: perbandingan khusus dua aplikasi, simulasi wilayah, pengelolaan umum pengguna/peran, pemulihan kata sandi mandiri, konfigurasi global/jeda pemantauan dan CSV. Urutan berdasarkan dampak tersedia. Kuota eksternal, retensi, backup/pemulihan dan target operasi perlu keputusan; tidak ada SLA. Pemulihan TOTP oleh dukungan bukan reset kata sandi.

Issue: penerimaan/dependensi; Projects: prioritas/Sprint; Figma: maksud visual; kode/OpenAPI: kontrak nyata. Keputusan jangka panjang dicatat sebagai ADR. PR terbuka tidak menutup issue; pastikan merge/cakupan. ADR historis dipertahankan.

[Visi dan cakupan](../product/vision) · [Panduan penggunaan](../guide/monitoring) · [Metodologi dan data](../product/methodology) · [Kualitas dan penerimaan](../product/quality) · [Keputusan dan dependensi](../product/decisions) · [Referensi API](../reference/api) · [Operasi dan diagnosis](../operations) · [Memulai](../getting-started) · [Arsitektur](../architecture) · [Kontribusi](../contributing) · [Backlog produk](../roadmap)
