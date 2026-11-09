# Memulai

Bagian ini untuk pengembangan dan operasi: lingkungan lokal, kontrak dan pemeriksaan. Untuk penggunaan produk, baca panduan penggunaan.

## Konfigurasi {#requirements}

Gunakan Node.js 24+, npm dan Docker Compose v2. Salin `.env.example` ke `.env`, jalankan `npm run dev`. Compose menerapkan migration dan mencoba penemuan; kegagalan sumber tidak menghalangi API mulai. SMTP diperlukan untuk undangan/konfirmasi. Admin pertama: `organizations:create-invitation` di `backend/`, dengan `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Tidak ada Admin produksi universal.

## Mulai dari sini {#start}

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

```powershell
Copy-Item .env.example .env
```

```sh
cp .env.example .env
```

```sh
npm run dev
```

| Fitur | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## Konfigurasi {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## Bacaan terkait {#related}

[Panduan penggunaan](./guide/monitoring) · [Operasi dan diagnosis](./operations)
