# Memulai

Acuan: `origin/develop`, commit `c343698`, diperiksa 08-11-2026. Lingkungan dapat memakai revisi berbeda; merge tidak membuktikan deployment.

Gunakan Node.js 24+, npm dan Docker Compose v2. Salin `.env.example` ke `.env`, jalankan `npm run dev`. Compose menerapkan migration dan mencoba penemuan; kegagalan sumber tidak menghalangi API mulai. SMTP diperlukan untuk undangan/konfirmasi. Admin pertama: `organizations:create-invitation` di `backend/`, dengan `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Tidak ada Admin produksi universal.

```powershell
Copy-Item .env.example .env
```

```sh
# macOS / Linux
cp .env.example .env
npm run dev
```

| HTTP | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

[Visi dan cakupan](./product/vision) · [Panduan penggunaan](./guide/monitoring) · [Metodologi dan data](./product/methodology) · [Kualitas dan penerimaan](./product/quality) · [Keputusan dan dependensi](./product/decisions) · [Referensi API](./reference/api) · [Operasi dan diagnosis](./operations) · [Memulai](./getting-started) · [Arsitektur](./architecture) · [Kontribusi](./contributing) · [Backlog produk](./roadmap)
