# Operasi dan diagnosis

Bagian ini untuk pengembangan dan operasi: lingkungan lokal, kontrak dan pemeriksaan. Untuk penggunaan produk, baca panduan penggunaan.

## Konfigurasi {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## Pemantauan otomatis {#monitoring}

Monitoring dimulai setelah interval pertama, tanpa overlap per proses. Interval/konkurensi bilangan bulat positif. Compose tidak meneruskan otomatis `MONITORING_SCHEDULE_INTERVAL_SECONDS`, `MONITORING_METRICS_CONCURRENCY` dari `.env`; perlu pemetaan eksplisit. `/health` memeriksa HTTP, bukan penemuan/perhitungan. Periksa katalog, bukti dan log. Kegagalan sumber tidak mengonfirmasi penghapusan; pulih setelah tiga observasi valid berturut-turut.

Ketiadaan pertama pada snapshot lengkap dan valid mengonfirmasi penghapusan. Tiap panggilan eksternal memiliki batas total30 detik dan paling banyak tiga percobaan HTTP termasuk awal; hanya kegagalan sementara diulang.

## Masuk {#authentication}

Gunakan Node.js 24+, npm dan Docker Compose v2. Salin `.env.example` ke `.env`, jalankan `npm run dev`. Compose menerapkan migration dan mencoba penemuan; kegagalan sumber tidak menghalangi API mulai. SMTP diperlukan untuk undangan/konfirmasi. Admin pertama: `organizations:create-invitation` di `backend/`, dengan `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Tidak ada Admin produksi universal.

Akses pertama di situs memiliki dua langkah: buka undangan di `/setup-admin`, masukkan nama dan email, lalu buka konfirmasi di `/confirm-email` untuk membuat kata sandi. Setelah itu, masuk dan siapkan autentikator wajib Admin. Tautan tidak valid, kedaluwarsa, atau sudah digunakan menjelaskan cara meminta pengganti; token dihapus dari URL dan hanya disimpan dalam memori halaman. Setelah memuat ulang, buka kembali tautan email asli. SMTP harus mengirim ke kotak masuk nyata; alamat `.test` hanya contoh. Di Azure, operator menerbitkan undangan pertama dari konsol backend yang dikonfigurasi dengan `npm run organizations:create-invitation:prod`; orang yang diundang menyelesaikan pendaftaran di situs. `APP_BASE_URL` harus mengarah ke frontend yang diterbitkan. `frontend/public/staticwebapp.config.json` memungkinkan akses langsung ke rute yang dihosting.

Di **Pengguna** (`/administration/users`), administrator dapat melihat akun organisasi dan mengirim undangan Google. **Tautkan Akun Google saya** mengisi formulir dengan data sendiri. Konfirmasikan pengiriman lalu buka tautan email dengan Akun Google beralamat sama. Kesamaan email tidak menautkan identitas secara otomatis. Akun baru muncul setelah penerimaan; undangan tertunda bukan akun. Pengiriman ulang membatalkan undangan sebelumnya. Akun yang ada mempertahankan nama, peran, dan sandi; administrator tetap memerlukan TOTP. Staging membaca `VITE_GOOGLE_SSO_ENABLED` dari variabel GitHub. Tetapkan `true` hanya setelah kredensial dan URL backend dikonfigurasi. `GOOGLE_CALLBACK_URL` adalah alamat API publik ditambah `/auth/sso/google/callback`, dan `SSO_RETURN_URL` adalah alamat frontend publik ditambah `/sso/callback`.

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

Daftarkan URI `GOOGLE_CALLBACK_URL` persis di Google Cloud. `VITE_GOOGLE_SSO_ENABLED=true` hanya mengaktifkan tombol, bukan konfigurasi backend atau pembuatan akun: tautan memerlukan undangan. `GOOGLE_CLIENT_SECRET`, JWT, pepper dan kunci TOTP adalah rahasia backend; gunakan nilai independen dan pertahankan versi lama yang diperlukan. SMTP mengirim undangan/konfirmasi. Dukungan menjalankan `authentication:recover-admin-totp` setelah verifikasi otoritas organisasi secara independen; sesi dicabut dan operasi diaudit.

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## Diagnosis {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## Publikasi dan pemulihan {#release}

Staging dari `develop` setelah CI: API ke Azure App Service, frontend ke Static Web Apps, pemeriksaan endpoint setelah API. Dokumentasi: GitHub Pages dengan `DOCS_BASE=/ABP-3DSM/`. Kenali tahap gagal sebelum mengulangi. Tidak ada restore DB otomatis. `npm run dev:down` menjaga volume; menghapusnya menghilangkan data lokal.

## Bacaan terkait {#related}

[Memulai](./getting-started) · [Referensi API](./reference/api)

## Mendiagnosis respons lambat {#response-performance}

Bandingkan waktu hingga byte pertama, ukuran respons dan rencana eksekusi sebelum menyalahkan basis data. Dashboard meminta `/analysis/summary` dengan `includeProvenance=false`: nilai, cakupan dan deret waktu dipertahankan; respons menunjukkan `provenanceIncluded=false` tanpa daftar asal data. Kueri lengkap tetap menjadi bawaan. Proyeksi ringkas tidak mengirim faktor setiap pengumpulan; perhitungan sudah mengurutkan interval sehingga pengurutan kedua dalam basis data tidak diperlukan.
