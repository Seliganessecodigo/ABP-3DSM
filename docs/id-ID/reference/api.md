# Referensi API

Referensi integrasi API GreenER. Tipe, field opsional dan batas lengkap di `/openapi.json`, Swagger di `/docs`. Katalog/riwayat membaca data tersimpan; pratinjau dan rute karbon dapat memanggil sumber intensitas.

## Kueri publik {#public}

| HTTP | URI | Akses |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/applications` | — |
| GET | `/applications/{id}` | — |
| GET | `/applications/{id}/collections/latest` | — |
| GET | `/applications/{id}/collections/{collectionId}` | — |
| GET | `/applications/{id}/analysis` | — |
| GET | `/applications/{id}/analysis/series` | — |
| GET | `/applications/{id}/analysis/series/contributions` | — |
| GET | `/analysis/summary` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |

## Periode dan riwayat {#queries}

`from`, `to` memerlukan RFC 3339 dengan zona eksplisit; `[from,to)` dinormalisasi UTC. `hour`, `day`, `month`, `year`, maksimum 10.000 titik; kelebihan ditolak. Nilai tersimpan dibagi sesuai irisan. `collectedAt` terbaru menang, lalu ID leksikal naik; tanpa kembali ke observasi lama jika pemenang tidak mendukung metrik.

| URI | Parameter |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

Metrik sumber tidak memiliki waktu pengukuran; interval dari penerimaan dikurangi `collection_interval_seconds`. Waktu kueri faktor bukan masa berlaku; sumber/validitas tidak diterbitkan tetap tak diketahui. Energi/faktor/emisi 8 desimal, cakupan4; tanpa pembulatan antara. Cakupan terpisah dan snapshot asli dipertahankan.

## Masuk {#login}

Dashboard dan kueri lingkungan bersifat publik. `/login` menerima email/kata sandi atau Google yang diaktifkan. Admin harus menyiapkan/mengonfirmasi TOTP enam digit, termasuk setelah Google; Analyst/Visitor tidak mendapat izin administratif. Sesi frontend hanya di memori; reload memerlukan login ulang. Backend memeriksa JWT, sesi, peran dan status terkini; 401 untuk kredensial hilang/tidak valid, 403 untuk peran tidak cukup. Rute baru terlindungi secara default.

| HTTP | URI | Akses |
| --- | --- | --- |
| POST | `/auth/login` | `email + password` |
| GET | `/auth/sso/google` | `PKCE` |
| GET | `/auth/sso/google/callback` | `state + cookie` |
| POST | `/auth/sso/handoff/exchange` | `code + PKCE` |
| POST | `/auth/totp/setup` | `setupToken` |
| POST | `/auth/totp/setup/confirm` | `setupToken + TOTP` |
| POST | `/auth/totp/challenge` | `challengeToken + TOTP` |
| POST | `/auth/sessions/refresh` | `refreshToken` |
| POST | `/auth/invitations/accept` | `token` |
| POST | `/auth/email/confirm` | `token + password` |
| POST | `/auth/email/confirmation/resend` | `organization + email` |

## Operasi terlindungi {#protected}

| HTTP | URI | Akses |
| --- | --- | --- |
| GET | `/auth/me` | `JWT` |
| POST | `/auth/sessions/logout` | `JWT` |
| POST | `/auth/totp/replacement` | `JWT + password + TOTP` |
| POST | `/auth/totp/replacement/confirm` | `JWT + confirmationToken + TOTP` |
| GET | `/me/preferences` | `JWT` |
| PUT | `/me/preferences/{tab}` | `JWT` |
| POST | `/auth/sso/invitations` | `JWT + ADMIN` |
| DELETE | `/auth/sso/identities/{userId}` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/status` | `JWT + ADMIN` |
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

