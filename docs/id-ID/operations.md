# Operasi dan diagnosis

Acuan: `origin/develop`, commit `c343698`, diperiksa 08-11-2026. Lingkungan dapat memakai revisi berbeda; merge tidak membuktikan deployment.

Gunakan Node.js 24+, npm dan Docker Compose v2. Salin `.env.example` ke `.env`, jalankan `npm run dev`. Compose menerapkan migration dan mencoba penemuan; kegagalan sumber tidak menghalangi API mulai. SMTP diperlukan untuk undangan/konfirmasi. Admin pertama: `organizations:create-invitation` di `backend/`, dengan `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Tidak ada Admin produksi universal.

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

Dashboard dan kueri lingkungan bersifat publik. `/login` menerima email/kata sandi atau Google yang diaktifkan. Admin harus menyiapkan/mengonfirmasi TOTP enam digit, termasuk setelah Google; Analyst/Visitor tidak mendapat izin administratif. Sesi frontend hanya di memori; reload memerlukan login ulang. Backend memeriksa JWT, sesi, peran dan status terkini; 401 untuk kredensial hilang/tidak valid, 403 untuk peran tidak cukup. Rute baru terlindungi secara default.

Admin organisasi yang sama mengubah akun antara `ACTIVE`, `BLOCKED`, `DEACTIVATED`, dengan `expectedStatus` dan alasan. Blokir/nonaktif mencabut semua sesi; aktif ulang memerlukan login baru. Akun sendiri dan Admin aktif terakhir dilindungi. Konflik status harapan: 409; target sudah tercapai: sukses idempoten. Audit bersama menulis sukses dalam transaksi mutasi dan penolakan di luar rollback, dengan aktor eksplisit tanpa rahasia. Rute ini tidak menyediakan pengelolaan peran lengkap atau pemulihan kata sandi.

`MONITORING_SCHEDULE_INTERVAL_SECONDS=60`, `MONITORING_METRICS_CONCURRENCY=2`.

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

Belum tersedia: perbandingan khusus dua aplikasi, simulasi wilayah, pengelolaan umum pengguna/peran, pemulihan kata sandi mandiri, konfigurasi global/jeda pemantauan dan CSV. Urutan berdasarkan dampak tersedia. Kuota eksternal, retensi, backup/pemulihan dan target operasi perlu keputusan; tidak ada SLA. Pemulihan TOTP oleh dukungan bukan reset kata sandi.

[Visi dan cakupan](./product/vision) · [Panduan penggunaan](./guide/monitoring) · [Metodologi dan data](./product/methodology) · [Kualitas dan penerimaan](./product/quality) · [Keputusan dan dependensi](./product/decisions) · [Referensi API](./reference/api) · [Operasi dan diagnosis](./operations) · [Memulai](./getting-started) · [Arsitektur](./architecture) · [Kontribusi](./contributing) · [Backlog produk](./roadmap)


Daftarkan URI `GOOGLE_CALLBACK_URL` persis di Google Cloud. `VITE_GOOGLE_SSO_ENABLED=true` hanya mengaktifkan tombol, bukan konfigurasi backend atau pembuatan akun: tautan memerlukan undangan. `GOOGLE_CLIENT_SECRET`, JWT, pepper dan kunci TOTP adalah rahasia backend; gunakan nilai independen dan pertahankan versi lama yang diperlukan. SMTP mengirim undangan/konfirmasi. Dukungan menjalankan `authentication:recover-admin-totp` setelah verifikasi otoritas organisasi secara independen; sesi dicabut dan operasi diaudit.

Variabel monitoring harus bilangan bulat positif; Compose saat ini tidak meneruskan keduanya dari `.env` ke container API otomatis, perlu pemetaan environment. Pencegahan overlap per proses, bukan kunci terdistribusi antarreplika. `/health` tidak membuktikan sumber dapat diakses atau data dapat dihitung. Staging dari `develop` setelah CI menerbitkan API ke Azure App Service, frontend ke Static Web Apps dan menjalankan smoke test. Dokumentasi ke GitHub Pages. Tidak ada restore DB otomatis; `dev:down` mempertahankan volume.
