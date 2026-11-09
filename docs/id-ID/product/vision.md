# Visi dan cakupan

Acuan: `origin/develop`, commit `c343698`, diperiksa 08-11-2026. Lingkungan dapat memakai revisi berbeda; merge tidak membuktikan deployment.

GreenER memantau aplikasi dan memperkirakan energi serta CO₂e. Katalog, dashboard, detail, riwayat, pratinjau hitung ulang, metodologi dan login tersedia. Antarmuka dan dokumentasi mendukung 12 bahasa: `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN`, `id-ID`. Fallback frontend adalah bahasa Inggris.

Di `/dashboard`, pilih 24 jam, 7, 30 atau 90 hari, status dan wilayah. Tersedia total, cakupan, jumlah per status serta komposisi emisi batang/donat. Tabel mendukung pencarian, filter kolom, urutan energi/CO₂e dan halaman; filter tabel tidak mengubah total ringkasan. Buka aplikasi untuk menelusuri bukti. `GET /analysis/summary` diperbarui berkala tanpa reload.

Di `/history`, pilih aplikasi; `applicationId`, periode dan granularitas menyimpan konteks URL. Tersedia deret tersimpan, filter, zona waktu tampilan, peristiwa, halaman bernomor dan pemeriksaan bucket. Kontribusi juga memiliki paginasi interaktif 5, 10, 15, 20 atau semua. Bucket backend tetap UTC; zona tampilan tidak mengelompokkan ulang. Overlay detail membandingkan aplikasi yang sama dengan jendela sebelumnya berdurasi sama.

Di `/administration/calculations`, pilih aplikasi/tanggal untuk membandingkan asli/pratinjau. Tanggal akhir mencakup seluruh hari UTC; API menerima `[from,to)`. Pratinjau publik menggunakan model saat ini dan faktor saat ini untuk wilayah historis, tanpa menyimpan. Batas: 30 hari, 10.000 observasi. Respons: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Kegagalan faktor mempertahankan energi yang dapat dihitung, CO₂e tidak tersedia. Persentase memerlukan satuan/cakupan sama dan acuan positif.

Dashboard dan kueri lingkungan bersifat publik. `/login` menerima email/kata sandi atau Google yang diaktifkan. Admin harus menyiapkan/mengonfirmasi TOTP enam digit, termasuk setelah Google; Analyst/Visitor tidak mendapat izin administratif. Sesi frontend hanya di memori; reload memerlukan login ulang. Backend memeriksa JWT, sesi, peran dan status terkini; 401 untuk kredensial hilang/tidak valid, 403 untuk peran tidak cukup. Rute baru terlindungi secara default.

`/methodology` memiliki tab energi, emisi, cakupan dan analisis dengan contoh/preferensi pribadi. Setiap peran terautentikasi hanya menyimpan tab sendiri, dengan revisi optimistis; konflik 409. Ambang tampilan tidak mengubah pengaturan global, hitungan atau notifikasi eksternal. Periode/granularitas tersimpan hanya mengisi parameter detail URL yang kosong. Metodologi historis tetap di `/services/:id/methodology`, dengan `collectionId` terpilih.

Admin organisasi yang sama mengubah akun antara `ACTIVE`, `BLOCKED`, `DEACTIVATED`, dengan `expectedStatus` dan alasan. Blokir/nonaktif mencabut semua sesi; aktif ulang memerlukan login baru. Akun sendiri dan Admin aktif terakhir dilindungi. Konflik status harapan: 409; target sudah tercapai: sukses idempoten. Audit bersama menulis sukses dalam transaksi mutasi dan penolakan di luar rollback, dengan aktor eksplisit tanpa rahasia. Rute ini tidak menyediakan pengelolaan peran lengkap atau pemulihan kata sandi.

Belum tersedia: perbandingan khusus dua aplikasi, simulasi wilayah, pengelolaan umum pengguna/peran, pemulihan kata sandi mandiri, konfigurasi global/jeda pemantauan dan CSV. Urutan berdasarkan dampak tersedia. Kuota eksternal, retensi, backup/pemulihan dan target operasi perlu keputusan; tidak ada SLA. Pemulihan TOTP oleh dukungan bukan reset kata sandi.

[Visi dan cakupan](../product/vision) · [Panduan penggunaan](../guide/monitoring) · [Metodologi dan data](../product/methodology) · [Kualitas dan penerimaan](../product/quality) · [Keputusan dan dependensi](../product/decisions) · [Referensi API](../reference/api) · [Operasi dan diagnosis](../operations) · [Memulai](../getting-started) · [Arsitektur](../architecture) · [Kontribusi](../contributing) · [Backlog produk](../roadmap)