Admin organisasi yang sama mengubah akun antara `ACTIVE`, `BLOCKED`, `DEACTIVATED`, dengan `expectedStatus` dan alasan. Blokir/nonaktif mencabut semua sesi; aktif ulang memerlukan login baru. Akun sendiri dan Admin aktif terakhir dilindungi. Konflik status harapan: 409; target sudah tercapai: sukses idempoten. Audit bersama menulis sukses dalam transaksi mutasi dan penolakan di luar rollback, dengan aktor eksplisit tanpa rahasia. Rute ini tidak menyediakan pengelolaan peran lengkap atau pemulihan kata sandi.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Mengelola akun melalui API {#accounts}

Hanya Admin aktif dalam organisasi yang sama yang dapat melihat dan membuat akun atau mengubah peran. Pembuatan menerima `name`, `email`, `role`, dan `reason`, tanpa kata sandi atau verifikasi email otomatis. Pemilik akun menetapkan kata sandi melalui alur konfirmasi yang sudah ada; pengiriman konfirmasi diminta secara terpisah. Layar pengelolaan dan pemulihan kata sandi tetap menjadi pekerjaan tersendiri.

Daftar menerapkan pencarian dan filter sebelum pengurutan dan paginasi. Nilai bawaan adalah 10 item, dengan pilihan 5, 10, 15, 20, serta `all` untuk seluruh hasil filter. Label terjemahan harus dipetakan ke kode enum dan tanggal lokal ke RFC 3339 dengan offset zona waktu. Nilai yang tidak ada berada di akhir pada kedua arah pengurutan; nilai yang sama diurutkan berdasarkan pengenal.

Perubahan peran memerlukan `expectedRole` dan `reason`. Perubahan mencabut sesi dan kredensial TOTP sementara, mempertahankan audit, serta mencegah penghapusan akses sendiri atau Admin aktif terakhir dengan email terkonfirmasi. Akun yang belum dikonfirmasi tidak menggantikan administrator tersebut. Pemberian peran Admin tetap mewajibkan TOTP.

## Bandingkan dengan pratinjau hitung ulang {#preview}

Di `/administration/calculations`, pilih aplikasi/tanggal untuk membandingkan asli/pratinjau. Tanggal akhir mencakup seluruh hari UTC; API menerima `[from,to)`. Pratinjau publik menggunakan model saat ini dan faktor saat ini untuk wilayah historis, tanpa menyimpan. Batas: 30 hari, 10.000 observasi. Respons: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Kegagalan faktor mempertahankan energi yang dapat dihitung, CO₂e tidak tersedia. Persentase memerlukan satuan/cakupan sama dan acuan positif.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Personalisasi analisis {#preferences}

`/methodology` memiliki tab energi, emisi, cakupan dan analisis dengan contoh/preferensi pribadi. Setiap peran terautentikasi hanya menyimpan tab sendiri, dengan revisi optimistis; konflik 409. Ambang tampilan tidak mengubah pengaturan global, hitungan atau notifikasi eksternal. Periode/granularitas tersimpan hanya mengisi parameter detail URL yang kosong. Metodologi historis tetap di `/services/:id/methodology`, dengan `collectionId` terpilih.

```text
GET /me/preferences → { energy, emissions, coverage, analysis }
null | { value, revision, updatedAt }
PUT /me/preferences/{tab} ← { expectedRevision, value }
expectedRevision: 0 → create
threshold ≥ 0; finite number; thresholdPercent: 0–100
unknown fields / partial bodies / numeric strings → 400
```

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled}`; 0–100 |
| analysis | `{periodDays: 7 / 30, granularity: "hour" / "day"}` |

## Penanganan kesalahan {#errors}

Tangani HTTP status dan kode terstruktur; pesan bukan kontrak terjemahan. `null` berarti hilang, bukan nol. Daftar kosong valid, berbeda dari kegagalan kueri. Tafsirkan kode sesuai operasi.

| HTTP | Kode |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## Kontrak HTTP {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## Bacaan terkait {#related}

[Operasi dan diagnosis](../operations) · [Metodologi dan data](../product/methodology)
